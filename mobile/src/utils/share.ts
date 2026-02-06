import { Share, Platform } from 'react-native';
import { AudioBook } from '../types';
import { formatDuration } from './formatters';

const SHARE_BASE_URL = 'https://shrota.in/book';

export async function shareBook({ book }: { book: AudioBook }): Promise<void> {
  const shareUrl = `${SHARE_BASE_URL}/${book.id}`;

  // Build detailed message
  let message = `🎧 ${book.title}`;

  if (book.author) {
    message += `\n✍️ By ${book.author}`;
  }

  if (book.narrator) {
    message += `\n🎙️ Narrated by ${book.narrator}`;
  }

  if (book.duration > 0) {
    message += `\n⏱️ ${formatDuration(book.duration)}`;
  }

  if (book.genreNames && book.genreNames.length > 0) {
    message += `\n📚 ${book.genreNames.slice(0, 3).join(', ')}`;
  }

  message += `\n\nListen free on Shrota`;

  try {
    if (Platform.OS === 'ios') {
      await Share.share({
        message,
        url: shareUrl,
      });
    } else {
      // Android doesn't support separate url field
      await Share.share({
        message: `${message}\n${shareUrl}`,
      });
    }
  } catch (error) {
    // User cancelled or share failed
    console.log('Share failed or cancelled:', error);
  }
}
