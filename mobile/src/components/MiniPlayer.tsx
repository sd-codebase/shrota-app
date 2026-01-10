import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';

interface MiniPlayerProps {
  onPress: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { currentBook, currentChapterIndex, isPlaying, togglePlayPause, progress } = usePlayer();

  if (!currentBook) {
    return null;
  }

  const currentChapter = currentBook.chapters[currentChapterIndex];

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.content}>
        <Image
          source={{ uri: currentBook.thumbnail }}
          style={styles.thumbnail}
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {currentBook.title}
          </Text>
          <Text style={styles.chapter} numberOfLines={1}>
            Ch. {currentChapterIndex + 1}: {currentChapter?.title || 'Loading...'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
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
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#2a2a3e',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
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
    backgroundColor: '#2a2a3e',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  chapter: {
    fontSize: 12,
    color: '#6c5ce7',
    marginTop: 2,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
