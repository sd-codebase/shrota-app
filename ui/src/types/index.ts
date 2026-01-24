export interface Language {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface LanguageCreate {
  name: string;
  code: string;
}

export interface Genre {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  created_at: string;
  updated_at: string;
}

export interface GenreCreate {
  name: string;
  description?: string;
  thumbnail?: string;
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  social_media?: SocialMedia;
  photo?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthorCreate {
  name: string;
  bio?: string;
  social_media?: SocialMedia;
  photo?: string;
}

export interface Publication {
  id: string;
  name: string;
  description?: string;
  photo?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicationCreate {
  name: string;
  description?: string;
  photo?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  social_media?: SocialMedia;
  photo?: string;
  created_at: string;
  updated_at: string;
}

export interface ArtistCreate {
  name: string;
  bio?: string;
  social_media?: SocialMedia;
  photo?: string;
}

export interface SocialMedia {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  x?: string;
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
  image?: string;
}

export interface ChapterCreate {
  title: string;
  description?: string;
  order: number;
  file_id?: string;
  image?: string;
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
  is_adult: boolean;  // Adult content flag
  chapters: Chapter[];
  created_at: string;
  updated_at: string;
}

export interface BookCreate {
  title: string;
  genre_ids: string[];  // Multiple genres
  information: string;
  author_ids: string[];  // Multiple authors
  artist_ids?: string[];  // Multiple narrators
  publisher_id?: string;
  language_id?: string;
  thumbnail?: string;
  is_adult?: boolean;  // Adult content flag
}

export interface ThumbnailUploadResponse {
  filename: string;
  book_name: string;
  content_type: string;
}

export interface ChapterImageUploadResponse {
  filename: string;
  book_name: string;
  chapter_order: number;
  content_type: string;
}

export interface GenreThumbnailUploadResponse {
  filename: string;
  genre_name: string;
  content_type: string;
}

export interface AuthorPhotoUploadResponse {
  filename: string;
  author_name: string;
  content_type: string;
}

export interface ArtistPhotoUploadResponse {
  filename: string;
  artist_name: string;
  content_type: string;
}

export interface PublicationPhotoUploadResponse {
  filename: string;
  publication_name: string;
  content_type: string;
}

export interface FileUploadResponse {
  file_id: string;
  filename: string;
  stored_filename: string;
  content_type: string;
}

// Auth types
export interface Admin {
  id: string;
  email: string;
  username: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  admin: Admin;
}
