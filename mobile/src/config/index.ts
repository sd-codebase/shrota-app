// Environment Configuration
export type Environment = 'staging' | 'production';

export const ENVIRONMENTS = {
  staging: {
    apiUrl: 'https://api.staging.shrota.in',
    cdnUrl: 'https://audiolibrary.staging.shrota.in',
    label: 'Staging',
    color: '#f39c12',
  },
  production: {
    apiUrl: 'https://api.shrota.in',
    cdnUrl: 'https://audiolibrary.shrota.in',
    label: 'Production',
    color: '#27ae60',
  },
};

// Helper to get full CDN URL for audio files
export const getAudioUrl = (audioPath: string, environment: Environment): string => {
  if (!audioPath) return '';
  if (audioPath.startsWith('http')) return audioPath;
  return `${ENVIRONMENTS[environment].cdnUrl}/${audioPath}`;
};

// Helper to get full API URL for thumbnails
export const getThumbnailUrl = (thumbnailPath: string, environment: Environment): string => {
  if (!thumbnailPath) return '';
  if (thumbnailPath.startsWith('http')) return thumbnailPath;
  return `${ENVIRONMENTS[environment].apiUrl}/files/thumbnail/${thumbnailPath}`;
};
