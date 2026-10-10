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
  is_adult: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenreCreate {
  name: string;
  description?: string;
  thumbnail?: string;
  is_adult?: boolean;
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
  is_published?: boolean;
}

// "free" - anyone can listen.
// "subscriber_only" - shown to everyone, but listening requires a subscription.
// "prime_only" - shown to everyone, but listening requires buying this book
//   at `prime_price` (pay-per-title, like Amazon Prime's Digital Rentals).
// Enforcement is mobile-app work, tracked separately — see mobile/TODO_BOOK_ACCESS.md.
export type BookAccessType = 'free' | 'subscriber_only' | 'prime_only';

export interface Book {
  id: string;
  title: string;
  slug: string;
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
  access_type: BookAccessType;
  prime_price?: number;  // ₹, set when access_type is prime_only
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
  access_type?: BookAccessType;
  prime_price?: number;  // ₹, required when access_type is prime_only
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
export type AdminRole = 'admin' | 'publisher';

export interface Admin {
  id: string;
  email: string;
  username: string;
  name: string;
  is_active: boolean;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

export interface AdminCreate {
  email: string;
  username: string;
  password: string;
  name: string;
  role: AdminRole;
}

export interface AdminTeamUpdate {
  name?: string;
  role?: AdminRole;
  is_active?: boolean;
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

// Content Promotion types
export interface BookSummary {
  id: string;
  title: string;
}

export interface LanguageSummary {
  id: string;
  name: string;
  code: string;
}

export interface GenreSummary {
  id: string;
  name: string;
}

export interface NewRelease {
  id: string;
  book_id: string;
  language_id: string;
  book: BookSummary;
  language: LanguageSummary;
  display_order: number;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NewReleaseCreate {
  book_id: string;
  language_id: string;
  display_order?: number;
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
}

export interface FeaturedBook {
  id: string;
  book_id: string;
  language_id: string;
  book: BookSummary;
  language: LanguageSummary;
  display_order: number;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FeaturedBookCreate {
  book_id: string;
  language_id: string;
  display_order?: number;
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
}

export interface PromotedBook {
  id: string;
  book_id: string;
  genre_id: string;
  book: BookSummary;
  genre: GenreSummary;
  display_order: number;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PromotedBookCreate {
  book_id: string;
  genre_id: string;
  display_order?: number;
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
}

export interface ReorderItem {
  id: string;
  display_order: number;
}

// User types (mobile app users)
export interface User {
  id: string;
  name: string;
  email?: string;
  whatsapp_number?: string;
  birth_date: string;
  is_email_verified: boolean;
  is_whatsapp_verified: boolean;
  whatsapp_otp_sent: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppOTPResponse {
  otp: string;
  whatsapp_number: string;
  wa_me_link: string;
  message: string;
}

export interface UserUpdate {
  name?: string;
  email?: string;
  whatsapp_number?: string;
  birth_date?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  body: string;
  image_url?: string;
  topic: string;
  fcm_message_id?: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSend {
  title: string;
  body: string;
  image_url?: string;
  book_id?: string;
}

export interface NotificationSendResponse {
  success: boolean;
  notification: Notification;
  message: string;
}

// Event types
export interface Event {
  id: string;
  title: string;
  text: string;
  cover_image?: string;
  show_on_home: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  title: string;
  text: string;
  cover_image?: string;
  show_on_home: boolean;
  is_active: boolean;
}

export interface EventCoverUploadResponse {
  filename: string;
  event_title: string;
  content_type: string;
}

// News types
export interface News {
  id: string;
  title: string;
  slug: string;
  text: string;
  cover_image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsCreate {
  title: string;
  text: string;
  cover_image?: string;
  is_active: boolean;
}

export interface NewsCoverUploadResponse {
  filename: string;
  news_title: string;
  content_type: string;
}

// App-open ad (image only, shown ~2s on app launch)
export interface AppOpenAd {
  id: string;
  file: string;
  is_active: boolean;
  link?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppOpenAdCreate {
  file: string;
  is_active: boolean;
  link?: string;
}

export interface AppOpenAdUploadResponse {
  filename: string;
  content_type: string;
}

// Activity logs (app usage sessions and their events)
export interface ActivitySession {
  id: string;
  install_id: string;
  user_id?: string;
  user_name?: string;
  user_whatsapp?: string;
  started_at: string;
  ended_at?: string;
  platform?: string;
  os_version?: string;
  device_model?: string;
  app_version?: string;
  event_count: number;
  created_at: string;
  updated_at: string;
}

export interface ActivitySessionListResponse {
  sessions: ActivitySession[];
  total: number;
  limit: number;
  offset: number;
}

export interface ActivityEvent {
  id: string;
  session_id: string;
  user_id?: string;
  event_name: string;
  params?: Record<string, unknown>;
  occurred_at: string;
  received_at: string;
}

export interface ActivityFilterOptions {
  platforms: string[];
  app_versions: string[];
  event_names: string[];
}

export interface ActivitySessionFilters {
  limit?: number;
  offset?: number;
  identified?: boolean;
  platform?: string;
  app_version?: string;
  event_name?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Book insights (listening analytics derived from progress + activity events)
export interface InsightsSummary {
  books_total: number;
  books_published: number;
  listeners_total: number;
  likes_total: number;
  listened_hours: number;
  books_completed: number;
  unique_devices: number;
}

export interface BookInsight {
  book_id: string;
  title: string;
  thumbnail?: string;
  is_published: boolean;
  access_type: string;
  language?: string;
  authors: string[];
  genres: string[];
  chapters_total: number;
  total_duration?: number;
  listeners: number;
  completed_listeners: number;
  completion_rate: number;
  avg_progress_percentage: number;
  avg_chapter_reached: number;
  listened_seconds: number;
  last_played_at?: string;
  dropoff_chapter_index?: number;
  dropoff_listeners: number;
  likes: number;
  unique_viewers: number;
  unique_players: number;
  view_to_play_rate: number;
}

export interface ChapterInsight {
  chapter_id: string;
  order: number;
  title: string;
  duration?: number;
  listeners_reached: number;
  completions: number;
}

export interface BookListenerRow {
  user_id: string;
  name: string;
  whatsapp_number?: string;
  current_chapter_index: number;
  progress_percentage: number;
  total_listened_seconds: number;
  is_completed: boolean;
  last_played_at: string;
}

export interface BookInsightDetail extends BookInsight {
  chapters: ChapterInsight[];
  recent_listeners: BookListenerRow[];
  view_sources: Record<string, number>;
}

export interface BookInsightListResponse {
  books: BookInsight[];
  total: number;
  limit: number;
  offset: number;
}

export interface BookInsightFilters {
  search?: string;
  language_ids?: string;
  genre_ids?: string;
  author_ids?: string;
  is_published?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Royalty reporting (listening ledger)
export interface RoyaltyBookLine {
  book_id?: string;
  book_title: string;
  author_names: string[];
  publisher_name?: string;
  seconds_listened: number;
  hours_listened: number;
  unique_listeners: number;
  unique_devices: number;
  share_percentage: number;
}

export interface RoyaltyAuthorLine {
  author_id?: string;
  author_name: string;
  books: number;
  seconds_listened: number;
  hours_listened: number;
  unique_listeners: number;
  share_percentage: number;
}

export interface RoyaltyReport {
  date_from: string;
  date_to: string;
  include_guests: boolean;
  timezone: string;
  total_seconds: number;
  total_hours: number;
  total_listeners: number;
  total_devices: number;
  books: RoyaltyBookLine[];
  authors: RoyaltyAuthorLine[];
}

export interface RoyaltySnapshotCreate {
  label: string;
  period_start: string;
  period_end: string;
  include_guests: boolean;
  notes?: string;
}

export interface RoyaltySnapshotLine {
  book_id?: string;
  book_title: string;
  author_names: string;
  publisher_name?: string;
  seconds_listened: number;
  hours_listened: number;
  unique_listeners: number;
  unique_devices: number;
  share_percentage: number;
}

export interface RoyaltySnapshot {
  id: string;
  label: string;
  period_start: string;
  period_end: string;
  include_guests: boolean;
  total_seconds: number;
  total_hours: number;
  notes?: string;
  generated_at: string;
  generated_by_name?: string;
  line_count: number;
}

export interface RoyaltySnapshotDetail extends RoyaltySnapshot {
  lines: RoyaltySnapshotLine[];
}

export interface LedgerRebuildResult {
  date_from: string;
  date_to: string;
  events_read: number;
  entries_written: number;
  seconds_credited: number;
}
