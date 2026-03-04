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
  is_adult?: boolean;
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
  thumbnail?: string;
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
  genreNames?: string[];
  languageName?: string;
  // IDs for navigation to entity detail screens
  genre_ids?: string[];
  author_ids?: string[];
  artist_ids?: string[];
  publisher_id?: string;
  publisher_name?: string;
  language_id?: string;
}

export interface AudioChapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  audioUrl: string;
  duration: number;
  isPublished: boolean;
  thumbnail?: string;
}

export interface DownloadedChapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  localAudioUrl: string;
  duration: number;
  isPublished: boolean;
  thumbnail?: string;
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

// User Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  birth_date: string;
  is_email_verified: boolean;
  is_active: boolean;
  whatsapp_number?: string;
  country_code: string;
  is_whatsapp_verified: boolean;
  whatsapp_otp_sent: boolean;
  address?: string;
  village_landmark?: string;
  tahsil_city?: string;
  district?: string;
  state?: string;
  pin_code?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfilePayload {
  name?: string;
  whatsapp_number?: string;
  address?: string;
  village_landmark?: string;
  tahsil_city?: string;
  district?: string;
  state?: string;
  pin_code?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  birth_date: string;
  whatsapp_number: string;
  country_code: string;
}

export interface WhatsAppStatusResponse {
  whatsapp_number: string;
  is_whatsapp_verified: boolean;
  otp_sent: boolean;
}

export interface VerifyWhatsAppOTPPayload {
  otp: string;
}

export interface SendOTPPayload {
  identifier: string;
  otp_type: 'email' | 'whatsapp';
  country_code?: string;
}

export interface VerifyOTPPayload {
  identifier: string;
  otp: string;
  otp_type: 'email' | 'whatsapp';
  country_code?: string;
}

export interface SendChangeWhatsAppOTPPayload {
  whatsapp_number: string;
  country_code: string;
}

export interface VerifyChangeWhatsAppPayload {
  whatsapp_number: string;
  country_code: string;
  otp: string;
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
  user_exists: boolean;
}

export interface RegisterVerifiedPayload {
  name: string;
  email: string;
  birth_date: string;
  whatsapp_number: string;
  country_code: string;
}

export interface VerifyOTPOnlyPayload {
  identifier: string;
  otp: string;
  otp_type: 'email' | 'whatsapp';
  country_code?: string;
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
  Register: { whatsapp_number: string; country_code: string };
  OTPVerification: { identifier: string; otp_type: 'email' | 'whatsapp'; user_exists: boolean; country_code?: string };
  // Main app (tab navigator)
  MainTabs: undefined;
  // Modal screens
  Player: { book: AudioBook; chapterIndex?: number };
  // Deep link handler
  DeepLinkHandler: { bookId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Bookshelf: undefined;
  Search: undefined;
  Profile: undefined;
};

// Section types for home screen carousels
export type SectionType = 'new-releases' | 'featured' | 'continue-listening' | 'genre' | 'because-you-listened';

// Nested stack param lists (each tab has its own stack)
export type HomeStackParamList = {
  HomeMain: undefined;
  BookDetails: { book: AudioBook };
  SectionList: {
    sectionType: SectionType;
    title: string;
    languageId?: string;
    genreId?: string;
    sourceBookId?: string;
  };
  Explore: {
    authorId?: string;
    artistId?: string;
    publisherId?: string;
    genreId?: string;
    title?: string;
  } | undefined;
  AuthorDetails: { authorId: string; authorName: string };
  ArtistDetails: { artistId: string; artistName: string };
  PublicationDetails: { publicationId: string; publicationName: string };
  GenreDetails: { genreId: string; genreName: string };
};

export type BookshelfStackParamList = {
  BookshelfMain: undefined;
  BookDetails: { book: AudioBook };
  Explore: {
    authorId?: string;
    artistId?: string;
    publisherId?: string;
    genreId?: string;
    title?: string;
  } | undefined;
  AuthorDetails: { authorId: string; authorName: string };
  ArtistDetails: { artistId: string; artistName: string };
  PublicationDetails: { publicationId: string; publicationName: string };
  GenreDetails: { genreId: string; genreName: string };
};

export type ExploreStackParamList = {
  ExploreMain: {
    authorId?: string;
    artistId?: string;
    publisherId?: string;
    genreId?: string;
    title?: string;
  } | undefined;
  BookDetails: { book: AudioBook };
  AuthorDetails: { authorId: string; authorName: string };
  ArtistDetails: { artistId: string; artistName: string };
  PublicationDetails: { publicationId: string; publicationName: string };
  GenreDetails: { genreId: string; genreName: string };
};

export type ProfileStackParamList = {
  ProfileMain: { action?: 'verify-whatsapp' | 'change-whatsapp' } | undefined;
};

// Entity detail response types
export interface AuthorDetailResponse {
  id: string;
  name: string;
  bio?: string;
  photo?: string;
  social_media?: SocialMedia;
}

export interface ArtistDetailResponse {
  id: string;
  name: string;
  bio?: string;
  photo?: string;
  social_media?: SocialMedia;
}

export interface PublicationDetailResponse {
  id: string;
  name: string;
  description?: string;
  photo?: string;
}

export interface GenreDetailResponse {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
}

// Explore feature types
export interface ExploreFilters {
  search?: string;
  genreIds?: string[];
  languageIds?: string[];
  authorIds?: string[];
  artistIds?: string[];
  publisherIds?: string[];
}
