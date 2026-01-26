import { API_URL, getAudioUrl, getThumbnailUrl } from '../config';
import {
  Book,
  Author,
  Genre,
  Artist,
  Language,
  AudioBook,
  AudioChapter,
  SearchResult,
  SearchBookResult,
} from '../types';

// Fetch all published books
export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(`${API_URL}/books/published`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

// Fetch all authors
export async function fetchAuthors(): Promise<Author[]> {
  const response = await fetch(`${API_URL}/authors`);
  if (!response.ok) {
    throw new Error('Failed to fetch authors');
  }
  return response.json();
}

// Fetch all genres
export async function fetchGenres(): Promise<Genre[]> {
  const response = await fetch(`${API_URL}/genres`);
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  return response.json();
}

// Fetch all languages
export async function fetchLanguages(): Promise<Language[]> {
  const response = await fetch(`${API_URL}/languages`);
  if (!response.ok) {
    throw new Error('Failed to fetch languages');
  }
  return response.json();
}

// Fetch all artists (narrators)
export async function fetchArtists(): Promise<Artist[]> {
  const response = await fetch(`${API_URL}/artists`);
  if (!response.ok) {
    throw new Error('Failed to fetch artists');
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
  };
}
