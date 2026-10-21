const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
// Server-side fetches use the internal Docker service name; falls back to API_URL outside Docker
const SERVER_API_URL = process.env.INTERNAL_API_URL || API_URL;

export interface BookShareChapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  image?: string;
  duration?: number;
}

// A book's genre with the slug of its /category/<slug> page.
export interface GenreLink {
  name: string;
  slug: string;
}

export interface BookShareData {
  id: string;
  slug: string;
  title: string;
  information: string;
  thumbnail?: string;
  total_duration?: number;
  author_names: string[];
  artist_names: string[];
  genre_names: string[];
  genres: GenreLink[];
  language_name?: string;
  chapter_count: number;
  chapters: BookShareChapter[];
  is_adult: boolean;
}

export interface BookShareError {
  status: number;
  detail: string;
}

// `identifier` may be either a book UUID (app deep/share links) or a slug
// (website catalog links) — the backend resolves whichever it matches. An old
// slug returns the book with its current `slug`, so the page can redirect.
export async function fetchBookForShare(identifier: string): Promise<BookShareData> {
  const response = await fetch(`${SERVER_API_URL}/books/${encodeURIComponent(identifier)}/share`, {
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!response.ok) {
    const error: BookShareError = {
      status: response.status,
      detail: response.status === 404
        ? 'Book not found'
        : response.status === 403
          ? 'This content is restricted'
          : 'Failed to fetch book',
    };
    throw error;
  }

  return response.json();
}

export interface BookCatalogItem {
  id: string;
  slug: string;
  title: string;
  information: string;
  thumbnail?: string;
  total_duration?: number;
  author_names: string[];
  artist_names: string[];
  genre_names: string[];
  genres: GenreLink[];
  language_name?: string;
  chapter_count: number;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  book_count: number;
}

// Genres that have books on the public catalog, for /category/<slug> pages.
export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${SERVER_API_URL}/genres/public`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export async function fetchBookCatalog(): Promise<BookCatalogItem[]> {
  try {
    const response = await fetch(`${SERVER_API_URL}/books/public`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

// Current slug for a category slug an admin has since changed, or null.
export async function fetchCategoryRedirect(oldSlug: string): Promise<string | null> {
  try {
    const response = await fetch(`${SERVER_API_URL}/genres/redirect/${encodeURIComponent(oldSlug)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    return (await response.json()).slug;
  } catch {
    return null;
  }
}

export function getThumbnailUrl(thumbnailPath?: string): string {
  if (!thumbnailPath) return '';
  if (thumbnailPath.startsWith('http')) return thumbnailPath;
  return `${API_URL}/files/thumbnail/${thumbnailPath}`;
}

export function getChapterImageUrl(imagePath?: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_URL}/files/chapter-image/${imagePath}`;
}

export interface Event {
  id: string;
  title: string;
  text: string;
  cover_image?: string;
  show_on_home: boolean;
  created_at: string;
}

export async function fetchHomeEvents(): Promise<Event[]> {
  try {
    const response = await fetch(`${API_URL}/events/home`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export async function fetchAllEvents(): Promise<Event[]> {
  try {
    const response = await fetch(`${SERVER_API_URL}/events/public`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export function getEventCoverUrl(filename?: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${API_URL}/files/event-cover/${filename}`;
}

export interface News {
  id: string;
  title: string;
  slug: string;
  text: string;
  cover_image?: string;
  created_at: string;
  updated_at?: string;
}

export async function fetchAllNews(): Promise<News[]> {
  try {
    const response = await fetch(`${SERVER_API_URL}/news/public`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export async function fetchNewsBySlug(slug: string): Promise<News | null> {
  try {
    const response = await fetch(`${SERVER_API_URL}/news/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export function getNewsCoverUrl(filename?: string): string {
  if (!filename) return '';
  if (filename.startsWith('http')) return filename;
  return `${API_URL}/files/news-cover/${filename}`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}
