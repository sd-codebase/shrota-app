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
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
export const getBooks = (search?: string) => {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<Book[]>(`/books${params}`);
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

    xhr.open('POST', `${API_URL}/files/upload/chapter`);
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
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Publication photo upload failed' }));
    throw new Error(error.detail || 'Publication photo upload failed');
  }

  return response.json();
};

export const getPublicationPhotoUrl = (filename: string) => `${API_URL}/files/publication-photo/${filename}`;
