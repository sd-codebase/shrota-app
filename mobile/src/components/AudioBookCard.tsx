import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { AudioBook } from '../types';
import { DEFAULT_AUDIOBOOK_ARTWORK } from '../constants/placeholders';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.4;

interface AudioBookCardProps {
  book: AudioBook;
  onPress: (book: AudioBook) => void;
}

export function AudioBookCard({ book, onPress }: AudioBookCardProps) {
  const chapterCount = book.chapters?.length || 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(book)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: book.thumbnail || DEFAULT_AUDIOBOOK_ARTWORK }}
        style={styles.thumbnail}
        priority="high"
        cachePolicy="memory-disk"
        contentFit="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {book.author}
        </Text>
        <Text style={styles.chapterCount}>
          {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#2a2a3e',
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  chapterCount: {
    fontSize: 11,
    color: '#6c5ce7',
  },
});
