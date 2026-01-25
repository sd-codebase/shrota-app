import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MiniPlayer } from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { searchBooks, transformSearchResultToAudioBook } from '../services/api';
import { getThumbnailUrl } from '../config';
import {
  AudioBook,
  RootStackParamList,
  SearchStackParamList,
  SearchResult,
  SearchBookResult,
  SearchWriterResult,
  SearchNarratorResult,
  SearchPublicationResult,
} from '../types';
import { formatDuration } from '../utils/formatters';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<SearchStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const DEBOUNCE_DELAY = 300;
const MIN_SEARCH_LENGTH = 3;

export function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { currentBook } = usePlayer();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < MIN_SEARCH_LENGTH) {
      setResults(null);
      setHasSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResult = await searchBooks(query);
      setResults(searchResult);
      setHasSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (text.length < MIN_SEARCH_LENGTH) {
        setResults(null);
        setHasSearched(false);
        setError(null);
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        performSearch(text);
      }, DEBOUNCE_DELAY);
    },
    [performSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleBookPress = (book: SearchBookResult) => {
    const audioBook = transformSearchResultToAudioBook(book);
    navigation.navigate('BookDetails', { book: audioBook });
  };

  const handleMiniPlayerPress = () => {
    if (currentBook) {
      navigation.navigate('Player', { book: currentBook });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults(null);
    setHasSearched(false);
    setError(null);
    inputRef.current?.focus();
  };

  const hasResults =
    results &&
    (results.books.count > 0 ||
      results.writers.count > 0 ||
      results.narrators.count > 0 ||
      results.publications.count > 0);

  const renderBookItem = (book: SearchBookResult) => (
    <TouchableOpacity
      key={book.id}
      style={[styles.bookItem, { backgroundColor: colors.card }]}
      onPress={() => handleBookPress(book)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: getThumbnailUrl(book.thumbnail || '') }}
        style={[styles.bookThumbnail, { backgroundColor: colors.backgroundSecondary }]}
        contentFit="cover"
      />
      <View style={styles.bookInfo}>
        <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.bookAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {book.author_names.join(', ') || 'Unknown Author'}
        </Text>
        <Text style={[styles.bookMeta, { color: colors.textSecondary }]}>
          {formatDuration(book.total_duration || 0)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderPersonItem = (
    item: SearchWriterResult | SearchNarratorResult,
    type: 'writer' | 'narrator'
  ) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.personItem, { backgroundColor: colors.card }]}
      activeOpacity={0.8}
    >
      {item.photo ? (
        <Image
          source={{ uri: getThumbnailUrl(item.photo) }}
          style={[styles.personAvatar, { backgroundColor: colors.backgroundSecondary }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.personAvatar, { backgroundColor: colors.brand.orange }]}>
          <Text style={styles.personAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.personInfo}>
        <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.personMeta, { color: colors.textSecondary }]}>
          {item.book_count} {item.book_count === 1 ? 'book' : 'books'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderPublicationItem = (item: SearchPublicationResult) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.personItem, { backgroundColor: colors.card }]}
      activeOpacity={0.8}
    >
      {item.photo ? (
        <Image
          source={{ uri: getThumbnailUrl(item.photo) }}
          style={[styles.personAvatar, { backgroundColor: colors.backgroundSecondary }]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.personAvatar, { backgroundColor: colors.brand.blue }]}>
          <Ionicons name="business-outline" size={20} color="#fff" />
        </View>
      )}
      <View style={styles.personInfo}>
        <Text style={[styles.personName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.personMeta, { color: colors.textSecondary }]}>
          {item.book_count} {item.book_count === 1 ? 'book' : 'books'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderSection = (
    title: string,
    icon: string,
    children: React.ReactNode,
    count: number
  ) => {
    if (count === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name={icon as any} size={20} color={colors.brand.orange} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          <View style={[styles.countBadge, { backgroundColor: colors.brand.orange }]}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        </View>
        {children}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.orange} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Search Error</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      );
    }

    if (searchQuery.length > 0 && searchQuery.length < MIN_SEARCH_LENGTH) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Keep Typing</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Enter at least {MIN_SEARCH_LENGTH} characters to search
          </Text>
        </View>
      );
    }

    if (hasSearched && !hasResults) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Results</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No matches found for "{searchQuery}"
          </Text>
        </View>
      );
    }

    if (!hasSearched) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Search Audiobooks</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Search by title, author, narrator, or publisher
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.resultsContainer}
        contentContainerStyle={[
          styles.resultsContent,
          currentBook && styles.resultsContentWithPlayer,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderSection('Books', 'book-outline', (
          <View style={styles.sectionContent}>
            {results?.books.results.map(renderBookItem)}
          </View>
        ), results?.books.count || 0)}

        {renderSection('Writers', 'pencil-outline', (
          <View style={styles.sectionContent}>
            {results?.writers.results.map((item) => renderPersonItem(item, 'writer'))}
          </View>
        ), results?.writers.count || 0)}

        {renderSection('Narrators', 'mic-outline', (
          <View style={styles.sectionContent}>
            {results?.narrators.results.map((item) => renderPersonItem(item, 'narrator'))}
          </View>
        ), results?.narrators.count || 0)}

        {renderSection('Publications', 'business-outline', (
          <View style={styles.sectionContent}>
            {results?.publications.results.map(renderPublicationItem)}
          </View>
        ), results?.publications.count || 0)}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Search</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="search" size={20} color={colors.placeholder} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search books, authors, narrators..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {loading && (
          <ActivityIndicator size="small" color={colors.brand.orange} style={styles.loadingIndicator} />
        )}
        {searchQuery.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close-circle" size={20} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        {renderContent()}
      </View>

      <MiniPlayer onPress={handleMiniPlayerPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingIndicator: {
    marginRight: 8,
  },
  contentContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  resultsContentWithPlayer: {
    paddingBottom: 160,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContent: {
    gap: 8,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  bookThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  bookAuthor: {
    fontSize: 13,
    marginTop: 2,
  },
  bookMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
  },
  personMeta: {
    fontSize: 13,
    marginTop: 2,
  },
});
