import { API_URL, getAudioUrl, getThumbnailUrl, getChapterImageUrl } from '../config';
import { apiClient } from './apiClient';
import {
  Book,
  Author,
  Genre,
  Artist,
  Language,
  Publication,
  AudioBook,
  AudioChapter,
  SearchResult,
  SearchBookResult,
  ExploreFilters,
  AuthorDetailResponse,
  ArtistDetailResponse,
  PublicationDetailResponse,
  GenreDetailResponse,
} from '../types';

// Helper to create authenticated fetch headers (for legacy endpoints)
function getAuthHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Fetch all published books (legacy endpoint, not auth required)
export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(`${API_URL}/books/published`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

// Fetch all authors (public endpoint)
export async function fetchAuthors(): Promise<Author[]> {
  const response = await fetch(`${API_URL}/authors`);
  if (!response.ok) {
    throw new Error('Failed to fetch authors');
  }
  return response.json();
}

// Fetch all genres (public endpoint)
export async function fetchGenres(): Promise<Genre[]> {
  const response = await fetch(`${API_URL}/genres`);
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  return response.json();
}

// Fetch all languages (public endpoint)
export async function fetchLanguages(): Promise<Language[]> {
  const response = await fetch(`${API_URL}/languages`);
  if (!response.ok) {
    throw new Error('Failed to fetch languages');
  }
  return response.json();
}

// Fetch all artists/narrators (public endpoint)
export async function fetchArtists(): Promise<Artist[]> {
  const response = await fetch(`${API_URL}/artists`);
  if (!response.ok) {
    throw new Error('Failed to fetch artists');
  }
  return response.json();
}

// Fetch all publications (public endpoint)
export async function fetchPublications(): Promise<Publication[]> {
  const response = await fetch(`${API_URL}/publications`);
  if (!response.ok) {
    throw new Error('Failed to fetch publications');
  }
  return response.json();
}

// Transform backend Book to AudioBook for player
export function transformBookToAudioBook(
  book: Book,
  authors: Author[],
  artists: Artist[],
  genres?: Genre[],
  languages?: Language[],
): AudioBook {
  const authorNames = (book.author_ids || [])
    .map((id) => authors.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const narratorNames = (book.artist_ids || [])
    .map((id) => artists.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);

  const audioChapters: AudioChapter[] = sortedChapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    description: ch.description,
    order: ch.order,
    audioUrl: ch.audio_url ? getAudioUrl(ch.audio_url) : '',
    duration: ch.duration || 0,
    isPublished: ch.is_published,
    thumbnail: ch.thumbnail ? getChapterImageUrl(ch.thumbnail) : undefined,
  }));

  // Get genre names
  const genreNames = genres
    ? (book.genre_ids || [])
        .map((id) => genres.find((g) => g.id === id)?.name)
        .filter(Boolean) as string[]
    : undefined;

  // Get language name
  const languageName = languages && book.language_id
    ? languages.find((l) => l.id === book.language_id)?.name
    : undefined;

  return {
    id: book.id,
    title: book.title,
    author: authorNames || 'Unknown Author',
    narrator: narratorNames || undefined,
    thumbnail: book.thumbnail ? getThumbnailUrl(book.thumbnail) : '',
    chapters: audioChapters,
    duration: book.total_duration || 0,
    description: book.information,
    genreNames,
    languageName,
  };
}

// Fetch and transform all audiobooks
export async function fetchAudioBooks(): Promise<{
  all: AudioBook[];
  recent: AudioBook[];
}> {
  const [books, authors, artists, genres, languages] = await Promise.all([
    fetchBooks(),
    fetchAuthors(),
    fetchArtists(),
    fetchGenres(),
    fetchLanguages(),
  ]);

  const audioBooks = books
    .filter((book) => book.chapters.some((ch) => ch.is_published && ch.audio_url))
    .map((book) => transformBookToAudioBook(book, authors, artists, genres, languages));

  const recentBooks = audioBooks.slice(0, 10);

  return {
    all: audioBooks,
    recent: recentBooks,
  };
}

// Search books by query (title, author, artist, publication)
export async function searchBooks(query: string): Promise<SearchResult> {
  const response = await fetch(
    `${API_URL}/v1/search?q=${encodeURIComponent(query)}`
  );
  if (!response.ok) {
    throw new Error('Failed to search books');
  }
  return response.json();
}

// Transform SearchBookResult to AudioBook
export function transformSearchResultToAudioBook(
  book: SearchBookResult
): AudioBook {
  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);

  const audioChapters: AudioChapter[] = sortedChapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    description: ch.description,
    order: ch.order,
    audioUrl: ch.audio_url ? getAudioUrl(ch.audio_url) : '',
    duration: ch.duration || 0,
    isPublished: ch.is_published,
    thumbnail: ch.thumbnail ? getChapterImageUrl(ch.thumbnail) : undefined,
  }));

  return {
    id: book.id,
    title: book.title,
    author: book.author_names.join(', ') || 'Unknown Author',
    narrator: book.artist_names.length > 0 ? book.artist_names.join(', ') : undefined,
    thumbnail: book.thumbnail ? getThumbnailUrl(book.thumbnail) : '',
    chapters: audioChapters,
    duration: book.total_duration || 0,
    description: book.information,
    // Include IDs for navigation to entity detail screens
    genre_ids: book.genre_ids,
    author_ids: book.author_ids,
    artist_ids: book.artist_ids,
    publisher_id: book.publisher_id,
    publisher_name: book.publisher_name,
    language_id: book.language_id,
  };
}

// Mobile API response type (from new optimized endpoints)
export interface MobileBookResponse {
  id: string;
  title: string;
  information: string;
  thumbnail?: string;
  total_duration?: number;
  is_published: boolean;
  genre_ids: string[];
  genre_names?: string[];
  author_ids: string[];
  author_names: string[];
  artist_ids: string[];
  artist_names: string[];
  publisher_id?: string;
  publisher_name?: string;
  language_id?: string;
  language_name?: string;
  chapters: {
    id: string;
    title: string;
    description?: string;
    order: number;
    audio_url?: string;
    duration?: number;
    is_published: boolean;
    thumbnail?: string;
  }[];
}

// Transform MobileBookResponse to AudioBook (just process URLs)
function transformMobileBookToAudioBook(book: MobileBookResponse): AudioBook {
  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);

  const audioChapters: AudioChapter[] = sortedChapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    description: ch.description,
    order: ch.order,
    audioUrl: ch.audio_url ? getAudioUrl(ch.audio_url) : '',
    duration: ch.duration || 0,
    isPublished: ch.is_published,
    thumbnail: ch.thumbnail ? getChapterImageUrl(ch.thumbnail) : undefined,
  }));

  return {
    id: book.id,
    title: book.title,
    author: book.author_names?.join(', ') || 'Unknown Author',
    narrator: book.artist_names?.length > 0 ? book.artist_names.join(', ') : undefined,
    thumbnail: book.thumbnail ? getThumbnailUrl(book.thumbnail) : '',
    chapters: audioChapters,
    duration: book.total_duration || 0,
    description: book.information,
    genreNames: book.genre_names,
    languageName: book.language_name,
    // Include IDs for navigation to entity detail screens
    genre_ids: book.genre_ids,
    author_ids: book.author_ids,
    artist_ids: book.artist_ids,
    publisher_id: book.publisher_id,
    publisher_name: book.publisher_name,
    language_id: book.language_id,
  };
}

// Filter books to only include those with playable content
function filterPlayableBooks(books: MobileBookResponse[]): AudioBook[] {
  return books
    .filter((book) => book.chapters?.some((ch) => ch.is_published && ch.audio_url))
    .map(transformMobileBookToAudioBook);
}

/**
 * Fetch new releases for user's preferred languages.
 * Uses new optimized endpoint that reads preferences from backend.
 */
export async function fetchNewReleases(): Promise<AudioBook[]> {
  const books = await apiClient.get<MobileBookResponse[]>('/v1/mobile/new-releases');
  return filterPlayableBooks(books);
}

/**
 * Fetch featured books for user's preferred languages.
 * Uses new optimized endpoint that reads preferences from backend.
 */
export async function fetchFeaturedBooks(): Promise<AudioBook[]> {
  const books = await apiClient.get<MobileBookResponse[]>('/v1/mobile/featured');
  return filterPlayableBooks(books);
}

/**
 * Fetch books by genre, filtered by user's preferred languages.
 * Uses new optimized endpoint that reads preferences from backend.
 */
export async function fetchBooksByGenre(
  genreId: string,
  limit: number = 10,
  offset: number = 0
): Promise<AudioBook[]> {
  const books = await apiClient.get<MobileBookResponse[]>(
    `/v1/mobile/genre/${genreId}?limit=${limit}&offset=${offset}`
  );
  return filterPlayableBooks(books);
}

/**
 * Fetch books for explore screen with filters.
 * Uses new optimized endpoint. If no language filter provided,
 * uses user's preferred languages from backend.
 */
export async function fetchExploreBooks(
  filters: ExploreFilters,
  limit: number = 20,
  offset: number = 0
): Promise<AudioBook[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.genreIds && filters.genreIds.length > 0) {
    params.append('genre_ids', filters.genreIds.join(','));
  }
  if (filters.languageIds && filters.languageIds.length > 0) {
    params.append('language_ids', filters.languageIds.join(','));
  }
  if (filters.authorIds && filters.authorIds.length > 0) {
    params.append('author_ids', filters.authorIds.join(','));
  }
  if (filters.artistIds && filters.artistIds.length > 0) {
    params.append('artist_ids', filters.artistIds.join(','));
  }
  if (filters.publisherIds && filters.publisherIds.length > 0) {
    params.append('publisher_ids', filters.publisherIds.join(','));
  }

  const books = await apiClient.get<MobileBookResponse[]>(
    `/v1/mobile/explore?${params.toString()}`
  );
  return filterPlayableBooks(books);
}

/**
 * Fetch recommendations based on a book's genres.
 * Uses user's preferred languages from backend.
 */
export async function fetchBecauseYouListenedTo(
  bookId: string,
  excludeBookIds: string[],
  limit: number = 20,
  offset: number = 0
): Promise<AudioBook[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  if (excludeBookIds.length > 0) {
    params.append('exclude_book_ids', excludeBookIds.join(','));
  }

  const books = await apiClient.get<MobileBookResponse[]>(
    `/v1/mobile/because-you-listened/${bookId}?${params.toString()}`
  );
  return filterPlayableBooks(books);
}

/**
 * Fetch a single book by ID with full details.
 */
export async function fetchBookById(bookId: string): Promise<AudioBook> {
  const book = await apiClient.get<MobileBookResponse>(`/v1/mobile/book/${bookId}`);
  return transformMobileBookToAudioBook(book);
}

// Fetch author by ID (public endpoint)
export async function fetchAuthorById(authorId: string): Promise<AuthorDetailResponse> {
  const response = await fetch(`${API_URL}/authors/${authorId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch author');
  }
  return response.json();
}

// Fetch artist by ID (public endpoint)
export async function fetchArtistById(artistId: string): Promise<ArtistDetailResponse> {
  const response = await fetch(`${API_URL}/artists/${artistId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch artist');
  }
  return response.json();
}

// Fetch publication by ID (public endpoint)
export async function fetchPublicationById(publicationId: string): Promise<PublicationDetailResponse> {
  const response = await fetch(`${API_URL}/publications/${publicationId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch publication');
  }
  return response.json();
}

// Fetch genre by ID (public endpoint)
export async function fetchGenreById(genreId: string): Promise<GenreDetailResponse> {
  const response = await fetch(`${API_URL}/genres/${genreId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch genre');
  }
  return response.json();
}

// Fetch books by author (wrapper using explore API)
export async function fetchBooksByAuthor(
  authorId: string,
  limit: number = 5,
  offset: number = 0
): Promise<AudioBook[]> {
  return fetchExploreBooks({ authorIds: [authorId] }, limit, offset);
}

// Fetch books by artist (wrapper using explore API)
export async function fetchBooksByArtist(
  artistId: string,
  limit: number = 5,
  offset: number = 0
): Promise<AudioBook[]> {
  return fetchExploreBooks({ artistIds: [artistId] }, limit, offset);
}

// Fetch books by publisher (wrapper using explore API)
export async function fetchBooksByPublisher(
  publisherId: string,
  limit: number = 5,
  offset: number = 0
): Promise<AudioBook[]> {
  return fetchExploreBooks({ publisherIds: [publisherId] }, limit, offset);
}
