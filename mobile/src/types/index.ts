// Backend API Types
export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  x?: string;
}

export interface Language {
  id: string;
  name: string;
  code: string;
}

export interface Genre {
  id: string;
  name: string;
  description?: string;
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  social_media?: SocialMedia;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  social_media?: SocialMedia;
}

export interface Publication {
  id: string;
  name: string;
  description?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  file_id?: string;
  audio_url?: string;
  duration?: number;  // Duration in seconds
  file_size?: number;  // File size in bytes
  is_published: boolean;  // Publish status
}

export interface Book {
  id: string;
  title: string;
  genre_ids: string[];  // Multiple genres
  information: string;
  author_ids: string[];  // Multiple authors
  artist_ids: string[];  // Multiple narrators
  publisher_id?: string;
  language_id?: string;
  thumbnail?: string;
  total_duration?: number;  // Auto-calculated sum of chapter durations
  is_published: boolean;  // Publish status
  chapters: Chapter[];
  created_at: string;
  updated_at: string;
}

// Extended Book with resolved references
export interface BookWithDetails extends Book {
  authors?: Author[];  // Multiple authors
  genre?: Genre;
  publisher?: Publication;
}

// Audio Player Types (used by TrackPlayer)
export interface AudioBook {
  id: string;
  title: string;
  author: string;
  narrator?: string;
  thumbnail: string;
  chapters: AudioChapter[];
  duration: number;
  description: string;
}

export interface AudioChapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  audioUrl: string;
  duration: number;  // Duration in seconds (from backend)
  isPublished: boolean;  // Publish status for "coming soon" indicator
}

export interface DownloadedChapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  localAudioUrl: string;  // Local file path to m3u8
  duration: number;
  isPublished: boolean;
}

export interface DownloadedBook extends Omit<AudioBook, 'chapters'> {
  chapters: DownloadedChapter[];
  localPath: string;  // Base directory for this book's downloads
  downloadedAt: number;
  totalSize: number;  // Total size in bytes
}

export interface DownloadProgress {
  bookId: string;
  progress: number;  // 0-100
  currentChapter: number;
  totalChapters: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  MainTabs: undefined;
  Player: { book: AudioBook; chapterIndex?: number };
};

export type MainTabParamList = {
  Home: undefined;
  Library: undefined;
  Downloads: undefined;
};
