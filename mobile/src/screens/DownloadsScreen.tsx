import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MiniPlayer } from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';
import { useDownload } from '../context/DownloadContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { formatBytes } from '../services/downloadService';
import { getThumbnailUrl } from '../config';
import {
  getContinueListening,
  getCompletedBooks,
  getLikedBooks,
} from '../services/userActivityApi';
import { DownloadedBook, RootStackParamList, BookshelfStackParamList, BookProgress, LikedBook, AudioBook } from '../types';
import { formatDuration } from '../utils/formatters';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<BookshelfStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

type TabType = 'continue' | 'downloaded' | 'listened' | 'liked';

interface Tab {
  key: TabType;
  label: string;
  icon: string;
  iconFocused: string;
}

const TABS: Tab[] = [
  { key: 'continue', label: 'Continue', icon: 'play-circle-outline', iconFocused: 'play-circle' },
  { key: 'downloaded', label: 'Downloaded', icon: 'download-outline', iconFocused: 'download' },
  { key: 'listened', label: 'Listened', icon: 'checkmark-circle-outline', iconFocused: 'checkmark-circle' },
  { key: 'liked', label: 'Liked', icon: 'heart-outline', iconFocused: 'heart' },
];

export function DownloadsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { playBook, currentBook } = usePlayer();
  const { downloads, refreshDownloads, deleteDownload } = useDownload();
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('continue');

  // Data states
  const [continueBooks, setContinueBooks] = useState<BookProgress[]>([]);
  const [listenedBooks, setListenedBooks] = useState<BookProgress[]>([]);
  const [likedBooks, setLikedBooks] = useState<LikedBook[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data when tab changes or screen focuses
  const fetchTabData = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      switch (activeTab) {
        case 'continue':
          const continueData = await getContinueListening();
          setContinueBooks(continueData);
          break;
        case 'listened':
          const listenedData = await getCompletedBooks();
          setListenedBooks(listenedData);
          break;
        case 'liked':
          const likedData = await getLikedBooks();
          setLikedBooks(likedData);
          break;
      }
    } catch (error) {
      console.log('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      refreshDownloads();
      fetchTabData();
    }, [fetchTabData])
  );

  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const sortedDownloads = [...downloads].sort((a, b) => b.downloadedAt - a.downloadedAt);

  const handlePlayDownloaded = async (book: DownloadedBook) => {
    await playBook(book);
  };

  const handlePlayProgress = async (progress: BookProgress) => {
    // Create AudioBook from progress data
    const audioBook: AudioBook = {
      id: progress.book_id,
      title: progress.book_title || 'Unknown',
      author: progress.book_author_names?.join(', ') || 'Unknown Author',
      thumbnail: progress.book_thumbnail ? getThumbnailUrl(progress.book_thumbnail) : '',
      chapters: [], // Will be loaded when playing
      duration: progress.book_duration || 0,
      description: '',
    };
    navigation.navigate('BookDetails', { book: audioBook });
  };

  const handlePlayLiked = async (liked: LikedBook) => {
    const audioBook: AudioBook = {
      id: liked.book_id,
      title: liked.book_title || 'Unknown',
      author: liked.book_author_names?.join(', ') || 'Unknown Author',
      thumbnail: liked.book_thumbnail ? getThumbnailUrl(liked.book_thumbnail) : '',
      chapters: [],
      duration: liked.book_duration || 0,
      description: '',
    };
    navigation.navigate('BookDetails', { book: audioBook });
  };

  const handleDelete = (book: DownloadedBook) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to remove "${book.title}" from your downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDownload(book.id);
          },
        },
      ]
    );
  };

  const handleMiniPlayerPress = () => {
    if (currentBook) {
      navigation.navigate('Player', { book: currentBook });
    }
  };

  const renderDownloadedItem = ({ item }: { item: DownloadedBook }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.card }]}
      onPress={() => handlePlayDownloaded(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.thumbnail }}
        style={[styles.thumbnail, { backgroundColor: colors.backgroundSecondary }]}
        priority="high"
        cachePolicy="memory-disk"
        contentFit="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.itemAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.author}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemDuration, { color: colors.textSecondary }]}>
            {formatDuration(item.duration)}
          </Text>
          <Text style={[styles.itemSize, { color: colors.textSecondary }]}>
            {formatBytes(item.totalSize)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Ionicons name="trash-outline" size={22} color={colors.brand.red} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderProgressItem = ({ item }: { item: BookProgress }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.card }]}
      onPress={() => handlePlayProgress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: getThumbnailUrl(item.book_thumbnail || '') }}
          style={[styles.thumbnail, { backgroundColor: colors.backgroundSecondary }]}
          priority="high"
          cachePolicy="memory-disk"
          contentFit="cover"
        />
        {/* Progress overlay */}
        <View style={[styles.progressOverlay, { backgroundColor: colors.backgroundSecondary }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.brand.orange, width: `${item.progress_percentage}%` },
            ]}
          />
        </View>
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
          {item.book_title}
        </Text>
        <Text style={[styles.itemAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.book_author_names?.join(', ') || 'Unknown Author'}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemDuration, { color: colors.textSecondary }]}>
            Ch. {item.current_chapter_index + 1}
          </Text>
          <Text style={[styles.itemSize, { color: colors.brand.orange }]}>
            {Math.round(item.progress_percentage)}%
          </Text>
        </View>
      </View>
      <Ionicons name="play-circle" size={32} color={colors.brand.orange} />
    </TouchableOpacity>
  );

  const renderLikedItem = ({ item }: { item: LikedBook }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.card }]}
      onPress={() => handlePlayLiked(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: getThumbnailUrl(item.book_thumbnail || '') }}
        style={[styles.thumbnail, { backgroundColor: colors.backgroundSecondary }]}
        priority="high"
        cachePolicy="memory-disk"
        contentFit="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
          {item.book_title}
        </Text>
        <Text style={[styles.itemAuthor, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.book_author_names?.join(', ') || 'Unknown Author'}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemDuration, { color: colors.textSecondary }]}>
            {formatDuration(item.book_duration || 0)}
          </Text>
        </View>
      </View>
      <Ionicons name="heart" size={24} color={colors.brand.red} />
    </TouchableOpacity>
  );

  const renderEmptyState = (icon: string, title: string, description: string) => (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon as any} size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );

  const renderLoginPrompt = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Login Required</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Please login to track your listening progress
      </Text>
    </View>
  );

  const renderTabContent = () => {
    if (loading && activeTab !== 'downloaded') {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.orange} />
        </View>
      );
    }

    switch (activeTab) {
      case 'continue':
        if (!isAuthenticated) return renderLoginPrompt();
        return (
          <FlatList
            data={continueBooks}
            keyExtractor={(item) => item.id}
            renderItem={renderProgressItem}
            contentContainerStyle={[
              styles.listContent,
              continueBooks.length === 0 && styles.emptyListContent,
              currentBook && styles.listContentWithPlayer,
            ]}
            ListEmptyComponent={() =>
              renderEmptyState(
                'play-circle-outline',
                'Continue Listening',
                'Your in-progress audiobooks will appear here. Start listening to see them.'
              )
            }
            showsVerticalScrollIndicator={false}
          />
        );

      case 'downloaded':
        return (
          <FlatList
            data={sortedDownloads}
            keyExtractor={(item) => item.id}
            renderItem={renderDownloadedItem}
            contentContainerStyle={[
              styles.listContent,
              sortedDownloads.length === 0 && styles.emptyListContent,
              currentBook && styles.listContentWithPlayer,
            ]}
            ListEmptyComponent={() =>
              renderEmptyState(
                'download-outline',
                'No Downloads',
                'Download audiobooks to listen offline. Open a book and tap the download icon.'
              )
            }
            showsVerticalScrollIndicator={false}
          />
        );

      case 'listened':
        if (!isAuthenticated) return renderLoginPrompt();
        return (
          <FlatList
            data={listenedBooks}
            keyExtractor={(item) => item.id}
            renderItem={renderProgressItem}
            contentContainerStyle={[
              styles.listContent,
              listenedBooks.length === 0 && styles.emptyListContent,
              currentBook && styles.listContentWithPlayer,
            ]}
            ListEmptyComponent={() =>
              renderEmptyState(
                'checkmark-circle-outline',
                'Listened',
                "Audiobooks you've finished listening to will appear here."
              )
            }
            showsVerticalScrollIndicator={false}
          />
        );

      case 'liked':
        if (!isAuthenticated) return renderLoginPrompt();
        return (
          <FlatList
            data={likedBooks}
            keyExtractor={(item) => item.id}
            renderItem={renderLikedItem}
            contentContainerStyle={[
              styles.listContent,
              likedBooks.length === 0 && styles.emptyListContent,
              currentBook && styles.listContentWithPlayer,
            ]}
            ListEmptyComponent={() =>
              renderEmptyState(
                'heart-outline',
                'Liked',
                'Tap the heart icon on any audiobook to save it here.'
              )
            }
            showsVerticalScrollIndicator={false}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bookshelf</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScrollView}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                { backgroundColor: isActive ? colors.brand.orange : colors.card },
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(isActive ? tab.iconFocused : tab.icon) as any}
                size={18}
                color={isActive ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? '#fff' : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  emptyListContent: {
    flex: 1,
  },
  listContentWithPlayer: {
    paddingBottom: 140,
  },
  item: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemAuthor: {
    fontSize: 14,
    marginTop: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  itemDuration: {
    fontSize: 12,
  },
  itemSize: {
    fontSize: 12,
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 12,
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
