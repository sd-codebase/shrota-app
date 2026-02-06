import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import { Analytics } from './analytics';

// Topic for broadcasting to all users
const ALL_USERS_TOPIC = 'all_users';

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

      // Show an in-app alert for foreground notifications
      const title = remoteMessage.notification?.title || 'Shrota';
      const body = remoteMessage.notification?.body || '';

      Alert.alert(title, body, [{ text: 'OK', style: 'default' }]);
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

    // Handle deep linking based on notification data
    // For example, if notification contains a book_id, navigate to that book
    if (data.book_id) {
      // Navigation will be handled by the app's linking configuration
      console.log('Notification contains book_id:', data.book_id);
    }

    if (data.screen) {
      console.log('Notification contains screen:', data.screen);
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
