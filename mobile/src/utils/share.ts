import { Share, Platform } from 'react-native';
import { AudioBook } from '../types';

const SHARE_BASE_URL = 'https://shrota.in/book';

export async function shareBook({ book }: { book: AudioBook }): Promise<void> {
  const shareUrl = `${SHARE_BASE_URL}/${book.id}`;
  const message = `Listen to "${book.title}" on Shrota`;

  try {
    if (Platform.OS === 'ios') {
      await Share.share({
        message,
        url: shareUrl,
      });
    } else {
      // Android doesn't support separate url field
      await Share.share({
        message: `${message}\n\n${shareUrl}`,
      });
    }
  } catch (error) {
    // User cancelled or share failed
    console.log('Share failed or cancelled:', error);
  }
}
