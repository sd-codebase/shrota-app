import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { usePlayerStore } from '../stores/playerStore';
import { DEFAULT_AUDIOBOOK_ARTWORK } from '../constants/placeholders';

interface MiniPlayerProps {
  onPress: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { togglePlayPause } = usePlayer();
  const { colors } = useTheme();

  // Use Zustand store for real-time state
  const { currentBook, currentChapterIndex, isPlaying, progress } = usePlayerStore();

  if (!currentBook) {
    return null;
  }

  const currentChapter = currentBook.chapters[currentChapterIndex];

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.brand.orange, width: `${progress * 100}%` },
          ]}
        />
      </View>
      <View style={styles.content}>
        <Image
          source={{ uri: currentChapter?.thumbnail || currentBook.thumbnail || DEFAULT_AUDIOBOOK_ARTWORK }}
          style={[styles.thumbnail, { backgroundColor: colors.backgroundSecondary }]}
          priority="high"
          cachePolicy="memory-disk"
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {currentBook.title}
          </Text>
          <Text style={[styles.chapter, { color: colors.brand.orange }]} numberOfLines={1}>
            Ch. {currentChapterIndex + 1}: {currentChapter?.title || 'Loading...'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: colors.brand.orange }]}
          onPress={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  progressBar: {
    height: 2,
  },
  progressFill: {
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  chapter: {
    fontSize: 12,
    marginTop: 2,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
