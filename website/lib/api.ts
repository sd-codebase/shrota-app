const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface BookShareData {
  id: string;
  title: string;
  information: string;
  thumbnail?: string;
  total_duration?: number;
  author_names: string[];
  artist_names: string[];
  genre_names: string[];
  language_name?: string;
  chapter_count: number;
  is_adult: boolean;
}

export interface BookShareError {
  status: number;
  detail: string;
}

export async function fetchBookForShare(bookId: string): Promise<BookShareData> {
  const response = await fetch(`${API_URL}/books/${bookId}/share`, {
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

export function getThumbnailUrl(thumbnailPath?: string): string {
  if (!thumbnailPath) return '';
  if (thumbnailPath.startsWith('http')) return thumbnailPath;
  return `${API_URL}/files/thumbnail/${thumbnailPath}`;
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
