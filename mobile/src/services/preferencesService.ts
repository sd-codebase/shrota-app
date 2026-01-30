import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

const PREFERENCES_CACHE_KEY = '@shrota_preferences_cache';

export interface UserPreferences {
  genreIds: string[];
  languageIds: string[];
  updatedAt: number;
}

interface BackendPreferencesResponse {
  language_ids: string[];
  genre_ids: string[];
  updated_at: string;
}

/**
 * Get user preferences from backend, with local cache fallback.
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  try {
    // Try to fetch from backend
    const response = await apiClient.get<BackendPreferencesResponse>('/v1/preferences');

    const preferences: UserPreferences = {
      genreIds: response.genre_ids,
      languageIds: response.language_ids,
      updatedAt: new Date(response.updated_at).getTime(),
    };

    // Cache locally for offline access
    await AsyncStorage.setItem(PREFERENCES_CACHE_KEY, JSON.stringify(preferences));

    return preferences;
  } catch (error) {
    // If API fails (e.g., offline), try to use cached preferences
    try {
      const cached = await AsyncStorage.getItem(PREFERENCES_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore cache read errors
    }

    console.log('Failed to get preferences:', error);
    return null;
  }
}

/**
 * Save user preferences to backend.
 */
export async function saveUserPreferences(
  genreIds: string[],
  languageIds: string[]
): Promise<void> {
  try {
    // Save to backend
    const response = await apiClient.put<BackendPreferencesResponse>('/v1/preferences', {
      language_ids: languageIds,
      genre_ids: genreIds,
    });

    // Update local cache
    const preferences: UserPreferences = {
      genreIds: response.genre_ids,
      languageIds: response.language_ids,
      updatedAt: new Date(response.updated_at).getTime(),
    };
    await AsyncStorage.setItem(PREFERENCES_CACHE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.log('Failed to save preferences:', error);
    throw error;
  }
}

/**
 * Check if user has set their preferences.
 */
export async function hasUserPreferences(): Promise<boolean> {
  const preferences = await getUserPreferences();
  return preferences !== null &&
         preferences.genreIds.length > 0 &&
         preferences.languageIds.length > 0;
}

/**
 * Clear local preferences cache (useful for logout).
 * Note: This only clears the local cache, not the backend data.
 */
export async function clearUserPreferences(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFERENCES_CACHE_KEY);
  } catch (error) {
    console.log('Failed to clear preferences cache:', error);
  }
}
