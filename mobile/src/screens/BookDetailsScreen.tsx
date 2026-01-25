import React from 'react';
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
import { AudioBook, AudioChapter, RootStackParamList, HomeStackParamList } from '../types';
import { formatDuration } from '../utils/formatters';

type NavigationProp = NativeStackNavigationProp<RootStackParamList & HomeStackParamList>;
type BookDetailsRouteProp = RouteProp<HomeStackParamList, 'BookDetails'>;

const { width } = Dimensions.get('window');
const COVER_SIZE = width - 80;

export function BookDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BookDetailsRouteProp>();
  const { book } = route.params;
  const { colors, isDark } = useTheme();

  const { playBook, currentBook } = usePlayer();

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);
  const publishedChapters = sortedChapters.filter((c) => c.isPublished);
  const totalChapters = sortedChapters.length;

  const handlePlayBook = async () => {
    const sortedBook = { ...book, chapters: sortedChapters };
    await playBook(sortedBook);
    navigation.navigate('Player', { book: sortedBook });
  };

  const handlePlayChapter = async (chapter: AudioChapter, index: number) => {
    if (!chapter.isPublished || !chapter.audioUrl) return;

    const sortedBook = { ...book, chapters: sortedChapters };
    const publishedSortedChapters = sortedChapters.filter((c) => c.isPublished && c.audioUrl);
    const publishedIndex = publishedSortedChapters.findIndex((c) => c.id === chapter.id);

    if (publishedIndex !== -1) {
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
            {!chapter.isPublished && (
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.brand.red }]}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </View>
        </View>
        {isPlayable ? (
          <Ionicons name="play-circle" size={32} color={colors.brand.orange} />
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
            source={{ uri: book.thumbnail }}
            style={[styles.cover, { backgroundColor: colors.backgroundSecondary }]}
            priority="high"
            cachePolicy="memory-disk"
            contentFit="cover"
          />
        </View>

        <View style={styles.bookInfo}>
          <Text style={[styles.title, { color: colors.text }]}>{book.title}</Text>
          <Text style={[styles.author, { color: colors.textSecondary }]}>by {book.author}</Text>
          {book.narrator && (
            <Text style={[styles.narrator, { color: colors.textSecondary }]}>
              Narrated by {book.narrator}
            </Text>
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
            onPress={handlePlayBook}
          >
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.playButtonText}>Play Audiobook</Text>
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
  author: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  narrator: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
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
