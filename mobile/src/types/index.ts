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

// Search API Types
export interface SearchBookResult {
  id: string;
  title: string;
  genre_ids: string[];
  information: string;
  author_ids: string[];
  author_names: string[];
  artist_ids: string[];
  artist_names: string[];
  publisher_id?: string;
  publisher_name?: string;
  language_id?: string;
  thumbnail?: string;
  total_duration?: number;
  is_published: boolean;
  is_adult: boolean;
  is_deleted: boolean;
  chapters: Chapter[];
  created_at: string;
  updated_at: string;
}

export interface SearchWriterResult {
  id: string;
  name: string;
  bio?: string;
  photo?: string;
  book_count: number;
}

export interface SearchNarratorResult {
  id: string;
  name: string;
  bio?: string;
  photo?: string;
  book_count: number;
}

export interface SearchPublicationResult {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  book_count: number;
}

export interface SearchResult {
  query: string;
  books: {
    count: number;
    results: SearchBookResult[];
  };
  writers: {
    count: number;
    results: SearchWriterResult[];
  };
  narrators: {
    count: number;
    results: SearchNarratorResult[];
  };
  publications: {
    count: number;
    results: SearchPublicationResult[];
  };
}

// User Authentication Types
export interface User {
  id: string;
  name: string;
  email?: string;
  whatsapp_number?: string;
  birth_date?: string;
  is_email_verified: boolean;
  is_whatsapp_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterPayload {
  name: string;
  email?: string;
  whatsapp_number?: string;
  birth_date?: string;
}

export interface SendOTPPayload {
  identifier: string;
  otp_type: 'email' | 'whatsapp';
}

export interface VerifyOTPPayload {
  identifier: string;
  otp: string;
  otp_type: 'email' | 'whatsapp';
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface SendOTPResponse {
  message: string;
  expires_in: number;
}

// User Activity Types
export interface BookProgress {
  id: string;
  book_id: string;
  current_chapter_index: number;
  current_position: number;
  total_listened_seconds: number;
  progress_percentage: number;
  is_completed: boolean;
  last_played_at: string;
  created_at: string;
  updated_at: string;
  book_title?: string;
  book_thumbnail?: string;
  book_author_names?: string[];
  book_duration?: number;
}

export interface LikedBook {
  id: string;
  book_id: string;
  liked_at: string;
  book_title?: string;
  book_thumbnail?: string;
  book_author_names?: string[];
  book_duration?: number;
}

export interface LikeStatus {
  is_liked: boolean;
  liked_at?: string;
}

export interface ProgressUpdatePayload {
  book_id: string;
  current_chapter_index: number;
  current_position: number;
  total_listened_seconds?: number;
  progress_percentage?: number;
  is_completed?: boolean;
}

// Theme Types
export type ThemeMode = 'light' | 'dark';

// Navigation Types
export type RootStackParamList = {
  // Auth screens
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  OTPVerification: { identifier: string; otp_type: 'email' | 'whatsapp' };
  // Main app (tab navigator)
  MainTabs: undefined;
  // Modal screens
  Player: { book: AudioBook; chapterIndex?: number };
};

export type MainTabParamList = {
  Home: undefined;
  Bookshelf: undefined;
  Search: undefined;
  Profile: undefined;
};

// Nested stack param lists (each tab has its own stack)
export type HomeStackParamList = {
  HomeMain: undefined;
  BookDetails: { book: AudioBook };
};

export type BookshelfStackParamList = {
  BookshelfMain: undefined;
  BookDetails: { book: AudioBook };
};

export type SearchStackParamList = {
  SearchMain: undefined;
  BookDetails: { book: AudioBook };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
};
