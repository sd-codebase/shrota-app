import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { AudioBook } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { DefaultBookCover } from '../DefaultBookCover';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.4;

interface StandardBookCardProps {
  book: AudioBook;
  onPress: (book: AudioBook) => void;
}

export function StandardBookCard({ book, onPress }: StandardBookCardProps) {
  const { colors } = useTheme();
  const chapterCount = book.chapters?.filter((c) => c.isPublished).length || 0;
  const hasThumbnail = book.thumbnail && book.thumbnail.length > 0;

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
          priority="high"
          cachePolicy="memory-disk"
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
        <Text style={[styles.chapterCount, { color: colors.brand.orange }]}>
          {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    marginBottom: 4,
  },
  chapterCount: {
    fontSize: 11,
    fontWeight: '500',
  },
});
