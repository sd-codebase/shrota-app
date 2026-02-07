import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import { AppNavigator, navigate } from './src/navigation';
import { PlayerProvider, usePlayer } from './src/context/PlayerContext';
import { DownloadProvider } from './src/context/DownloadContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { setupPlayer } from './src/services/trackPlayerService';
import { Notifications } from './src/services/notifications';
import { checkWhatsAppReminder } from './src/services/whatsappReminder';

// Component to handle notification press navigation
function NotificationHandler() {
  const { currentBook } = usePlayer();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      // App coming to foreground from background
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // Check if there's an active track playing
        const activeTrack = await TrackPlayer.getActiveTrack();
        if (activeTrack && currentBook) {
          // Navigate to player screen
          navigate('Player', { book: currentBook });
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [currentBook]);

  return null;
}

// Component to handle WhatsApp verification reminders and periodic status polling
const STATUS_POLL_INTERVAL = 30 * 60 * 1000; // 30 minutes

function WhatsAppReminderHandler() {
  const { token, user, isAuthenticated, refreshUser } = useAuth();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (isAuthenticated) {
      checkWhatsAppReminder(token);
    }
  }, [isAuthenticated, token]);

  // Poll every 15 minutes if WhatsApp not yet verified
  useEffect(() => {
    if (!isAuthenticated || !token || user?.is_whatsapp_verified) return;

    const interval = setInterval(() => {
      refreshUser();
      checkWhatsAppReminder(token);
    }, STATUS_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, token, user?.is_whatsapp_verified, refreshUser]);

  // Also refresh on foreground if not verified
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        token
      ) {
        checkWhatsAppReminder(token);
        if (!user?.is_whatsapp_verified) {
          refreshUser();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [token, user?.is_whatsapp_verified, refreshUser]);

  return null;
}

// Loading screen component that uses theme
function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.brand.orange} />
    </View>
  );
}

// Main app content wrapped with player setup
function AppContent() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    async function setup() {
      const isSetup = await setupPlayer();
      setIsPlayerReady(isSetup);

      // Initialize push notifications
      await Notifications.initialize();

      // Set up navigation callback for notification deep links
      Notifications.setNavigationCallback((bookId: string) => {
        console.log('Navigating to book from notification:', bookId);
        navigate('DeepLinkHandler', { bookId });
      });
    }
    setup();
  }, []);

  if (!isPlayerReady) {
    return <LoadingScreen />;
  }

  return (
    <DownloadProvider>
      <PlayerProvider>
        <NotificationHandler />
        <WhatsAppReminderHandler />
        <AppNavigator />
      </PlayerProvider>
    </DownloadProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
