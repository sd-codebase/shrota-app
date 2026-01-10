import { Environment, ENVIRONMENTS, getAudioUrl, getThumbnailUrl } from '../config';
import {
  Book,
  Author,
  Genre,
  Artist,
  AudioBook,
  AudioChapter,
} from '../types';

// Get API URL for environment
const getApiUrl = (environment: Environment): string => ENVIRONMENTS[environment].apiUrl;

// Fetch all published books (sorted by created_at DESC from backend)
export async function fetchBooks(environment: Environment): Promise<Book[]> {
  const response = await fetch(`${getApiUrl(environment)}/books/published`);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

// Fetch all authors
export async function fetchAuthors(environment: Environment): Promise<Author[]> {
  const response = await fetch(`${getApiUrl(environment)}/authors`);
  if (!response.ok) {
    throw new Error('Failed to fetch authors');
  }
  return response.json();
}

// Fetch all genres
export async function fetchGenres(environment: Environment): Promise<Genre[]> {
  const response = await fetch(`${getApiUrl(environment)}/genres`);
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  return response.json();
}

// Fetch all artists (narrators)
export async function fetchArtists(environment: Environment): Promise<Artist[]> {
  const response = await fetch(`${getApiUrl(environment)}/artists`);
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
  environment: Environment,
): AudioBook {
  // Get author names from author_ids (multiple authors)
  const authorNames = (book.author_ids || [])
    .map((id) => authors.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  // Get narrator names from artist_ids
  const narratorNames = (book.artist_ids || [])
    .map((id) => artists.find((a) => a.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  // Include all chapters sorted by order
  // Published chapters with audio_url are playable
  // Unpublished chapters show as "coming soon"
  const sortedChapters = [...book.chapters].sort((a, b) => a.order - b.order);

  const audioChapters: AudioChapter[] = sortedChapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    description: ch.description,
    order: ch.order,
    audioUrl: ch.audio_url ? getAudioUrl(ch.audio_url, environment) : '',
    duration: ch.duration || 0,
    isPublished: ch.is_published,
  }));

  return {
    id: book.id,
    title: book.title,
    author: authorNames || 'Unknown Author',
    narrator: narratorNames || undefined,
    thumbnail: book.thumbnail ? getThumbnailUrl(book.thumbnail, environment) : '',
    chapters: audioChapters,
    duration: book.total_duration || 0,
    description: book.information,
  };
}

// Fetch and transform all audiobooks
// Books are already sorted by created_at DESC from backend
export async function fetchAudioBooks(environment: Environment): Promise<{
  all: AudioBook[];
  recent: AudioBook[];
}> {
  const [books, authors, artists] = await Promise.all([
    fetchBooks(environment),
    fetchAuthors(environment),
    fetchArtists(environment),
  ]);

  // Transform all published books to AudioBooks
  // Filter books that have at least one published chapter with audio
  const audioBooks = books
    .filter((book) => book.chapters.some((ch) => ch.is_published && ch.audio_url))
    .map((book) => transformBookToAudioBook(book, authors, artists, environment));

  // Recent books are the first 10 (already sorted by created_at DESC from backend)
  const recentBooks = audioBooks.slice(0, 10);

  return {
    all: audioBooks,
    recent: recentBooks,
  };
}
