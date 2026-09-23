import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, StatusBar, Linking, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// The bottom button(s) only appear after this long, so the image gets
// guaranteed visibility before the user can act on it.
const BUTTONS_DELAY_MS = 2000;

interface AppOpenAdOverlayProps {
  imageUrl: string;
  link?: string;
  onClose: () => void;
}

/**
 * Full-screen "welcome image" overlay shown once per app launch, after the
 * splash screen has handed off to Login/MainTabs. Rendered as a sibling
 * overlay at the navigator root — it does not touch or depend on
 * SplashScreen's own logic at all.
 */
export function AppOpenAdOverlay({ imageUrl, link, onClose }: AppOpenAdOverlayProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [showButtons, setShowButtons] = useState(false);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => setShowButtons(true), BUTTONS_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showButtons) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showButtons, slideAnim, fadeAnim]);

  const handleKnowMore = () => {
    if (link) {
      Linking.openURL(link).catch(() => {
        // Ignore — if the link can't be opened there's nothing else to do here
      });
    }
  };

  return (
    <View style={styles.overlay}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
      />

      {showButtons && (
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              paddingBottom: insets.bottom + 24,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {link && (
            <TouchableOpacity
              style={[styles.button, styles.knowMoreButton, { backgroundColor: colors.brand.orange }]}
              onPress={handleKnowMore}
              accessibilityRole="button"
            >
              <Text style={styles.knowMoreText}>Know More</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.continueLink}
            onPress={onClose}
            accessibilityRole="link"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.continueText, { color: colors.brand.orange }]}>
              Continue to Shrota
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000000',
    zIndex: 1000,
    elevation: 1000,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  button: {
    width: '100%',
    maxWidth: 360,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  knowMoreButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  knowMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  continueLink: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  continueText: {
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
