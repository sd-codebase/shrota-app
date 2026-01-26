import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY_PREFIX = '@shrota_preferences_';
const AUTH_USER_KEY = '@shrota_auth_user';

export interface UserPreferences {
  genreIds: string[]; // Multiple genres (configurable limit)
  languageIds: string[]; // Multiple languages (configurable limit)
  // Legacy support
  languageId?: string;
  updatedAt: number;
}

/**
 * Get the current user ID from AsyncStorage
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (userJson) {
      const user = JSON.parse(userJson);
      return user.id || null;
    }
    return null;
  } catch (error) {
    console.log('Failed to get current user:', error);
    return null;
  }
}

/**
 * Get the storage key for the current user's preferences
 */
async function getStorageKey(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }
  return `${PREFERENCES_KEY_PREFIX}${userId}`;
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(
  genreIds: string[],
  languageIds: string[]
): Promise<void> {
  try {
    const storageKey = await getStorageKey();
    if (!storageKey) {
      console.log('No user logged in, cannot save preferences');
      return;
    }

    const preferences: UserPreferences = {
      genreIds,
      languageIds,
      updatedAt: Date.now(),
    };

    await AsyncStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch (error) {
    console.log('Failed to save preferences:', error);
    throw error;
  }
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences | null> {
  try {
    const storageKey = await getStorageKey();
    if (!storageKey) {
      return null;
    }

    const data = await AsyncStorage.getItem(storageKey);
    if (data) {
      const preferences = JSON.parse(data);
      // Migrate from old format (languageId) to new format (languageIds)
      if (!preferences.languageIds && preferences.languageId) {
        preferences.languageIds = [preferences.languageId];
      }
      // Ensure languageIds is always an array
      if (!preferences.languageIds) {
        preferences.languageIds = [];
      }
      return preferences;
    }
    return null;
  } catch (error) {
    console.log('Failed to get preferences:', error);
    return null;
  }
}

/**
 * Check if user has set their preferences
 */
export async function hasUserPreferences(): Promise<boolean> {
  const preferences = await getUserPreferences();
  return preferences !== null &&
         preferences.genreIds.length > 0 &&
         preferences.languageIds.length > 0;
}

/**
 * Clear user preferences (useful for logout)
 */
export async function clearUserPreferences(): Promise<void> {
  try {
    const storageKey = await getStorageKey();
    if (storageKey) {
      await AsyncStorage.removeItem(storageKey);
    }
  } catch (error) {
    console.log('Failed to clear preferences:', error);
  }
}
