import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import {
  BookProgress,
  LikedBook,
  LikeStatus,
  ProgressUpdatePayload,
} from '../types';

const AUTH_TOKEN_KEY = '@shrota_auth_token';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    throw new Error('Not authenticated');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ==================== Progress API ====================

export async function updateProgress(payload: ProgressUpdatePayload): Promise<BookProgress> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/v1/user/progress`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to update progress');
  }

  return response.json();
}

export async function getContinueListening(): Promise<BookProgress[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/v1/user/progress`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch progress');
  }

  return response.json();
}

export async function getCompletedBooks(): Promise<BookProgress[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/v1/user/progress/completed`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch completed books');
  }

  return response.json();
}

export async function getBookProgress(bookId: string): Promise<BookProgress | null> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/v1/user/progress/${bookId}`, {
    headers,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch book progress');
  }

  return response.json();
}

export async function deleteBookProgress(bookId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/v1/user/progress/${bookId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete progress');
  }
}

// ==================== Like API ====================

export async function likeBook(bookId: string): Promise<LikedBook> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/v1/user/books/${bookId}/like`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to like book');
  }

  return response.json();
}

export async function unlikeBook(bookId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/v1/user/books/${bookId}/like`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to unlike book');
  }
}

export async function getLikeStatus(bookId: string): Promise<LikeStatus> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/v1/user/books/${bookId}/like`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch like status');
  }

  return response.json();
}

export async function getLikedBooks(): Promise<LikedBook[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_URL}/v1/user/liked-books`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch liked books');
  }

  return response.json();
}
