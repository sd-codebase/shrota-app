import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { DefaultBookCover } from '../components/DefaultBookCover';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MiniPlayer } from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { AudioBook, AudioChapter, RootStackParamList, HomeStackParamList, BookProgress, Genre, Language, Publication } from '../types';
import { formatDuration } from '../utils/formatters';
import { getBookProgress } from '../services/userActivityApi';
import { getBookChapterProgress, ChapterProgress } from '../services/chapterProgressService';
import { fetchGenres, fetchLanguages, fetchPublications, fetchBookById } from '../services/api';
import { useIsBookPlaying, useCurrentBook, useCurrentChapterIndex, useIsPlaying, usePlaybackProgress } from '../stores/playerStore';
import { DEFAULT_AUDIOBOOK_ARTWORK } from '../constants/placeholders';
import { shareBook } from '../utils/share';
import { Analytics } from '../services/analytics';
import { BookAccess, getBookAccess } from '../services/paymentsApi';
import { useBilling } from '../context/BillingContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList & HomeStackParamList>;
type BookDetailsRouteProp = RouteProp<HomeStackParamList, 'BookDetails'>;

const { width } = Dimensions.get('window');
const COVER_SIZE = width * 0.55;

export function BookDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BookDetailsRouteProp>();
  const { book: initialBook } = route.params;
  const { colors, isDark } = useTheme();

  const { playBook, togglePlayPause } = usePlayer();
  const [savedProgress, setSavedProgress] = useState<BookProgress | null>(null);
  const [chapterProgressMap, setChapterProgressMap] = useState<Map<number, ChapterProgress>>(new Map());

  // Full book data (fetched if initial book has no chapters)
  const [fullBook, setFullBook] = useState<AudioBook | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  // Paywall: null until the server has answered "can this user listen?"
  const [access, setAccess] = useState<BookAccess | null>(null);
  // Localised Google Play price for a Prime book, e.g. "₹49.00".
  const [playPrice, setPlayPrice] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const billing = useBilling();
  // Off: the server opens every book and the app shows no purchase UI.
  const paymentsEnabled = useFeatureFlags().isEnabled('payments');

  // Use fullBook if available, otherwise use initialBook
  const book = fullBook || initialBook;

  // Lookup tables for metadata enrichment
  const [genres, setGenres] = useState<Genre[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);

  // Use Zustand store for current playing state
  const currentBook = useCurrentBook();
  const isThisBookPlaying = useIsBookPlaying(book.id);
  const currentChapterIndex = useCurrentChapterIndex();
  const isPlaying = useIsPlaying();
  const { position: currentPosition, duration: currentDuration } = usePlaybackProgress();

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);
  const publishedChapters = sortedChapters.filter((c) => c.isPublished);
  const totalChapters = sortedChapters.length;

  // Fetch full book data if initial book has no chapters
  useEffect(() => {
    const fetchFullBook = async () => {
      if (initialBook.chapters.length === 0) {
        setLoadingBook(true);
        try {
          const bookData = await fetchBookById(initialBook.id);
          setFullBook(bookData);
        } catch (error) {
          console.error('Failed to fetch full book data:', error);
        } finally {
          setLoadingBook(false);
        }
      }
    };
    fetchFullBook();
  }, [initialBook.id, initialBook.chapters.length]);

  // Re-check on focus so a purchase finished elsewhere (restore, a pending
  // UPI payment completing, a subscription bought on the plans screen)
  // unlocks the book when the user comes back to it.
  useFocusEffect(
    useCallback(() => {
      getBookAccess(initialBook.id)
        .then(setAccess)
        .catch((error) => console.log('Could not fetch book access:', error));
    }, [initialBook.id, paymentsEnabled])
  );

  const isLocked = access !== null && !access.can_listen;

  // Show Play's real price on the buy button once we know it's for sale.
  useEffect(() => {
    if (!isLocked || !access?.play_product_id) return;
    billing
      .getBookPrice(access.play_product_id)
      .then(setPlayPrice)
      .catch((error) => console.log('Could not load Play price:', error));
  }, [isLocked, access?.play_product_id]);

  const handleBuy = async (current: BookAccess): Promise<boolean> => {
    if (!current.play_product_id) {
      Alert.alert('Not available yet', "This audiobook can't be bought right now. Please try again later.");
      return false;
    }
    setPurchasing(true);
    try {
      const outcome = await billing.buyBook(current.play_product_id);
      if (outcome.status === 'granted') {
        setAccess(await getBookAccess(book.id));
        return true;
      }
      if (outcome.status === 'pending') {
        Alert.alert(
          'Payment pending',
          "We'll unlock this audiobook as soon as Google Play confirms your payment.",
        );
      } else if (outcome.status === 'failed') {
        Alert.alert('Purchase failed', outcome.message);
      }
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  /**
   * Gate every playback start. Resolves true when playback may go ahead;
   * otherwise explains the book is locked.
   */
  const ensureCanListen = async (): Promise<boolean> => {
    let current = access;
    if (current === null) {
      try {
        current = await getBookAccess(book.id);
        setAccess(current);
      } catch {
        Alert.alert('Connection problem', 'Could not check access to this book. Please try again.');
        return false;
      }
    }
    if (current.can_listen) return true;

    // Locked: buy it (Prime) or see plans (Subscriber) — both through
    // Google Play Billing, the only payment method allowed in the app.
    if (current.access_type === 'prime_only') {
      return handleBuy(current);
    }
    navigation.navigate('Subscription');
    return false;
  };

  // Track book viewed event
  useEffect(() => {
    Analytics.trackBookViewed(initialBook.id, 'browse');
  }, [initialBook.id]);

  // Check if book has progress for "Resume" button
  const hasProgress = savedProgress !== null && !savedProgress.is_completed && savedProgress.progress_percentage > 0;

  // Enrich book with resolved names from lookup tables
  const enrichedBook = useMemo(() => {
    const result = { ...book };

    // Resolve genre names if not already present
    if (!result.genreNames?.length && result.genre_ids?.length && genres.length > 0) {
      result.genreNames = result.genre_ids
        .map(id => genres.find(g => g.id === id)?.name)
        .filter(Boolean) as string[];
    }

    // Resolve language name if not already present
    if (!result.languageName && result.language_id && languages.length > 0) {
      result.languageName = languages.find(l => l.id === result.language_id)?.name;
    }

    // Resolve publisher name if not already present
    if (!result.publisher_name && result.publisher_id && publications.length > 0) {
      result.publisher_name = publications.find(p => p.id === result.publisher_id)?.name;
    }

    return result;
  }, [book, genres, languages, publications]);

  // Fetch lookup tables for metadata enrichment
  useEffect(() => {
    const loadLookupTables = async () => {
      try {
        const [genresData, languagesData, publicationsData] = await Promise.all([
          fetchGenres().catch(() => []),
          fetchLanguages().catch(() => []),
          fetchPublications().catch(() => []),
        ]);
        setGenres(genresData);
        setLanguages(languagesData);
        setPublications(publicationsData);
      } catch (error) {
        console.log('Could not fetch lookup tables:', error);
      }
    };
    loadLookupTables();
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      // Fetch server progress for "Resume" button
      try {
        const progress = await getBookProgress(book.id);
        setSavedProgress(progress);
      } catch (error) {
        // User might not be authenticated
        setSavedProgress(null);
      }

      // Fetch local chapter progress for all chapters
      try {
        const chapterProgress = await getBookChapterProgress(book.id);
        const progressMap = new Map<number, ChapterProgress>();
        chapterProgress.forEach(cp => {
          progressMap.set(cp.chapterIndex, cp);
        });
        setChapterProgressMap(progressMap);
      } catch (error) {
        console.log('Could not fetch chapter progress:', error);
      }
    };
    fetchProgress();
  }, [book.id]);

  const handlePlayPauseBook = async () => {
    if (isThisBookPlaying) {
      await togglePlayPause();
    } else {
      if (!(await ensureCanListen())) return;
      const sortedBook = { ...book, chapters: sortedChapters };
      await playBook(sortedBook);
      navigation.navigate('Player', { book: sortedBook });
    }
  };

  const handlePlayChapter = async (chapter: AudioChapter, index: number) => {
    if (!chapter.isPublished || !chapter.audioUrl) return;

    const sortedBook = { ...book, chapters: sortedChapters };
    const publishedSortedChapters = sortedChapters.filter((c) => c.isPublished && c.audioUrl);
    const publishedIndex = publishedSortedChapters.findIndex((c) => c.id === chapter.id);

    // Check if this chapter is currently playing
    const isThisChapterPlaying = currentBook?.id === book.id && currentChapterIndex === publishedIndex && isPlaying;

    if (isThisChapterPlaying) {
      await togglePlayPause();
    } else if (publishedIndex !== -1) {
      if (!(await ensureCanListen())) return;
      await playBook(sortedBook, publishedIndex);
      navigation.navigate('Player', { book: sortedBook, chapterIndex: publishedIndex });
    }
  };

  const handleMiniPlayerPress = () => {
    if (currentBook) {
      navigation.navigate('Player', { book: currentBook });
    }
  };

  const renderChapterItem = (chapter: AudioChapter, index: number) => {
    const isPlayable = chapter.isPublished && chapter.audioUrl;

    // Get the published index for this chapter
    const publishedSortedChapters = sortedChapters.filter((c) => c.isPublished && c.audioUrl);
    const publishedIndex = publishedSortedChapters.findIndex((c) => c.id === chapter.id);

    // Check if this chapter is currently playing or loaded
    const isThisChapterActive = currentBook?.id === book.id && currentChapterIndex === publishedIndex;
    const isThisChapterPlaying = isThisChapterActive && isPlaying;

    // Get local chapter progress (per-chapter progress from local storage)
    const localChapterProgress = chapterProgressMap.get(publishedIndex);

    // Calculate chapter progress percentage
    // Priority: 1. Real-time position (if active), 2. Local storage progress
    let chapterProgressPercent = 0;
    if (isThisChapterActive && currentDuration > 0) {
      // Real-time progress from store
      chapterProgressPercent = Math.min((currentPosition / currentDuration) * 100, 100);
    } else if (localChapterProgress && localChapterProgress.duration > 0) {
      // Saved progress from local storage
      chapterProgressPercent = Math.min((localChapterProgress.position / localChapterProgress.duration) * 100, 100);
    } else if (localChapterProgress && chapter.duration > 0) {
      // Fallback: use chapter duration from book data
      chapterProgressPercent = Math.min((localChapterProgress.position / chapter.duration) * 100, 100);
    }

    const hasChapterProgress = chapterProgressPercent > 0;

    // Use chapter thumbnail, or fall back to book thumbnail
    const chapterThumbnail = chapter.thumbnail || book.thumbnail;
    const hasThumbnail = chapterThumbnail && chapterThumbnail.length > 0;

    return (
      <TouchableOpacity
        key={chapter.id}
        style={[
          styles.chapterItem,
          { backgroundColor: colors.card },
          !isPlayable && styles.chapterItemDisabled,
        ]}
        onPress={() => handlePlayChapter(chapter, index)}
        disabled={!isPlayable}
        activeOpacity={0.7}
      >
        {hasThumbnail ? (
          <Image
            source={{ uri: chapterThumbnail }}
            style={[styles.chapterThumbnail, { backgroundColor: colors.backgroundSecondary }]}
            contentFit="cover"
          />
        ) : (
          <DefaultBookCover title={book.title} style={styles.chapterThumbnail} />
        )}
        <View style={styles.chapterInfo}>
          <Text
            style={[
              styles.chapterTitle,
              { color: colors.text },
              !isPlayable && { color: colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {chapter.order}. {chapter.title}
          </Text>
          <View style={styles.chapterMeta}>
            {chapter.duration > 0 && (
              <Text style={[styles.chapterDuration, { color: colors.textSecondary }]}>
                {formatDuration(chapter.duration)}
              </Text>
            )}
            {hasChapterProgress && (
              <Text style={[styles.chapterProgressText, { color: colors.brand.orange }]}>
                {Math.round(chapterProgressPercent)}%
              </Text>
            )}
            {!chapter.isPublished && (
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.brand.red }]}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </View>
          {/* Progress bar */}
          {hasChapterProgress && (
            <View style={[styles.chapterProgressBar, { backgroundColor: colors.backgroundSecondary }]}>
              <View
                style={[
                  styles.chapterProgressFill,
                  { backgroundColor: colors.brand.orange, width: `${chapterProgressPercent}%` },
                ]}
              />
            </View>
          )}
        </View>
        {isPlayable ? (
          <Ionicons
            name={isThisChapterPlaying ? 'pause-circle' : 'play-circle'}
            size={32}
            color={colors.brand.orange}
          />
        ) : (
          <Ionicons name="lock-closed" size={24} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  // Show loading indicator while fetching full book data
  if (loadingBook) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.orange} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading book details...</Text>
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
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => shareBook({ book })}
        >
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          currentBook && styles.scrollContentWithPlayer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: book.thumbnail || DEFAULT_AUDIOBOOK_ARTWORK }}
            style={[styles.cover, { backgroundColor: colors.backgroundSecondary }]}
            priority="high"
            cachePolicy="memory-disk"
            contentFit="cover"
          />
        </View>

        <View style={styles.bookInfo}>
          <Text style={[styles.title, { color: colors.text }]}>{book.title}</Text>

          {paymentsEnabled && access && access.access_type !== 'free' && (
            <View style={styles.accessBadgeRow}>
              <View style={[styles.accessBadge, { backgroundColor: colors.brand.orange }]}>
                <Ionicons
                  name={access.access_type === 'prime_only' ? 'diamond' : 'star'}
                  size={12}
                  color="#fff"
                />
                <Text style={styles.accessBadgeText}>
                  {access.access_type === 'prime_only' ? 'Prime' : 'Subscriber'}
                </Text>
              </View>
              {access.can_listen && (
                <Text style={[styles.accessBadgeNote, { color: colors.brand.green }]}>
                  {access.access_type === 'prime_only' ? 'Purchased' : 'Included in your subscription'}
                </Text>
              )}
            </View>
          )}

          {/* Authors row - icon + chips */}
          <View style={styles.metadataRow}>
            <Ionicons name="create-outline" size={18} color={colors.brand.orange} />
            <View style={styles.chipsContainer}>
              {enrichedBook.author.split(', ').map((authorName, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => {
                    if (enrichedBook.author_ids?.[index]) {
                      navigation.navigate('AuthorDetails', {
                        authorId: enrichedBook.author_ids[index],
                        authorName: authorName.trim(),
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                    {authorName.trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Artists row - icon + chips */}
          {enrichedBook.narrator && (
            <View style={styles.metadataRow}>
              <Ionicons name="mic-outline" size={18} color={colors.brand.orange} />
              <View style={styles.chipsContainer}>
                {enrichedBook.narrator.split(', ').map((narratorName, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => {
                      if (enrichedBook.artist_ids?.[index]) {
                        navigation.navigate('ArtistDetails', {
                          artistId: enrichedBook.artist_ids[index],
                          artistName: narratorName.trim(),
                        });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                      {narratorName.trim()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Publication row - icon + chip */}
          {enrichedBook.publisher_name && (
            <View style={styles.metadataRow}>
              <Ionicons name="business-outline" size={18} color={colors.brand.orange} />
              <View style={styles.chipsContainer}>
                <TouchableOpacity
                  style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}
                  onPress={() => {
                    if (enrichedBook.publisher_id) {
                      navigation.navigate('PublicationDetails', {
                        publicationId: enrichedBook.publisher_id,
                        publicationName: enrichedBook.publisher_name!,
                      });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                    {enrichedBook.publisher_name}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Genres row - icon + chips */}
          {enrichedBook.genreNames && enrichedBook.genreNames.length > 0 && (
            <View style={styles.metadataRow}>
              <Ionicons name="library-outline" size={18} color={colors.brand.orange} />
              <View style={styles.chipsContainer}>
                {enrichedBook.genreNames.map((genre, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}
                    onPress={() => {
                      if (enrichedBook.genre_ids?.[index]) {
                        navigation.navigate('GenreDetails', {
                          genreId: enrichedBook.genre_ids[index],
                          genreName: genre,
                        });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                      {genre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Language, Duration, Chapters row */}
          <View style={styles.statsRow}>
            {enrichedBook.languageName && (
              <View style={styles.statItem}>
                <View style={{ width: 16, height: 16, position: 'relative' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.brand.orange, position: 'absolute', top: -2, left: 0 }}>अ</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.brand.orange, position: 'absolute', bottom: -2, right: 0 }}>A</Text>
                </View>
                <Text style={[styles.statText, { color: colors.textSecondary }]}>
                  {enrichedBook.languageName}
                </Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color={colors.brand.orange} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {formatDuration(book.duration)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="list-outline" size={18} color={colors.brand.orange} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {publishedChapters.length} / {totalChapters} chapters
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: colors.brand.orange },
              purchasing && { opacity: 0.7 },
            ]}
            onPress={handlePlayPauseBook}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={isLocked ? (access?.access_type === 'prime_only' ? 'cart' : 'star') : isThisBookPlaying ? 'pause' : 'play'}
                size={24}
                color="#fff"
              />
            )}
            <Text style={styles.playButtonText}>
              {isLocked
                ? access?.access_type === 'prime_only'
                  ? `Buy for ${playPrice ?? `₹${access.prime_price}`}`
                  : 'Subscribe to Listen'
                : isThisBookPlaying ? 'Pause Audiobook' : hasProgress ? 'Resume Audiobook' : 'Play Audiobook'}
            </Text>
          </TouchableOpacity>

          {book.description && (
            <View style={styles.descriptionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About this book</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {book.description}
              </Text>
            </View>
          )}

          <View style={styles.chaptersContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Chapters</Text>
            {sortedChapters.map((chapter, index) => renderChapterItem(chapter, index))}
          </View>
        </View>
      </ScrollView>

      <MiniPlayer onPress={handleMiniPlayerPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  scrollContentWithPlayer: {
    paddingBottom: 120,
  },
  coverContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 16,
  },
  bookInfo: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 24,
    gap: 8,
  },
  accessBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accessBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  accessBadgeNote: {
    fontSize: 13,
    fontWeight: '600',
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  descriptionContainer: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  chaptersContainer: {
    marginTop: 32,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  chapterItemDisabled: {
    opacity: 0.6,
  },
  chapterThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  chapterDuration: {
    fontSize: 13,
  },
  chapterProgressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chapterProgressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  chapterProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
});
