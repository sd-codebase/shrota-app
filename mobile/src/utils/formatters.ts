/**
 * Format duration for display in book cards, lists, etc.
 * - Returns "Xh Ym" if >= 1 hour (e.g., "1h 20m")
 * - Returns "Xm" if < 1 hour (e.g., "55m")
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format playback time for player screen
 * - Returns h:mm:ss if >= 1 hour (e.g., "1:23:45")
 * - Returns mm:ss if < 1 hour (e.g., "23:45")
 */
export function formatPlaybackTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
