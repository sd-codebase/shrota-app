import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { AudioBook } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { DefaultBookCover } from '../DefaultBookCover';

interface BookListItemProps {
  book: AudioBook;
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

export function BookListItem({ book, onPress }: BookListItemProps) {
  const { colors } = useTheme();
  const hasThumbnail = book.thumbnail && book.thumbnail.length > 0;
  const chapterCount = book.chapters?.filter((c) => c.isPublished).length || 0;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card }]}
      onPress={() => onPress(book)}
      activeOpacity={0.8}
    >
      {hasThumbnail ? (
        <Image
          source={{ uri: book.thumbnail }}
          style={[styles.thumbnail, { backgroundColor: colors.backgroundSecondary }]}
          contentFit="cover"
        />
      ) : (
        <DefaultBookCover title={book.title} style={styles.thumbnail} />
      )}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>
          {book.author}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {formatDuration(book.duration)}
          </Text>
          <Text style={[styles.metaDot, { color: colors.textSecondary }]}>·</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  info: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    marginHorizontal: 6,
    fontSize: 12,
  },
});
