import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAPTER_PROGRESS_KEY_PREFIX = '@shrota_chapter_progress_';
const AUTH_USER_KEY = '@shrota_auth_user';

export interface ChapterProgress {
  bookId: string;
  chapterIndex: number;
  position: number;
  duration: number;
  updatedAt: number;
}

interface ChapterProgressStore {
  [key: string]: ChapterProgress; // key format: "bookId:chapterIndex"
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
 * Get the storage key for the current user
 */
async function getStorageKey(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null; // No user logged in, don't save progress
  }
  return `${CHAPTER_PROGRESS_KEY_PREFIX}${userId}`;
}

function getChapterKey(bookId: string, chapterIndex: number): string {
  return `${bookId}:${chapterIndex}`;
}

/**
 * Get all chapter progress data from local storage for the current user
 */
async function getAllProgress(): Promise<ChapterProgressStore> {
  try {
    const storageKey = await getStorageKey();
    if (!storageKey) return {};

    const data = await AsyncStorage.getItem(storageKey);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.log('Failed to get chapter progress:', error);
    return {};
  }
}

/**
 * Save all chapter progress data to local storage for the current user
 */
async function saveAllProgress(store: ChapterProgressStore): Promise<void> {
  try {
    const storageKey = await getStorageKey();
    if (!storageKey) return; // No user logged in

    await AsyncStorage.setItem(storageKey, JSON.stringify(store));
  } catch (error) {
    console.log('Failed to save chapter progress:', error);
  }
}

/**
 * Save progress for a specific chapter (only for logged-in users)
 */
export async function saveChapterProgress(
  bookId: string,
  chapterIndex: number,
  position: number,
  duration: number
): Promise<void> {
  const storageKey = await getStorageKey();
  if (!storageKey) return; // No user logged in, don't save

  const store = await getAllProgress();
  const key = getChapterKey(bookId, chapterIndex);

  store[key] = {
    bookId,
    chapterIndex,
    position,
    duration,
    updatedAt: Date.now(),
  };

  await saveAllProgress(store);
}

/**
 * Get progress for a specific chapter
 */
export async function getChapterProgress(
  bookId: string,
  chapterIndex: number
): Promise<ChapterProgress | null> {
  const store = await getAllProgress();
  const key = getChapterKey(bookId, chapterIndex);
  return store[key] || null;
}

/**
 * Get all chapter progress for a book
 */
export async function getBookChapterProgress(
  bookId: string
): Promise<ChapterProgress[]> {
  const store = await getAllProgress();
  const bookProgress: ChapterProgress[] = [];

  for (const key in store) {
    if (store[key].bookId === bookId) {
      bookProgress.push(store[key]);
    }
  }

  return bookProgress.sort((a, b) => a.chapterIndex - b.chapterIndex);
}

/**
 * Delete progress for a specific chapter
 */
export async function deleteChapterProgress(
  bookId: string,
  chapterIndex: number
): Promise<void> {
  const store = await getAllProgress();
  const key = getChapterKey(bookId, chapterIndex);
  delete store[key];
  await saveAllProgress(store);
}

/**
 * Delete all progress for a book
 */
export async function deleteBookProgress(bookId: string): Promise<void> {
  const store = await getAllProgress();

  for (const key in store) {
    if (store[key].bookId === bookId) {
      delete store[key];
    }
  }

  await saveAllProgress(store);
}

/**
 * Clear all chapter progress for the current user
 */
export async function clearAllChapterProgress(): Promise<void> {
  try {
    const storageKey = await getStorageKey();
    if (storageKey) {
      await AsyncStorage.removeItem(storageKey);
    }
  } catch (error) {
    console.log('Failed to clear chapter progress:', error);
  }
}

/**
 * Clear chapter progress for a specific user (useful for logout)
 */
export async function clearUserChapterProgress(userId: string): Promise<void> {
  try {
    const storageKey = `${CHAPTER_PROGRESS_KEY_PREFIX}${userId}`;
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.log('Failed to clear user chapter progress:', error);
  }
}
