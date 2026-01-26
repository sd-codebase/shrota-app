import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { MiniPlayer } from '../components/MiniPlayer';
import { DefaultBookCover } from '../components/DefaultBookCover';
import {
  fetchNewReleases,
  fetchFeaturedBooks,
  fetchBooksByGenre,
  fetchBecauseYouListenedTo,
} from '../services/api';
import { getContinueListening, getCompletedBooks } from '../services/userActivityApi';
import { AudioBook, BookProgress, RootStackParamList, HomeStackParamList, SectionType } from '../types';
import { useCurrentBook } from '../stores/playerStore';
import { getThumbnailUrl } from '../config';
import { formatDuration } from '../utils/formatters';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

type SectionListRouteProp = RouteProp<HomeStackParamList, 'SectionList'>;

const PAGE_SIZE = 20;

export function SectionListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SectionListRouteProp>();
  const { sectionType, title, languageId, genreId, sourceBookId } = route.params;
  const { colors, isDark } = useTheme();
  const currentBook = useCurrentBook();

  const [books, setBooks] = useState<AudioBook[]>([]);
  const [progressData, setProgressData] = useState<BookProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadData = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let newBooks: AudioBook[] = [];
      const currentOffset = isLoadMore ? offset : 0;

      switch (sectionType) {
        case 'new-releases':
          if (languageId) {
            newBooks = await fetchNewReleases(languageId);
          }
          setHasMore(false); // API returns all at once
          break;
        case 'featured':
          if (languageId) {
            newBooks = await fetchFeaturedBooks(languageId);
          }
          setHasMore(false); // API returns all at once
          break;
        case 'continue-listening':
          const progress = await getContinueListening();
          setProgressData(progress);
          // Transform progress data to AudioBook format
          newBooks = progress
            .filter((p) => !p.is_completed)
            .map((p) => ({
              id: p.book_id,
              title: p.book_title || 'Unknown Book',
              author: p.book_author_names?.join(', ') || 'Unknown Author',
              thumbnail: p.book_thumbnail ? getThumbnailUrl(p.book_thumbnail) : '',
              chapters: [],
              duration: p.book_duration || 0,
              description: '',
            }));
          setHasMore(false);
          break;
        case 'genre':
          if (genreId) {
            newBooks = await fetchBooksByGenre(genreId, languageId, PAGE_SIZE, currentOffset);
            setHasMore(newBooks.length === PAGE_SIZE);
          }
          break;
        case 'because-you-listened':
          if (sourceBookId) {
            // Get completed and in-progress books to build exclusion list
            const completed = await getCompletedBooks();
            const inProgress = await getContinueListening();
            const excludeIds = [
              ...completed.map((b) => b.book_id),
              ...inProgress.filter((p) => !p.is_completed).map((p) => p.book_id),
            ];

            newBooks = await fetchBecauseYouListenedTo(
              sourceBookId,
              excludeIds,
              languageId,
              PAGE_SIZE,
              currentOffset
            );
            setHasMore(newBooks.length === PAGE_SIZE);
          }
          break;
      }

      if (isLoadMore) {
        setBooks((prev) => [...prev, ...newBooks]);
        setOffset(currentOffset + newBooks.length);
      } else {
        setBooks(newBooks);
        setOffset(newBooks.length);
      }
    } catch (error) {
      console.error('Failed to load section data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sectionType, languageId, genreId, sourceBookId, offset]);

  useEffect(() => {
    loadData();
  }, [sectionType, languageId, genreId, sourceBookId]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && (sectionType === 'genre' || sectionType === 'because-you-listened')) {
      loadData(true);
    }
  };

  const handleBookPress = (book: AudioBook) => {
    navigation.navigate('BookDetails', { book });
  };

  const handleMiniPlayerPress = () => {
    if (currentBook) {
      navigation.navigate('Player', { book: currentBook });
    }
  };

  const renderItem = ({ item }: { item: AudioBook }) => {
    const hasThumbnail = item.thumbnail && item.thumbnail.length > 0;
    const progress = sectionType === 'continue-listening'
      ? progressData.find((p) => p.book_id === item.id)
      : null;
    const progressPercent = progress?.progress_percentage || 0;

    return (
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: colors.card }]}
        onPress={() => handleBookPress(item)}
        activeOpacity={0.8}
      >
        {hasThumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
            style={[styles.listItemThumbnail, { backgroundColor: colors.backgroundSecondary }]}
            priority="high"
            cachePolicy="memory-disk"
            contentFit="cover"
          />
        ) : (
          <View style={[styles.listItemThumbnail, { overflow: 'hidden' }]}>
            <DefaultBookCover title={item.title} style={{ padding: 8 }} />
          </View>
        )}
        <View style={styles.listItemInfo}>
          <Text style={[styles.listItemTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.listItemAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.author}
          </Text>
          <View style={styles.listItemMeta}>
            {item.duration > 0 && (
              <Text style={[styles.listItemDuration, { color: colors.textSecondary }]}>
                {formatDuration(item.duration)}
              </Text>
            )}
            {item.chapters && item.chapters.length > 0 && (
              <Text style={[styles.listItemChapters, { color: colors.textSecondary }]}>
                {item.chapters.filter((c) => c.isPublished).length} chapters
              </Text>
            )}
          </View>
          {sectionType === 'continue-listening' && progress && (
            <View style={[styles.progressBarBg, { backgroundColor: colors.backgroundSecondary }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: colors.brand.orange, width: `${progressPercent}%` },
                ]}
              />
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.brand.orange} />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.brand.orange} />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="library-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Books Found</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        There are no books in this section yet.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.orange} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.card }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          books.length === 0 && styles.emptyListContent,
          currentBook && styles.listContentWithPlayer,
        ]}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />

      <MiniPlayer onPress={handleMiniPlayerPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
  },
  listContentWithPlayer: {
    paddingBottom: 140,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  listItemThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listItemAuthor: {
    fontSize: 14,
    marginTop: 4,
  },
  listItemMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  listItemDuration: {
    fontSize: 12,
  },
  listItemChapters: {
    fontSize: 12,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
