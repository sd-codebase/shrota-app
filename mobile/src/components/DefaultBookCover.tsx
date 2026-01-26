import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface DefaultBookCoverProps {
  title: string;
  style?: StyleProp<ViewStyle>;
}

export function DefaultBookCover({ title, style }: DefaultBookCoverProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundSecondary }, style]}>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>
        {title}
      </Text>
      <Text style={[styles.branding, { color: colors.brand.orange }]}>
        shrota.in
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  branding: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
});
