import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MiniPlayer } from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';
import { AudioBook, AudioChapter, RootStackParamList, HomeStackParamList, BookProgress } from '../types';
import { formatDuration } from '../utils/formatters';
import { getBookProgress } from '../services/userActivityApi';
import { getBookChapterProgress, ChapterProgress } from '../services/chapterProgressService';
import { useIsBookPlaying, useCurrentBook, useCurrentChapterIndex, useIsPlaying, usePlaybackProgress } from '../stores/playerStore';
import { DEFAULT_AUDIOBOOK_ARTWORK } from '../constants/placeholders';

type NavigationProp = NativeStackNavigationProp<RootStackParamList & HomeStackParamList>;
type BookDetailsRouteProp = RouteProp<HomeStackParamList, 'BookDetails'>;

const { width } = Dimensions.get('window');
const COVER_SIZE = width * 0.55;

export function BookDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BookDetailsRouteProp>();
  const { book } = route.params;
  const { colors, isDark } = useTheme();

  const { playBook, togglePlayPause } = usePlayer();
  const [savedProgress, setSavedProgress] = useState<BookProgress | null>(null);
  const [chapterProgressMap, setChapterProgressMap] = useState<Map<number, ChapterProgress>>(new Map());

  // Use Zustand store for current playing state
  const currentBook = useCurrentBook();
  const isThisBookPlaying = useIsBookPlaying(book.id);
  const currentChapterIndex = useCurrentChapterIndex();
  const isPlaying = useIsPlaying();
  const { position: currentPosition, duration: currentDuration } = usePlaybackProgress();

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);
  const publishedChapters = sortedChapters.filter((c) => c.isPublished);
  const totalChapters = sortedChapters.length;

  // Check if book has progress for "Resume" button
  const hasProgress = savedProgress !== null && !savedProgress.is_completed && savedProgress.progress_percentage > 0;

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
        <View
          style={[
            styles.chapterNumber,
            { backgroundColor: colors.backgroundSecondary },
            isPlayable && { backgroundColor: colors.brand.orange },
          ]}
        >
          <Text
            style={[
              styles.chapterNumberText,
              { color: colors.textSecondary },
              isPlayable && styles.chapterNumberTextActive,
            ]}
          >
            {index + 1}
          </Text>
        </View>
        <View style={styles.chapterInfo}>
          <Text
            style={[
              styles.chapterTitle,
              { color: colors.text },
              !isPlayable && { color: colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {chapter.title}
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

          {/* Genre and Language chips */}
          {(book.genreNames?.length || book.languageName) && (
            <View style={styles.chipsContainer}>
              {book.languageName && (
                <View style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={{ width: 16, height: 16, position: 'relative' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.brand.orange, position: 'absolute', top: -2, left: 0 }}>अ</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.brand.orange, position: 'absolute', bottom: -2, right: 0 }}>A</Text>
                  </View>
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                    {book.languageName}
                  </Text>
                </View>
              )}
              {book.genreNames?.map((genre, index) => (
                <View key={index} style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="library-outline" size={14} color={colors.brand.blue} />
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                    {genre}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.authorRow}>
            <Ionicons name="create-outline" size={18} color={colors.brand.orange} />
            <Text style={[styles.author, { color: colors.textSecondary }]}>{book.author}</Text>
          </View>
          {book.narrator && (
            <View style={styles.narratorRow}>
              <Ionicons name="mic-outline" size={18} color={colors.brand.orange} />
              <Text style={[styles.narrator, { color: colors.textSecondary }]}>{book.narrator}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
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
            style={[styles.playButton, { backgroundColor: colors.brand.orange }]}
            onPress={handlePlayPauseBook}
          >
            <Ionicons name={isThisBookPlaying ? 'pause' : 'play'} size={24} color="#fff" />
            <Text style={styles.playButtonText}>
              {isThisBookPlaying ? 'Pause Audiobook' : hasProgress ? 'Resume Audiobook' : 'Play Audiobook'}
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  author: {
    fontSize: 16,
  },
  narratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 6,
  },
  narrator: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
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
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chapterNumberTextActive: {
    color: '#fff',
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
