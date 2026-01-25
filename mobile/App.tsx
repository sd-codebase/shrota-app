import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import { AppNavigator, navigate } from './src/navigation';
import { PlayerProvider, usePlayer } from './src/context/PlayerContext';
import { DownloadProvider } from './src/context/DownloadContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { setupPlayer } from './src/services/trackPlayerService';

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
