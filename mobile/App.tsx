import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import { AppNavigator, navigate } from './src/navigation';
import { PlayerProvider, usePlayer } from './src/context/PlayerContext';
import { DownloadProvider } from './src/context/DownloadContext';
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

export default function App() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    async function setup() {
      const isSetup = await setupPlayer();
      setIsPlayerReady(isSetup);
    }
    setup();
  }, []);

  if (!isPlayerReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <DownloadProvider>
          <PlayerProvider>
            <NotificationHandler />
            <AppNavigator />
          </PlayerProvider>
        </DownloadProvider>
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
    backgroundColor: '#0f0f1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
