import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import { Analytics } from './analytics';

// Topic for broadcasting to all users
const ALL_USERS_TOPIC = 'all_users';

// Navigation callback - will be set by the app
let onNotificationNavigation: ((bookId: string) => void) | null = null;

// Notification events for analytics
export const NotificationEvents = {
  PERMISSION_GRANTED: 'notification_permission_granted',
  PERMISSION_DENIED: 'notification_permission_denied',
  TOKEN_REFRESHED: 'notification_token_refreshed',
  RECEIVED_FOREGROUND: 'notification_received_foreground',
  RECEIVED_BACKGROUND: 'notification_received_background',
  OPENED: 'notification_opened',
  TOPIC_SUBSCRIBED: 'notification_topic_subscribed',
} as const;

class NotificationService {
  private isInitialized: boolean = false;
  private pendingBookId: string | null = null;

  /**
   * Set the navigation callback for handling notification taps
   */
  setNavigationCallback(callback: (bookId: string) => void): void {
    onNotificationNavigation = callback;

    // If there's a pending navigation, execute it now
    if (this.pendingBookId) {
      callback(this.pendingBookId);
      this.pendingBookId = null;
    }
  }

  /**
   * Initialize push notifications
   * Call this on app startup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return;
      }

      // Subscribe to all_users topic for broadcast notifications
      await this.subscribeToTopic(ALL_USERS_TOPIC);

      // Set up message handlers
      this.setupForegroundHandler();
      this.setupBackgroundHandler();
      this.setupNotificationOpenedHandler();

      // Listen for token refresh
      this.setupTokenRefreshHandler();

      this.isInitialized = true;
      console.log('Notifications initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      Analytics.logError(error as Error, 'NotificationService.initialize');
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        await Analytics.track(NotificationEvents.PERMISSION_GRANTED);
        console.log('Notification permission granted');
      } else {
        await Analytics.track(NotificationEvents.PERMISSION_DENIED);
        console.log('Notification permission denied');
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get the FCM token for this device
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Subscribe to a topic for receiving broadcast notifications
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      await Analytics.track(NotificationEvents.TOPIC_SUBSCRIBED, { topic });
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`Error subscribing to topic ${topic}:`, error);
      Analytics.logError(error as Error, `NotificationService.subscribeToTopic: ${topic}`);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`Error unsubscribing from topic ${topic}:`, error);
    }
  }

  /**
   * Handle foreground messages (when app is open)
   */
  private setupForegroundHandler(): void {
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);
      await Analytics.track(NotificationEvents.RECEIVED_FOREGROUND, {
        message_id: remoteMessage.messageId,
        title: remoteMessage.notification?.title,
      });

      const title = remoteMessage.notification?.title || 'Shrota';
      const body = remoteMessage.notification?.body || '';
      const bookId = remoteMessage.data?.book_id as string | undefined;

      // Show alert with option to view book if book_id is present
      if (bookId) {
        Alert.alert(title, body, [
          { text: 'Dismiss', style: 'cancel' },
          {
            text: 'View Book',
            style: 'default',
            onPress: () => this.navigateToBook(bookId)
          },
        ]);
      } else {
        Alert.alert(title, body, [{ text: 'OK', style: 'default' }]);
      }
    });
  }

  /**
   * Handle background messages (when app is in background or killed)
   * This is set up as a top-level handler
   */
  private setupBackgroundHandler(): void {
    // Background handler is registered at the top level in index.js
    // This method is a placeholder for documentation
  }

  /**
   * Handle notification opened (when user taps on notification)
   */
  private setupNotificationOpenedHandler(): void {
    // When app is opened from a background notification
    messaging().onNotificationOpenedApp(async (remoteMessage) => {
      console.log('Notification opened (background):', remoteMessage);
      await Analytics.track(NotificationEvents.OPENED, {
        message_id: remoteMessage.messageId,
        title: remoteMessage.notification?.title,
        source: 'background',
        book_id: remoteMessage.data?.book_id,
      });

      // Handle deep linking based on notification data
      this.handleNotificationData(remoteMessage.data);
    });

    // Check if app was opened from a quit state notification
    messaging()
      .getInitialNotification()
      .then(async (remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened (quit state):', remoteMessage);
          await Analytics.track(NotificationEvents.OPENED, {
            message_id: remoteMessage.messageId,
            title: remoteMessage.notification?.title,
            source: 'quit',
            book_id: remoteMessage.data?.book_id,
          });

          // Handle deep linking based on notification data
          this.handleNotificationData(remoteMessage.data);
        }
      });
  }

  /**
   * Handle token refresh
   */
  private setupTokenRefreshHandler(): void {
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM token refreshed:', token.substring(0, 20) + '...');
      await Analytics.track(NotificationEvents.TOKEN_REFRESHED);
      // Token is automatically managed by FCM, no need to send to server
      // since we use topic-based messaging
    });
  }

  /**
   * Handle notification data for deep linking
   */
  private handleNotificationData(data?: { [key: string]: string }): void {
    if (!data) return;

    const bookId = data.book_id;
    if (bookId) {
      console.log('Notification contains book_id:', bookId);
      this.navigateToBook(bookId);
    }
  }

  /**
   * Navigate to a book's details page
   */
  private navigateToBook(bookId: string): void {
    if (onNotificationNavigation) {
      onNotificationNavigation(bookId);
    } else {
      // Navigation not ready yet, store for later
      console.log('Navigation not ready, storing book_id:', bookId);
      this.pendingBookId = bookId;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }
}

// Export singleton instance
export const Notifications = new NotificationService();

/**
 * Background message handler
 * This must be registered at the top level (index.js)
 */
export function setupBackgroundMessageHandler(): void {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background notification received:', remoteMessage);
    // Background notifications are automatically shown by the system
    // We just need to handle any data processing here
  });
}
