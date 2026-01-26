// App Configuration - URLs from environment variables
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
export const CDN_URL = process.env.EXPO_PUBLIC_CDN_URL || 'http://localhost:8080';

// Helper to get full CDN URL for audio files
export const getAudioUrl = (audioPath: string): string => {
  if (!audioPath) return '';
  if (audioPath.startsWith('http')) return audioPath;
  return `${CDN_URL}/${audioPath}`;
};

// Helper to get full API URL for thumbnails
export const getThumbnailUrl = (thumbnailPath: string): string => {
  if (!thumbnailPath) return '';
  if (thumbnailPath.startsWith('http')) return thumbnailPath;
  return `${API_URL}/files/thumbnail/${thumbnailPath}`;
};

// Helper to get full API URL for chapter images
export const getChapterImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_URL}/files/chapter-image/${imagePath}`;
};
