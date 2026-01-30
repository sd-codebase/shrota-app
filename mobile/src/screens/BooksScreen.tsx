import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { MiniPlayer } from '../components/MiniPlayer';
import { Carousel } from '../components/Carousel';
import { PreferencesModal } from '../components/PreferencesModal';
import { ExploreCard } from '../components/ExploreCard';
import { StandardBookCard } from '../components/cards';
import { LogoLoader } from '../components/LogoLoader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  fetchNewReleases,
  fetchFeaturedBooks,
  fetchBooksByGenre,
  fetchGenres,
  fetchBecauseYouListenedTo,
} from '../services/api';
import { getContinueListening, getCompletedBooks } from '../services/userActivityApi';
import { hasUserPreferences, getUserPreferences, UserPreferences } from '../services/preferencesService';
import { AudioBook, BookProgress, RootStackParamList, HomeStackParamList, Genre, SectionType } from '../types';
import { useCurrentBook } from '../stores/playerStore';
import { getThumbnailUrl } from '../config';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface GenreSection {
  genre: Genre;
  books: AudioBook[];
}

interface BecauseYouListenedSection {
  completedBook: BookProgress;
  recommendations: AudioBook[];
}

export function BooksScreen() {
  const navigation = useNavigation<NavigationProp>();
  const currentBook = useCurrentBook();
  const { colors, isDark, toggleTheme } = useTheme();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Section data
  const [newReleases, setNewReleases] = useState<AudioBook[]>([]);
  const [featured, setFeatured] = useState<AudioBook[]>([]);
  const [continueListening, setContinueListening] = useState<AudioBook[]>([]);
  const [progressData, setProgressData] = useState<BookProgress[]>([]);
  const [genreSections, setGenreSections] = useState<GenreSection[]>([]);
  const [becauseYouListenedSections, setBecauseYouListenedSections] = useState<BecauseYouListenedSection[]>([]);

  const loadSectionData = useCallback(async (prefs: UserPreferences | null) => {
    if (!prefs || prefs.languageIds.length === 0) {
      console.log('[DEBUG] No preferences or language selected');
      return;
    }

    try {
      setError(null);
      const languageIds = prefs.languageIds; // Use all selected languages

      console.log('[DEBUG] Auth token:', token ? 'EXISTS' : 'MISSING');
      console.log('[DEBUG] Language IDs:', languageIds);
      console.log('[DEBUG] Genre IDs:', prefs.genreIds);

      // Fetch genres first
      const allGenres = await fetchGenres().catch(() => []);

      // Fetch new releases and featured for ALL selected languages
      const newReleasesPromises = languageIds.map((langId) =>
        fetchNewReleases(langId, token || undefined).catch((err) => {
          console.log('[DEBUG] fetchNewReleases error for', langId, ':', err.message);
          return [];
        })
      );
      const featuredPromises = languageIds.map((langId) =>
        fetchFeaturedBooks(langId, token || undefined).catch((err) => {
          console.log('[DEBUG] fetchFeaturedBooks error for', langId, ':', err.message);
          return [];
        })
      );

      const [newReleasesResults, featuredResults] = await Promise.all([
        Promise.all(newReleasesPromises),
        Promise.all(featuredPromises),
      ]);

      // Merge and deduplicate results
      const newReleasesData = newReleasesResults.flat().filter(
        (book, index, self) => self.findIndex((b) => b.id === book.id) === index
      );
      const featuredData = featuredResults.flat().filter(
        (book, index, self) => self.findIndex((b) => b.id === book.id) === index
      );

      console.log('[DEBUG] New releases count:', newReleasesData.length);
      console.log('[DEBUG] Featured count:', featuredData.length);

      setNewReleases(newReleasesData);
      setFeatured(featuredData);

      // Fetch continue listening and completed books (requires auth)
      let completedBooks: BookProgress[] = [];
      let inProgressBooks: BookProgress[] = [];
      try {
        const progress = await getContinueListening();
        setProgressData(progress);
        inProgressBooks = progress.filter((p) => !p.is_completed);
        // Transform progress to AudioBook format for books not yet completed
        const continueBooks = inProgressBooks
          .slice(0, 10)
          .map((p) => ({
            id: p.book_id,
            title: p.book_title || 'Unknown Book',
            author: p.book_author_names?.join(', ') || 'Unknown Author',
            thumbnail: p.book_thumbnail ? getThumbnailUrl(p.book_thumbnail) : '',
            chapters: [],
            duration: p.book_duration || 0,
            description: '',
          }));
        setContinueListening(continueBooks);

        // Get completed books for "Because You Listened" section
        completedBooks = await getCompletedBooks();
      } catch {
        setContinueListening([]);
        setProgressData([]);
      }

      // Fetch "Because You Listened" sections (max 3 books)
      // Use completed books first, fallback to in-progress books if none completed
      const sourceBooks = completedBooks.length > 0 ? completedBooks : inProgressBooks;

      if (sourceBooks.length > 0) {
        const completedIds = completedBooks.map((b) => b.book_id);
        const inProgressIds = inProgressBooks.map((p) => p.book_id);
        const excludeIds = [...new Set([...completedIds, ...inProgressIds])];

        const sections: BecauseYouListenedSection[] = [];

        for (const sourceBook of sourceBooks.slice(0, 3)) {
          try {
            const recommendations = await fetchBecauseYouListenedTo(
              sourceBook.book_id,
              excludeIds,
              languageIds[0], // Use primary language for recommendations
              10,
              0,
              token || undefined
            );

            if (recommendations.length > 0) {
              sections.push({
                completedBook: sourceBook,
                recommendations,
              });
            }
          } catch {
            // Skip failed sections
          }
        }

        setBecauseYouListenedSections(sections);
      } else {
        setBecauseYouListenedSections([]);
      }

      // Fetch genre-based sections (max 3 genres)
      const genreIds = prefs.genreIds.slice(0, 3);
      const genreSectionsData: GenreSection[] = [];

      for (const genreId of genreIds) {
        try {
          const genre = allGenres.find((g) => g.id === genreId);
          if (genre) {
            // Pass first languageId to filter books by user's preferred language
            const books = await fetchBooksByGenre(genreId, languageIds[0], 10, 0, token || undefined);
            if (books.length > 0) {
              genreSectionsData.push({ genre, books });
            }
          }
        } catch {
          // Skip failed genre sections
        }
      }

      setGenreSections(genreSectionsData);
    } catch (err) {
      console.error('Failed to load sections:', err);
      setError('Failed to load content. Pull to refresh.');
    }
  }, [token]);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      // Load preferences first
      const prefs = await getUserPreferences();
      setPreferences(prefs);
      await loadSectionData(prefs);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load audiobooks. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadSectionData]);

  useEffect(() => {
    loadData();
  }, []);

  // Check if user has set preferences
  useEffect(() => {
    const checkPreferences = async () => {
      const hasPrefs = await hasUserPreferences();
      if (!hasPrefs) {
        setIsEditingPreferences(false);
        setShowPreferencesModal(true);
      }
    };
    checkPreferences();
  }, []);

  const handlePreferencesComplete = async () => {
    setShowPreferencesModal(false);
    setIsEditingPreferences(false);
    setLoading(true);
    await loadData();
  };

  const handleOpenPreferences = () => {
    setIsEditingPreferences(true);
    setShowPreferencesModal(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBookPress = (book: AudioBook) => {
    navigation.navigate('BookDetails', { book });
  };

  const handleMiniPlayerPress = () => {
    if (currentBook) {
      navigation.navigate('Player', { book: currentBook });
    }
  };

  const handleSeeAll = (sectionType: SectionType, title: string, genreId?: string, sourceBookId?: string) => {
    navigation.navigate('SectionList', {
      sectionType,
      title,
      languageId: preferences?.languageIds[0],
      genreId,
      sourceBookId,
    });
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="library-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Content Available
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No audiobooks match your preferences yet.{'\n'}Try updating your preferences.
      </Text>
      <TouchableOpacity
        style={[styles.updateButton, { backgroundColor: colors.brand.orange }]}
        onPress={handleOpenPreferences}
        activeOpacity={0.8}
      >
        <Text style={styles.updateButtonText}>Update Preferences</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <LogoLoader size={100} />
      </SafeAreaView>
    );
  }

  const hasContent =
    newReleases.length > 0 ||
    featured.length > 0 ||
    continueListening.length > 0 ||
    becauseYouListenedSections.length > 0 ||
    genreSections.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/shrota-logo.png')}
            style={styles.headerLogo}
            contentFit="contain"
          />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shrota</Text>
        </View>
        <TouchableOpacity
          style={[styles.themeButton, { backgroundColor: colors.card }]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : !hasContent ? (
        renderEmpty()
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            currentBook && styles.scrollContentWithPlayer,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.orange}
              colors={[colors.brand.orange]}
            />
          }
        >
          {/* Featured Section */}
          <Carousel
            title="Featured"
            data={featured}
            onBookPress={handleBookPress}
            onSeeAllPress={() => handleSeeAll('featured', 'Featured')}
            cardType="banner"
          />

          {/* Latest Releases Section */}
          <Carousel
            title="Latest Releases"
            data={newReleases}
            onBookPress={handleBookPress}
            onSeeAllPress={() => handleSeeAll('new-releases', 'Latest Releases')}
            cardType="large"
          />

          {/* Continue Listening Section - Only show if user has progress */}
          {continueListening.length > 0 && (
            <Carousel
              title="Continue Listening"
              data={continueListening}
              onBookPress={handleBookPress}
              onSeeAllPress={() => handleSeeAll('continue-listening', 'Continue Listening')}
              cardType="compact"
              progressData={progressData}
            />
          )}

          {/* Explore Card */}
          <ExploreCard onPress={() => navigation.navigate('Explore')} />

          {/* Genre Sections (Favorite Categories) */}
          {genreSections.map((section) => (
            <Carousel
              key={section.genre.id}
              title={section.genre.name}
              data={section.books}
              onBookPress={handleBookPress}
              onSeeAllPress={() => handleSeeAll('genre', section.genre.name, section.genre.id)}
              cardType="standard"
            />
          ))}

          {/* Because You Listened Section - After favorite categories */}
          {becauseYouListenedSections.length > 0 && (
            <View style={styles.becauseYouListenedContainer}>
              <Text style={[styles.mainSectionTitle, { color: colors.text }]}>
                Because You Listened
              </Text>

              {becauseYouListenedSections.map((section) => (
                <View key={section.completedBook.book_id} style={styles.subsection}>
                  <View style={styles.subsectionHeader}>
                    <Text
                      style={[styles.subsectionTitle, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      "{section.completedBook.book_title}"
                    </Text>
                    <TouchableOpacity
                      style={styles.seeAllButton}
                      onPress={() =>
                        handleSeeAll(
                          'because-you-listened',
                          section.completedBook.book_title || 'Recommendations',
                          undefined,
                          section.completedBook.book_id
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.seeAllText, { color: colors.brand.orange }]}>
                        See All
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    horizontal
                    data={section.recommendations.slice(0, 10)}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <StandardBookCard book={item} onPress={handleBookPress} />
                    )}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carouselContent}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <MiniPlayer onPress={handleMiniPlayerPress} />

      <PreferencesModal
        visible={showPreferencesModal}
        onComplete={handlePreferencesComplete}
        onClose={() => {
          setShowPreferencesModal(false);
          setIsEditingPreferences(false);
        }}
        initialGenreIds={preferences?.genreIds || []}
        initialLanguageIds={preferences?.languageIds || []}
        isEditing={isEditingPreferences}
      />
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 32,
    height: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  scrollContentWithPlayer: {
    paddingBottom: 140,
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
  updateButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Because You Listened section styles
  becauseYouListenedContainer: {
    marginBottom: 28,
  },
  mainSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
    flex: 1,
    marginRight: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  carouselContent: {
    paddingHorizontal: 16,
  },
});
