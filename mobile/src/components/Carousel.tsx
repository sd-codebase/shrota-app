import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioBook, BookProgress } from '../types';
import { useTheme } from '../context/ThemeContext';
import { LargeBookCard, BannerBookCard, CompactBookCard, StandardBookCard } from './cards';

export type CardType = 'large' | 'banner' | 'compact' | 'standard';

interface CarouselProps {
  title: string;
  data: AudioBook[];
  onBookPress: (book: AudioBook) => void;
  onSeeAllPress?: () => void;
  cardType?: CardType;
  progressData?: BookProgress[];
}

export function Carousel({
  title,
  data,
  onBookPress,
  onSeeAllPress,
  cardType = 'standard',
  progressData,
}: CarouselProps) {
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: AudioBook }) => {
    switch (cardType) {
      case 'large':
        return <LargeBookCard book={item} onPress={onBookPress} />;
      case 'banner':
        return <BannerBookCard book={item} onPress={onBookPress} />;
      case 'compact':
        const progress = progressData?.find((p) => p.book_id === item.id);
        return <CompactBookCard book={item} progress={progress} onPress={onBookPress} />;
      case 'standard':
      default:
        return <StandardBookCard book={item} onPress={onBookPress} />;
    }
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {onSeeAllPress && data.length > 0 && (
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={onSeeAllPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.seeAllText, { color: colors.brand.orange }]}>
              See All
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.brand.orange} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={data.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
  },
});
