import type {
  Language,
  LanguageCreate,
  Genre,
  GenreCreate,
  Author,
  AuthorCreate,
  Artist,
  ArtistCreate,
  Publication,
  PublicationCreate,
  Book,
  BookCreate,
  ChapterCreate,
  Chapter,
  FileUploadResponse,
  ThumbnailUploadResponse,
  ChapterImageUploadResponse,
  GenreThumbnailUploadResponse,
  AuthorPhotoUploadResponse,
  ArtistPhotoUploadResponse,
  PublicationPhotoUploadResponse,
  LoginRequest,
  LoginResponse,
  Admin,
  NewRelease,
  NewReleaseCreate,
  FeaturedBook,
  FeaturedBookCreate,
  PromotedBook,
  PromotedBookCreate,
  ReorderItem,
  User,
  UserUpdate,
  UserListResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'shrota_admin_token';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Languages
export const getLanguages = () => request<Language[]>('/languages');

export const createLanguage = (data: LanguageCreate) =>
  request<Language>('/languages', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const bulkCreateLanguages = (languages: LanguageCreate[]) =>
  request<Language[]>('/languages/bulk', {
    method: 'POST',
    body: JSON.stringify({ languages }),
  });

export const updateLanguage = (id: string, data: Partial<LanguageCreate>) =>
  request<Language>(`/languages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteLanguage = (id: string) =>
  request<void>(`/languages/${id}`, { method: 'DELETE' });

// Genres
export const getGenres = () => request<Genre[]>('/genres');

export const createGenre = (data: GenreCreate) =>
  request<Genre>('/genres', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const bulkCreateGenres = (genres: GenreCreate[]) =>
  request<Genre[]>('/genres/bulk', {
    method: 'POST',
    body: JSON.stringify({ genres }),
  });

export const updateGenre = (id: string, data: Partial<GenreCreate>) =>
  request<Genre>(`/genres/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteGenre = (id: string) =>
  request<void>(`/genres/${id}`, { method: 'DELETE' });

// Authors
export const getAuthors = () => request<Author[]>('/authors');

export const createAuthor = (data: AuthorCreate) =>
  request<Author>('/authors', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const bulkCreateAuthors = (authors: AuthorCreate[]) =>
  request<Author[]>('/authors/bulk', {
    method: 'POST',
    body: JSON.stringify({ authors }),
  });

export const updateAuthor = (id: string, data: Partial<AuthorCreate>) =>
  request<Author>(`/authors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteAuthor = (id: string) =>
  request<void>(`/authors/${id}`, { method: 'DELETE' });

// Artists
export const getArtists = () => request<Artist[]>('/artists');

export const createArtist = (data: ArtistCreate) =>
  request<Artist>('/artists', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const bulkCreateArtists = (artists: ArtistCreate[]) =>
  request<Artist[]>('/artists/bulk', {
    method: 'POST',
    body: JSON.stringify({ artists }),
  });

export const updateArtist = (id: string, data: Partial<ArtistCreate>) =>
  request<Artist>(`/artists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteArtist = (id: string) =>
  request<void>(`/artists/${id}`, { method: 'DELETE' });

// Publications
export const getPublications = () => request<Publication[]>('/publications');

export const createPublication = (data: PublicationCreate) =>
  request<Publication>('/publications', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const bulkCreatePublications = (publications: PublicationCreate[]) =>
  request<Publication[]>('/publications/bulk', {
    method: 'POST',
    body: JSON.stringify({ publications }),
  });

export const updatePublication = (id: string, data: Partial<PublicationCreate>) =>
  request<Publication>(`/publications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deletePublication = (id: string) =>
  request<void>(`/publications/${id}`, { method: 'DELETE' });

// Books
export interface BookFilters {
  search?: string;
  language_ids?: string[];
  genre_ids?: string[];
  author_ids?: string[];
  artist_ids?: string[];
  publisher_ids?: string[];
  is_adult?: boolean | null;
}

export const getBooks = (filters?: BookFilters) => {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.append('search', filters.search);
  }
  if (filters?.language_ids?.length) {
    params.append('language_ids', filters.language_ids.join(','));
  }
  if (filters?.genre_ids?.length) {
    params.append('genre_ids', filters.genre_ids.join(','));
  }
  if (filters?.author_ids?.length) {
    params.append('author_ids', filters.author_ids.join(','));
  }
  if (filters?.artist_ids?.length) {
    params.append('artist_ids', filters.artist_ids.join(','));
  }
  if (filters?.publisher_ids?.length) {
    params.append('publisher_ids', filters.publisher_ids.join(','));
  }
  if (filters?.is_adult !== undefined && filters?.is_adult !== null) {
    params.append('is_adult', filters.is_adult.toString());
  }

  const queryString = params.toString();
  return request<Book[]>(`/books${queryString ? `?${queryString}` : ''}`);
};

export const createBook = (data: BookCreate) =>
  request<Book>('/books', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateBook = (id: string, data: Partial<BookCreate>) =>
  request<Book>(`/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteBook = (id: string) =>
  request<void>(`/books/${id}`, { method: 'DELETE' });

// Chapters
export const addChapter = (bookId: string, data: ChapterCreate) =>
  request<Chapter>(`/books/${bookId}/chapters`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateChapter = (bookId: string, chapterId: string, data: Partial<ChapterCreate>) =>
  request<Chapter>(`/books/${bookId}/chapters/${chapterId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteChapter = (bookId: string, chapterId: string) =>
  request<void>(`/books/${bookId}/chapters/${chapterId}`, { method: 'DELETE' });

export const processChapter = (bookId: string, chapterId: string) =>
  request<{ message: string; audio_url: string; segments_count: number }>(
    `/books/${bookId}/chapters/${chapterId}/process`,
    { method: 'POST' }
  );

// Files
export const uploadChapterFile = (
  file: File,
  bookName: string,
  chapterOrder: number,
  onProgress?: (percent: number) => void
): Promise<FileUploadResponse> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('book_name', bookName);
    formData.append('chapter_order', chapterOrder.toString());

    const xhr = new XMLHttpRequest();
    xhr.timeout = 600000; // 10 minutes for large files

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.detail || 'File upload failed'));
        } catch {
          reject(new Error('File upload failed'));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('File upload failed'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timed out. Please check your connection and try again.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled.'));
    });

    xhr.open('POST', `${API_URL}/files/upload/chapter`);
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
};

export const getChapterFileUrl = (fileId: string) => `${API_URL}/files/chapter/${fileId}`;

// Thumbnails
export const uploadThumbnail = async (file: File, bookName: string): Promise<ThumbnailUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('book_name', bookName);

  const response = await fetch(`${API_URL}/files/upload/thumbnail`, {
    method: 'POST',
    body: formData,
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Thumbnail upload failed' }));
    throw new Error(error.detail || 'Thumbnail upload failed');
  }

  return response.json();
};

export const getThumbnailUrl = (filename: string) => `${API_URL}/files/thumbnail/${filename}`;

// Chapter Images
export const uploadChapterImage = async (
  file: File,
  bookName: string,
  chapterOrder: number
): Promise<ChapterImageUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('book_name', bookName);
  formData.append('chapter_order', chapterOrder.toString());

  const response = await fetch(`${API_URL}/files/upload/chapter-image`, {
    method: 'POST',
    body: formData,
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Chapter image upload failed' }));
    throw new Error(error.detail || 'Chapter image upload failed');
  }

  return response.json();
};

export const getChapterImageUrl = (filename: string) => `${API_URL}/files/chapter-image/${filename}`;

// Genre Thumbnails
export const uploadGenreThumbnail = async (file: File, genreName: string): Promise<GenreThumbnailUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('genre_name', genreName);

  const response = await fetch(`${API_URL}/files/upload/genre-thumbnail`, {
    method: 'POST',
    body: formData,
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Genre thumbnail upload failed' }));
    throw new Error(error.detail || 'Genre thumbnail upload failed');
  }

  return response.json();
};

export const getGenreThumbnailUrl = (filename: string) => `${API_URL}/files/genre-thumbnail/${filename}`;

// Author Photos
export const uploadAuthorPhoto = async (file: File, authorName: string): Promise<AuthorPhotoUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('author_name', authorName);

  const response = await fetch(`${API_URL}/files/upload/author-photo`, {
    method: 'POST',
    body: formData,
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Author photo upload failed' }));
    throw new Error(error.detail || 'Author photo upload failed');
  }

  return response.json();
};

export const getAuthorPhotoUrl = (filename: string) => `${API_URL}/files/author-photo/${filename}`;

// Artist Photos
export const uploadArtistPhoto = async (file: File, artistName: string): Promise<ArtistPhotoUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('artist_name', artistName);

  const response = await fetch(`${API_URL}/files/upload/artist-photo`, {
    method: 'POST',
    body: formData,
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Artist photo upload failed' }));
    throw new Error(error.detail || 'Artist photo upload failed');
  }

  return response.json();
};

export const getArtistPhotoUrl = (filename: string) => `${API_URL}/files/artist-photo/${filename}`;

// Publication Photos
export const uploadPublicationPhoto = async (file: File, publicationName: string): Promise<PublicationPhotoUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('publication_name', publicationName);

  const response = await fetch(`${API_URL}/files/upload/publication-photo`, {
    method: 'POST',
    body: formData,
    headers: getAuthHeader(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Publication photo upload failed' }));
    throw new Error(error.detail || 'Publication photo upload failed');
  }

  return response.json();
};

export const getPublicationPhotoUrl = (filename: string) => `${API_URL}/files/publication-photo/${filename}`;

// Auth
export const login = (credentials: LoginRequest) =>
  request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const getCurrentAdmin = (token: string) =>
  request<Admin>('/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

// Content Promotion - New Releases
export const getNewReleases = () => request<NewRelease[]>('/content/new-releases');

export const getNewReleasesByLanguage = (languageId: string) =>
  request<NewRelease[]>(`/content/new-releases/language/${languageId}`);

export const createNewRelease = (data: NewReleaseCreate) =>
  request<NewRelease>('/content/new-releases', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateNewRelease = (id: string, data: Partial<NewReleaseCreate>) =>
  request<NewRelease>(`/content/new-releases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteNewRelease = (id: string) =>
  request<void>(`/content/new-releases/${id}`, { method: 'DELETE' });

export const reorderNewReleases = (items: ReorderItem[]) =>
  request<NewRelease[]>('/content/new-releases/reorder', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });

// Content Promotion - Featured Books
export const getFeaturedBooks = () => request<FeaturedBook[]>('/content/featured');

export const getFeaturedBooksByLanguage = (languageId: string) =>
  request<FeaturedBook[]>(`/content/featured/language/${languageId}`);

export const createFeaturedBook = (data: FeaturedBookCreate) =>
  request<FeaturedBook>('/content/featured', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateFeaturedBook = (id: string, data: Partial<FeaturedBookCreate>) =>
  request<FeaturedBook>(`/content/featured/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteFeaturedBook = (id: string) =>
  request<void>(`/content/featured/${id}`, { method: 'DELETE' });

export const reorderFeaturedBooks = (items: ReorderItem[]) =>
  request<FeaturedBook[]>('/content/featured/reorder', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });

// Content Promotion - Promoted Books
export const getPromotedBooks = () => request<PromotedBook[]>('/content/promoted');

export const getPromotedBooksByGenre = (genreId: string) =>
  request<PromotedBook[]>(`/content/promoted/genre/${genreId}`);

export const createPromotedBook = (data: PromotedBookCreate) =>
  request<PromotedBook>('/content/promoted', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updatePromotedBook = (id: string, data: Partial<PromotedBookCreate>) =>
  request<PromotedBook>(`/content/promoted/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deletePromotedBook = (id: string) =>
  request<void>(`/content/promoted/${id}`, { method: 'DELETE' });

export const reorderPromotedBooks = (items: ReorderItem[]) =>
  request<PromotedBook[]>('/content/promoted/reorder', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });

// Admin User Management
export const getUsers = (page: number = 1, perPage: number = 20, search?: string) => {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  if (search) {
    params.append('search', search);
  }
  return request<UserListResponse>(`/admin/users?${params.toString()}`);
};

export const getUser = (id: string) => request<User>(`/admin/users/${id}`);

export const updateUser = (id: string, data: UserUpdate) =>
  request<User>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const toggleUserStatus = (id: string) =>
  request<User>(`/admin/users/${id}/toggle-status`, {
    method: 'PUT',
  });

export const deleteUser = (id: string) =>
  request<void>(`/admin/users/${id}`, { method: 'DELETE' });
