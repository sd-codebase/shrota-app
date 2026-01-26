import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MiniPlayer } from '../components/MiniPlayer';
import { PreferencesModal } from '../components/PreferencesModal';
import { useTheme } from '../context/ThemeContext';
import { fetchAudioBooks } from '../services/api';
import { hasUserPreferences, getUserPreferences, UserPreferences } from '../services/preferencesService';
import { AudioBook, RootStackParamList, HomeStackParamList } from '../types';
import { formatDuration } from '../utils/formatters';
import { useCurrentBook } from '../stores/playerStore';

type NavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function BooksScreen() {
  const navigation = useNavigation<NavigationProp>();
  const currentBook = useCurrentBook();
  const { colors, isDark } = useTheme();
  const [books, setBooks] = useState<AudioBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const data = await fetchAudioBooks();
      setBooks(data.all);
    } catch (err) {
      console.error('Failed to load audiobooks:', err);
      setError('Failed to load audiobooks. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check if user has set preferences and load them
  useEffect(() => {
    const checkPreferences = async () => {
      const hasPrefs = await hasUserPreferences();
      if (!hasPrefs) {
        setIsEditingPreferences(false);
        setShowPreferencesModal(true);
      } else {
        const prefs = await getUserPreferences();
        setPreferences(prefs);
      }
    };
    checkPreferences();
  }, []);

  const handlePreferencesComplete = async () => {
    setShowPreferencesModal(false);
    setIsEditingPreferences(false);
    // Reload preferences
    const prefs = await getUserPreferences();
    setPreferences(prefs);
    // Optionally reload data with new preferences
    loadData();
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

  const renderItem = ({ item }: { item: AudioBook }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.card }]}
      onPress={() => handleBookPress(item)}
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
          <Text style={[styles.itemChapters, { color: colors.textSecondary }]}>
            {item.chapters.filter((c) => c.isPublished).length} chapters
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.brand.orange} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="library-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Books Available
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No audiobooks available yet.
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
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading audiobooks...
          </Text>
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
        <View style={styles.headerLeft}>
          <Ionicons name="headset" size={28} color={colors.brand.orange} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Shrota</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.card }]}
          onPress={handleOpenPreferences}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      ) : (
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
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.orange}
              colors={[colors.brand.orange]}
            />
          }
        />
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
  itemChapters: {
    fontSize: 12,
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
});
