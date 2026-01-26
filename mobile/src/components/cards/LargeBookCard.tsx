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
import { DefaultBookCover } from '../DefaultBookCover';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 0.75; // 4:3 aspect ratio

interface LargeBookCardProps {
  book: AudioBook;
  onPress: (book: AudioBook) => void;
}

export function LargeBookCard({ book, onPress }: LargeBookCardProps) {
  const hasThumbnail = book.thumbnail && book.thumbnail.length > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(book)}
      activeOpacity={0.9}
    >
      {hasThumbnail ? (
        <>
          <Image
            source={{ uri: book.thumbnail }}
            style={styles.thumbnail}
            priority="high"
            cachePolicy="memory-disk"
            contentFit="cover"
          />
          {/* Gradient overlay */}
          <View style={styles.gradientOverlay}>
            <View style={styles.gradientTop} />
            <View style={styles.gradientBottom} />
          </View>
          <View style={styles.contentOverlay}>
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={2}>
                {book.title}
              </Text>
              <Text style={styles.author} numberOfLines={1}>
                {book.author}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <DefaultBookCover title={book.title} style={styles.thumbnail} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a3e',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'transparent',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  contentOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 14,
  },
  info: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  author: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
});
