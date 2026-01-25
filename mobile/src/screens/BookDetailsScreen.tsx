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
import { AudioBook, AudioChapter, RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type BookDetailsRouteProp = RouteProp<RootStackParamList, 'BookDetails'>;

const { width } = Dimensions.get('window');
const COVER_SIZE = width - 80;

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function BookDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BookDetailsRouteProp>();
  const { book } = route.params;

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
        style={[styles.chapterItem, !isPlayable && styles.chapterItemDisabled]}
        onPress={() => handlePlayChapter(chapter, index)}
        disabled={!isPlayable}
        activeOpacity={0.7}
      >
        <View style={[styles.chapterNumber, isPlayable && styles.chapterNumberActive]}>
          <Text style={[styles.chapterNumberText, isPlayable && styles.chapterNumberTextActive]}>
            {index + 1}
          </Text>
        </View>
        <View style={styles.chapterInfo}>
          <Text style={[styles.chapterTitle, !isPlayable && styles.chapterTitleDisabled]} numberOfLines={2}>
            {chapter.title}
          </Text>
          <View style={styles.chapterMeta}>
            {chapter.duration > 0 && (
              <Text style={styles.chapterDuration}>{formatDuration(chapter.duration)}</Text>
            )}
            {!chapter.isPublished && (
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            )}
          </View>
        </View>
        {isPlayable ? (
          <Ionicons name="play-circle" size={32} color="#6c5ce7" />
        ) : (
          <Ionicons name="lock-closed" size={24} color="#444" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
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
            style={styles.cover}
            priority="high"
            cachePolicy="memory-disk"
            contentFit="cover"
          />
        </View>

        <View style={styles.bookInfo}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>
          {book.narrator && (
            <Text style={styles.narrator}>Narrated by {book.narrator}</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color="#6c5ce7" />
              <Text style={styles.statText}>{formatDuration(book.duration)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="list-outline" size={18} color="#6c5ce7" />
              <Text style={styles.statText}>
                {publishedChapters.length} / {totalChapters} chapters
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.playButton} onPress={handlePlayBook}>
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.playButtonText}>Play Audiobook</Text>
          </TouchableOpacity>

          {book.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>About this book</Text>
              <Text style={styles.description}>{book.description}</Text>
            </View>
          )}

          <View style={styles.chaptersContainer}>
            <Text style={styles.sectionTitle}>Chapters</Text>
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
    backgroundColor: '#0f0f1a',
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
    backgroundColor: '#2a2a3e',
  },
  bookInfo: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  author: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  narrator: {
    fontSize: 14,
    color: '#666',
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
    color: '#888',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6c5ce7',
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
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#aaa',
    lineHeight: 24,
  },
  chaptersContainer: {
    marginTop: 32,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberActive: {
    backgroundColor: '#6c5ce7',
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
    color: '#fff',
  },
  chapterTitleDisabled: {
    color: '#666',
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  chapterDuration: {
    fontSize: 13,
    color: '#666',
  },
  comingSoonBadge: {
    backgroundColor: '#ff6b6b',
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
