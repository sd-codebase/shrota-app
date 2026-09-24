import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// How long the branded screen is held before moving on. Campaign content
// is carried by the app-open ad that follows, not by this screen.
const SPLASH_DURATION_MS = 1000;

export function SplashScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  const navigatedRef = useRef(false);

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

  useEffect(() => {
    const timer = setTimeout(navigateOnward, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [navigateOnward]);

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
