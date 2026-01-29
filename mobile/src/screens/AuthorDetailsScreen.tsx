import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Linking,
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
  AuthorDetailResponse,
  HomeStackParamList,
  RootStackParamList,
} from '../types';
import { fetchAuthorById, fetchBooksByAuthor } from '../services/api';
import { getThumbnailUrl } from '../config';

type NavigationProp = NativeStackNavigationProp<RootStackParamList & HomeStackParamList>;
type AuthorDetailsRouteProp = RouteProp<HomeStackParamList, 'AuthorDetails'>;

const { width } = Dimensions.get('window');
const AVATAR_SIZE = width * 0.35;

export function AuthorDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AuthorDetailsRouteProp>();
  const { authorId, authorName } = route.params;
  const { colors, isDark } = useTheme();
  const { token } = useAuth();
  const currentBook = useCurrentBook();

  const [author, setAuthor] = useState<AuthorDetailResponse | null>(null);
  const [books, setBooks] = useState<AudioBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [authorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [authorData, booksData] = await Promise.all([
        fetchAuthorById(authorId),
        fetchBooksByAuthor(authorId, 5, 0, token || undefined),
      ]);
      setAuthor(authorData);
      setBooks(booksData);
    } catch (error) {
      console.error('Failed to load author data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookPress = (book: AudioBook) => {
    navigation.navigate('BookDetails', { book });
  };

  const handleSeeAll = () => {
    navigation.navigate('Explore', {
      authorId,
      title: `Books by ${authorName}`,
    });
  };

  const handleMiniPlayerPress = () => {
    if (currentBook) {
      navigation.navigate('Player', { book: currentBook });
    }
  };

  const openSocialLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  const renderSocialLinks = () => {
    const social = author?.social_media;
    if (!social) return null;

    const links = [
      { key: 'facebook', icon: 'logo-facebook', url: social.facebook, color: '#1877F2' },
      { key: 'instagram', icon: 'logo-instagram', url: social.instagram, color: '#E4405F' },
      { key: 'youtube', icon: 'logo-youtube', url: social.youtube, color: '#FF0000' },
      { key: 'x', icon: 'logo-twitter', url: social.x, color: colors.text },
    ].filter((l) => l.url);

    if (links.length === 0) return null;

    return (
      <View style={styles.socialContainer}>
        {links.map((link) => (
          <TouchableOpacity
            key={link.key}
            style={[styles.socialButton, { backgroundColor: colors.card }]}
            onPress={() => openSocialLink(link.url!)}
            activeOpacity={0.7}
          >
            <Ionicons name={link.icon as any} size={24} color={link.color} />
          </TouchableOpacity>
        ))}
      </View>
    );
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
            {authorName}
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
          {authorName}
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
          {author?.photo ? (
            <Image
              source={{ uri: getThumbnailUrl(author.photo) }}
              style={[styles.avatar, { backgroundColor: colors.backgroundSecondary }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.brand.orange }]}>
              <Text style={styles.avatarInitial}>
                {author?.name?.charAt(0).toUpperCase() || authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Name */}
        <Text style={[styles.name, { color: colors.text }]}>
          {author?.name || authorName}
        </Text>

        {/* Bio */}
        {author?.bio && (
          <Text style={[styles.bio, { color: colors.textSecondary }]}>
            {author.bio}
          </Text>
        )}

        {/* Social Links */}
        {renderSocialLinks()}

        {/* Books Section */}
        {books.length > 0 && (
          <View style={styles.booksSection}>
            <View style={styles.booksSectionHeader}>
              <Text style={[styles.booksSectionTitle, { color: colors.text }]}>Books</Text>
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
  avatarInitial: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bio: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
