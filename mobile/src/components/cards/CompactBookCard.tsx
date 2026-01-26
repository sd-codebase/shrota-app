import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { AudioBook, BookProgress } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { DefaultBookCover } from '../DefaultBookCover';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.55;

interface CompactBookCardProps {
  book: AudioBook;
  progress?: BookProgress;
  onPress: (book: AudioBook) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function CompactBookCard({ book, progress, onPress }: CompactBookCardProps) {
  const { colors } = useTheme();
  const progressPercent = progress?.progress_percentage || 0;
  const hasThumbnail = book.thumbnail && book.thumbnail.length > 0;

  const totalDuration = progress?.book_duration || book.duration || 0;
  const listenedTime = progress?.total_listened_seconds || 0;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={() => onPress(book)}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {hasThumbnail ? (
          <Image
            source={{ uri: book.thumbnail }}
            style={[styles.thumbnail, { backgroundColor: colors.backgroundSecondary }]}
            priority="high"
            cachePolicy="memory-disk"
            contentFit="cover"
          />
        ) : (
          <View style={[styles.thumbnail, { backgroundColor: colors.backgroundSecondary, borderRadius: 6, overflow: 'hidden' }]}>
            <DefaultBookCover title={book.title} style={{ padding: 4 }} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {book.title}
          </Text>
          <Text style={[styles.duration, { color: colors.textSecondary }]} numberOfLines={1}>
            {formatDuration(listenedTime)} / {formatDuration(totalDuration)}
          </Text>
          <View style={[styles.progressBarBg, { backgroundColor: colors.backgroundSecondary }]}>
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: colors.brand.orange, width: `${progressPercent}%` },
              ]}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const CARD_HEIGHT = 70;

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 8,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 6,
  },
  info: {
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  duration: {
    fontSize: 10,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
