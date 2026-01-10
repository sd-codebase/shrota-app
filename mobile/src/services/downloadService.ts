import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Environment } from '../config';
import { AudioBook, AudioChapter, DownloadedBook, DownloadedChapter, DownloadProgress } from '../types';

const DOWNLOADS_KEY = 'audiobook_downloads';
const DOWNLOADS_DIR = (FileSystem.documentDirectory || '') + 'audiobooks/';

// Ensure download directory exists
export async function ensureDownloadDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOADS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
  }
}

// Get all downloaded books
export async function getDownloads(): Promise<DownloadedBook[]> {
  try {
    const data = await AsyncStorage.getItem(DOWNLOADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save downloads to storage
export async function saveDownloads(downloads: DownloadedBook[]): Promise<void> {
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
}

// Check if book is downloaded
export async function isBookDownloaded(bookId: string): Promise<boolean> {
  const downloads = await getDownloads();
  return downloads.some((d) => d.id === bookId);
}

// Get a specific downloaded book
export async function getDownloadedBook(bookId: string): Promise<DownloadedBook | undefined> {
  const downloads = await getDownloads();
  return downloads.find((d) => d.id === bookId);
}

// Parse M3U8 playlist and extract segment URLs
async function parseM3U8(m3u8Url: string): Promise<string[]> {
  try {
    const response = await fetch(m3u8Url);
    const content = await response.text();

    const lines = content.split('\n');
    const segments: string[] = [];
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') continue;

      // This is a segment file
      if (trimmed.endsWith('.ts')) {
        // Handle relative or absolute URLs
        if (trimmed.startsWith('http')) {
          segments.push(trimmed);
        } else {
          segments.push(baseUrl + trimmed);
        }
      }
    }

    return segments;
  } catch (error) {
    console.error('Failed to parse M3U8:', error);
    throw new Error('Failed to parse playlist');
  }
}

// Download a single file
async function downloadFile(
  url: string,
  localPath: string,
  onProgress?: (downloaded: number, total: number) => void
): Promise<number> {
  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    localPath,
    {},
    (downloadProgress) => {
      if (onProgress) {
        onProgress(
          downloadProgress.totalBytesWritten,
          downloadProgress.totalBytesExpectedToWrite
        );
      }
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result) {
    throw new Error('Download failed');
  }

  const fileInfo = await FileSystem.getInfoAsync(localPath);
  return (fileInfo as any).size || 0;
}

// Create local M3U8 playlist pointing to local segment files
function createLocalM3U8Content(segmentFiles: string[]): string {
  let content = '#EXTM3U\n';
  content += '#EXT-X-VERSION:3\n';
  content += '#EXT-X-TARGETDURATION:15\n';
  content += '#EXT-X-MEDIA-SEQUENCE:0\n';
  content += '#EXT-X-PLAYLIST-TYPE:VOD\n';

  for (const segment of segmentFiles) {
    content += '#EXTINF:15.0,\n';
    content += segment + '\n';
  }

  content += '#EXT-X-ENDLIST\n';
  return content;
}

// Download a single chapter (all HLS segments)
async function downloadChapter(
  chapter: AudioChapter,
  bookDir: string,
  onProgress?: (progress: number) => void
): Promise<{ localPath: string; size: number }> {
  const chapterDir = `${bookDir}chapter-${chapter.order}/`;

  // Create chapter directory
  await FileSystem.makeDirectoryAsync(chapterDir, { intermediates: true });

  // Parse M3U8 to get segment URLs
  const segmentUrls = await parseM3U8(chapter.audioUrl);

  if (segmentUrls.length === 0) {
    throw new Error('No segments found in playlist');
  }

  let totalSize = 0;
  const localSegments: string[] = [];

  // Download each segment
  for (let i = 0; i < segmentUrls.length; i++) {
    const segmentUrl = segmentUrls[i];
    const segmentName = `chunk_${String(i).padStart(3, '0')}.ts`;
    const localSegmentPath = chapterDir + segmentName;

    const size = await downloadFile(segmentUrl, localSegmentPath);
    totalSize += size;
    localSegments.push(segmentName);

    if (onProgress) {
      onProgress(((i + 1) / segmentUrls.length) * 100);
    }
  }

  // Create local M3U8 playlist
  const localM3U8Content = createLocalM3U8Content(localSegments);
  const localM3U8Path = chapterDir + 'playlist.m3u8';
  await FileSystem.writeAsStringAsync(localM3U8Path, localM3U8Content);

  return { localPath: localM3U8Path, size: totalSize };
}

// Download entire book
export async function downloadBook(
  book: AudioBook,
  environment: Environment,
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadedBook> {
  await ensureDownloadDir();

  // Filter playable chapters
  const playableChapters = book.chapters.filter(ch => ch.isPublished && ch.audioUrl);

  if (playableChapters.length === 0) {
    throw new Error('Book has no downloadable chapters');
  }

  const bookDir = `${DOWNLOADS_DIR}${book.id}/`;

  // Check if already downloading or downloaded
  const existing = await getDownloadedBook(book.id);
  if (existing) {
    throw new Error('Book is already downloaded');
  }

  // Create book directory
  await FileSystem.makeDirectoryAsync(bookDir, { intermediates: true });

  // Download thumbnail
  let localThumbnail = '';
  if (book.thumbnail) {
    try {
      const thumbnailPath = bookDir + 'thumbnail.jpg';
      await downloadFile(book.thumbnail, thumbnailPath);
      localThumbnail = thumbnailPath;
    } catch {
      // Thumbnail download failed, use remote URL
      localThumbnail = book.thumbnail;
    }
  }

  const downloadedChapters: DownloadedChapter[] = [];
  let totalSize = 0;

  // Download each chapter
  for (let i = 0; i < playableChapters.length; i++) {
    const chapter = playableChapters[i];

    if (onProgress) {
      onProgress({
        bookId: book.id,
        progress: (i / playableChapters.length) * 100,
        currentChapter: i + 1,
        totalChapters: playableChapters.length,
        status: 'downloading',
      });
    }

    try {
      const { localPath, size } = await downloadChapter(
        chapter,
        bookDir,
        (chapterProgress) => {
          if (onProgress) {
            const overallProgress = ((i + chapterProgress / 100) / playableChapters.length) * 100;
            onProgress({
              bookId: book.id,
              progress: overallProgress,
              currentChapter: i + 1,
              totalChapters: playableChapters.length,
              status: 'downloading',
            });
          }
        }
      );

      totalSize += size;

      downloadedChapters.push({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        order: chapter.order,
        localAudioUrl: localPath,
        duration: chapter.duration,
        isPublished: chapter.isPublished,
      });
    } catch (error) {
      // Clean up on failure
      await FileSystem.deleteAsync(bookDir, { idempotent: true });

      if (onProgress) {
        onProgress({
          bookId: book.id,
          progress: 0,
          currentChapter: i + 1,
          totalChapters: playableChapters.length,
          status: 'error',
          error: `Failed to download chapter ${i + 1}`,
        });
      }

      throw error;
    }
  }

  // Create downloaded book object
  const downloadedBook: DownloadedBook = {
    id: book.id,
    title: book.title,
    author: book.author,
    narrator: book.narrator,
    thumbnail: localThumbnail,
    chapters: downloadedChapters,
    duration: book.duration,
    description: book.description,
    localPath: bookDir,
    downloadedAt: Date.now(),
    totalSize,
    environment,
  };

  // Save to storage
  const downloads = await getDownloads();
  downloads.push(downloadedBook);
  await saveDownloads(downloads);

  if (onProgress) {
    onProgress({
      bookId: book.id,
      progress: 100,
      currentChapter: playableChapters.length,
      totalChapters: playableChapters.length,
      status: 'completed',
    });
  }

  return downloadedBook;
}

// Delete a downloaded book
export async function deleteDownload(bookId: string): Promise<void> {
  const downloads = await getDownloads();
  const book = downloads.find((d) => d.id === bookId);

  if (book) {
    try {
      await FileSystem.deleteAsync(book.localPath, { idempotent: true });
    } catch {
      // Directory might not exist
    }

    const newDownloads = downloads.filter((d) => d.id !== bookId);
    await saveDownloads(newDownloads);
  }
}

// Get total storage used by downloads
export async function getDownloadsSize(): Promise<number> {
  const downloads = await getDownloads();
  return downloads.reduce((total, book) => total + book.totalSize, 0);
}

// Format bytes to human readable
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
