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
  duration?: number;
  file_size?: number;
  is_published: boolean;
}

export interface Book {
  id: string;
  title: string;
  genre_ids: string[];
  information: string;
  author_ids: string[];
  artist_ids: string[];
  publisher_id?: string;
  language_id?: string;
  thumbnail?: string;
  total_duration?: number;
  is_published: boolean;
  chapters: Chapter[];
  created_at: string;
  updated_at: string;
}

export interface BookWithDetails extends Book {
  authors?: Author[];
  genre?: Genre;
  publisher?: Publication;
}

// Audio Player Types
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
  duration: number;
  isPublished: boolean;
}

export interface DownloadedChapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  localAudioUrl: string;
  duration: number;
  isPublished: boolean;
}

export interface DownloadedBook extends Omit<AudioBook, 'chapters'> {
  chapters: DownloadedChapter[];
  localPath: string;
  downloadedAt: number;
  totalSize: number;
}

export interface DownloadProgress {
  bookId: string;
  progress: number;
  currentChapter: number;
  totalChapters: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

// Navigation Types
export type RootStackParamList = {
  Books: undefined;
  BookDetails: { book: AudioBook };
  Downloads: undefined;
  Player: { book: AudioBook; chapterIndex?: number };
};
