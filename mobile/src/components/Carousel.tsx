import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { AudioBook } from '../types';
import { AudioBookCard } from './AudioBookCard';

interface CarouselProps {
  title: string;
  data: AudioBook[];
  onBookPress: (book: AudioBook) => void;
}

export function Carousel({ title, data, onBookPress }: CarouselProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AudioBookCard book={item} onPress={onBookPress} />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
  },
});
