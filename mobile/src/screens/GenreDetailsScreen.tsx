import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MiniPlayer } from '../components/MiniPlayer';
import { BookListItem } from '../components/cards/BookListItem';
import { useTheme } from '../context/ThemeContext';
import { useCurrentBook } from '../stores/playerStore';
import {
  AudioBook,
  GenreDetailResponse,
  HomeStackParamList,
  RootStackParamList,
} from '../types';
import { fetchGenreById, fetchBooksByGenre } from '../services/api';
import { getThumbnailUrl } from '../config';

type NavigationProp = NativeStackNavigationProp<RootStackParamList & HomeStackParamList>;
type GenreDetailsRouteProp = RouteProp<HomeStackParamList, 'GenreDetails'>;

const { width } = Dimensions.get('window');
const AVATAR_SIZE = width * 0.35;

export function GenreDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GenreDetailsRouteProp>();
  const { genreId, genreName } = route.params;
  const { colors, isDark } = useTheme();
  const currentBook = useCurrentBook();

  const [genre, setGenre] = useState<GenreDetailResponse | null>(null);
  const [books, setBooks] = useState<AudioBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [genreId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [genreData, booksData] = await Promise.all([
        fetchGenreById(genreId),
        fetchBooksByGenre(genreId, 5, 0),
      ]);
      setGenre(genreData);
      setBooks(booksData);
    } catch (error) {
      console.error('Failed to load genre data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = (book: AudioBook) => {
    navigation.navigate('BookDetails', { book });
  };

  const handleSeeAll = () => {
    navigation.navigate('Explore', {
      genreId,
      title: genreName,
    });
  };

  const handleMiniPlayerPress = () => {
    if (currentBook) {
      navigation.navigate('Player', { book: currentBook });
    }
  };

  if (loading) {
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
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {genreName}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {genreName}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          currentBook && styles.scrollContentWithPlayer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {genre?.thumbnail ? (
            <Image
              source={{ uri: getThumbnailUrl(genre.thumbnail) }}
              style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.brand.orange }]}>
              <Ionicons name="library" size={48} color="#fff" />
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={[styles.name, { color: colors.text }]}>
          {genre?.name || genreName}
        </Text>

        {/* Label */}
        <View style={styles.labelContainer}>
          <Ionicons name="library-outline" size={16} color={colors.brand.orange} />
          <Text style={[styles.labelText, { color: colors.textSecondary }]}>Genre</Text>
        </View>

        {/* Description */}
        {genre?.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {genre.description}
          </Text>
        )}

        {/* Books Section */}
        {books.length > 0 && (
          <View style={styles.booksSection}>
            <View style={styles.booksSectionHeader}>
              <Text style={[styles.booksSectionTitle, { color: colors.text }]}>Books in this Genre</Text>
              <TouchableOpacity onPress={handleSeeAll} style={styles.seeAllButton}>
                <Text style={[styles.seeAllText, { color: colors.brand.orange }]}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.brand.orange} />
              </TouchableOpacity>
            </View>
            <View style={styles.booksList}>
              {books.map((book) => (
                <BookListItem key={book.id} book={book} onPress={handleBookPress} />
              ))}
            </View>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  booksSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  booksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  booksSectionTitle: {
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
  booksList: {
    gap: 12,
  },
});
