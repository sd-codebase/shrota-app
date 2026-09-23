import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList, SplashResource } from '../types';
import { fetchActiveSplash } from '../services/api';
import { getSplashResourceUrl } from '../config';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// A video splash is capped at this long regardless of the file's real
// length (it also navigates on early on playback end, whichever is first).
const VIDEO_MAX_DURATION_MS = 5000;
// An image splash (admin-uploaded) shows for this long.
const IMAGE_DURATION_MS = 3000;
// No active admin resource — fall back to the built-in static splash, same
// timing as before this feature existed.
const DEFAULT_DURATION_MS = 1000;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  // undefined = still fetching, null = no active resource, object = use it
  const [splashResource, setSplashResource] = useState<SplashResource | null | undefined>(undefined);
  const navigatedRef = useRef(false);

  useEffect(() => {
    fetchActiveSplash().then(setSplashResource);
  }, []);

  const videoSource =
    splashResource?.resource_type === 'video' ? getSplashResourceUrl(splashResource.file) : null;

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = true;
  });

  useEffect(() => {
    if (videoSource) {
      player.play();
    }
  }, [videoSource, player]);

  const navigateOnward = React.useCallback(async () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    if (isLoading) {
      // Auth state not ready yet — wait briefly and retry rather than
      // guessing where to send the user.
      navigatedRef.current = false;
      setTimeout(navigateOnward, 150);
      return;
    }

    if (isAuthenticated) {
      const isValid = await checkAuth();
      navigation.reset({ index: 0, routes: [{ name: isValid ? 'MainTabs' : 'Login' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [isLoading, isAuthenticated, navigation, checkAuth]);

  // Navigate on video end (early exit if the video is shorter than the cap).
  useEffect(() => {
    if (!videoSource) return;
    const subscription = player.addListener('playToEnd', () => {
      navigateOnward();
    });
    return () => subscription.remove();
  }, [videoSource, player, navigateOnward]);

  // Display-duration timer — only starts once we know what we're showing.
  useEffect(() => {
    if (splashResource === undefined) return; // still fetching

    const duration =
      splashResource?.resource_type === 'video'
        ? VIDEO_MAX_DURATION_MS
        : splashResource?.resource_type === 'image'
          ? IMAGE_DURATION_MS
          : DEFAULT_DURATION_MS;

    const timer = setTimeout(navigateOnward, duration);
    return () => clearTimeout(timer);
  }, [splashResource, navigateOnward]);

  // --- Admin-uploaded video splash ---
  if (splashResource?.resource_type === 'video' && videoSource) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
        <VideoView
          player={player}
          style={styles.fullScreen}
          contentFit="cover"
          nativeControls={false}
        />
      </View>
    );
  }

  // --- Admin-uploaded image splash ---
  if (splashResource?.resource_type === 'image') {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
        <Image
          source={{ uri: getSplashResourceUrl(splashResource.file) }}
          style={styles.fullScreen}
          contentFit="cover"
        />
      </View>
    );
  }

  // --- Default built-in splash (no active admin resource, or still loading) ---
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/shrota-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Shrota</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Listen to stories that inspire
          </Text>
        </View>

        <ActivityIndicator size="large" color={colors.brand.orange} style={styles.loader} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    marginTop: 16,
  },
  tagline: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  loader: {
    marginTop: 48,
  },
});
