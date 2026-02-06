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
import { useAuth } from '../context/AuthContext';
import { useCurrentBook } from '../stores/playerStore';
import {
  AudioBook,
  PublicationDetailResponse,
  HomeStackParamList,
  RootStackParamList,
} from '../types';
import { fetchPublicationById, fetchBooksByPublisher } from '../services/api';
import { getThumbnailUrl } from '../config';
import { Analytics, AnalyticsEvents } from '../services/analytics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList & HomeStackParamList>;
type PublicationDetailsRouteProp = RouteProp<HomeStackParamList, 'PublicationDetails'>;

const { width } = Dimensions.get('window');
const AVATAR_SIZE = width * 0.35;

export function PublicationDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PublicationDetailsRouteProp>();
  const { publicationId, publicationName } = route.params;
  const { colors, isDark } = useTheme();
  const { token } = useAuth();
  const currentBook = useCurrentBook();

  const [publication, setPublication] = useState<PublicationDetailResponse | null>(null);
  const [books, setBooks] = useState<AudioBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Track publication viewed
    Analytics.track(AnalyticsEvents.PUBLICATION_VIEWED, { publication_id: publicationId });
  }, [publicationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [publicationData, booksData] = await Promise.all([
        fetchPublicationById(publicationId),
        fetchBooksByPublisher(publicationId, 5, 0, token || undefined),
      ]);
      setPublication(publicationData);
      setBooks(booksData);
    } catch (error) {
      console.error('Failed to load publication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = (book: AudioBook) => {
    navigation.navigate('BookDetails', { book });
  };

  const handleSeeAll = () => {
    navigation.navigate('Explore', {
      publisherId: publicationId,
      title: `Books by ${publicationName}`,
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
            {publicationName}
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
          {publicationName}
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
          {publication?.photo ? (
            <Image
              source={{ uri: getThumbnailUrl(publication.photo) }}
              style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.brand.orange }]}>
              <Ionicons name="business" size={48} color="#fff" />
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={[styles.name, { color: colors.text }]}>
          {publication?.name || publicationName}
        </Text>

        {/* Label */}
        <View style={styles.labelContainer}>
          <Ionicons name="business-outline" size={16} color={colors.brand.orange} />
          <Text style={[styles.labelText, { color: colors.textSecondary }]}>Publisher</Text>
        </View>

        {/* Description */}
        {publication?.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {publication.description}
          </Text>
        )}

        {/* Books Section */}
        {books.length > 0 && (
          <View style={styles.booksSection}>
            <View style={styles.booksSectionHeader}>
              <Text style={[styles.booksSectionTitle, { color: colors.text }]}>Published Books</Text>
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
