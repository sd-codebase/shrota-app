import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
  Track,
  TrackType,
  useActiveTrack,
  Event,
} from 'react-native-track-player';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioBook, AudioChapter, DownloadedBook } from '../types';
import { getDownloadedBook } from '../services/downloadService';
import { updateProgress } from '../services/userActivityApi';

const AUTH_TOKEN_KEY = '@shrota_auth_token';
const PROGRESS_SAVE_INTERVAL = 10000; // Save every 10 seconds

// Available playback speeds
export const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.5, 2] as const;
export type PlaybackSpeed = typeof PLAYBACK_SPEEDS[number];

interface PlayerContextType {
  currentBook: AudioBook | null;
  currentChapterIndex: number;
  isPlaying: boolean;
  progress: number;
  duration: number;
  position: number;
  playbackSpeed: PlaybackSpeed;
  playBook: (book: AudioBook | DownloadedBook, chapterIndex?: number) => Promise<void>;
  playChapter: (index: number) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  skipForward: () => Promise<void>;
  skipBackward: () => Promise<void>;
  nextChapter: () => Promise<void>;
  previousChapter: () => Promise<void>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentBook, setCurrentBook] = useState<AudioBook | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeedState] = useState<PlaybackSpeed>(1);
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress();
  const activeTrack = useActiveTrack();

  const isPlaying = playbackState.state === State.Playing;
  const lastSaveTimeRef = useRef<number>(0);
  const totalListenedRef = useRef<number>(0);

  // Listen for track changes
  useEffect(() => {
    const subscription = TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
      if (event.index !== undefined && event.index !== null) {
        setCurrentChapterIndex(event.index);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Refs to track current values for progress saving without triggering re-renders
  const currentBookRef = useRef<AudioBook | null>(null);
  const currentChapterIndexRef = useRef<number>(0);

  // Keep refs in sync with state
  useEffect(() => {
    currentBookRef.current = currentBook;
  }, [currentBook]);

  useEffect(() => {
    currentChapterIndexRef.current = currentChapterIndex;
  }, [currentChapterIndex]);

  // Save progress periodically while playing
  useEffect(() => {
    if (!currentBook || !isPlaying) return;

    const saveProgressToServer = async () => {
      try {
        // Check if user is authenticated
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) return;

        const book = currentBookRef.current;
        if (!book) return;

        // Get current position from TrackPlayer directly
        const { position: currentPosition } = await TrackPlayer.getProgress();
        const chapterIndex = currentChapterIndexRef.current;

        // Calculate total listened time for this book
        const bookDuration = book.duration || 0;
        let totalListened = 0;

        // Sum up duration of completed chapters
        for (let i = 0; i < chapterIndex; i++) {
          totalListened += book.chapters[i]?.duration || 0;
        }
        // Add current position in current chapter
        totalListened += currentPosition;

        // Calculate progress percentage
        const progressPercentage = bookDuration > 0 ? (totalListened / bookDuration) * 100 : 0;

        // Check if completed (95% or more)
        const isCompleted = progressPercentage >= 95;

        await updateProgress({
          book_id: book.id,
          current_chapter_index: chapterIndex,
          current_position: currentPosition,
          total_listened_seconds: Math.floor(totalListened),
          progress_percentage: Math.min(progressPercentage, 100),
          is_completed: isCompleted,
        });

        lastSaveTimeRef.current = Date.now();
      } catch (error) {
        // Silently fail - don't disrupt playback
        console.log('Failed to save progress:', error);
      }
    };

    // Save immediately when starting to play (with a small delay to let playback stabilize)
    const initialSaveTimeout = setTimeout(() => {
      if (Date.now() - lastSaveTimeRef.current > PROGRESS_SAVE_INTERVAL) {
        saveProgressToServer();
      }
    }, 1000);

    // Set up interval for periodic saves
    const interval = setInterval(() => {
      saveProgressToServer();
    }, PROGRESS_SAVE_INTERVAL);

    return () => {
      clearTimeout(initialSaveTimeout);
      clearInterval(interval);
      // Save one last time when stopping
      saveProgressToServer();
    };
  }, [currentBook?.id, isPlaying]);

  const playBook = async (book: AudioBook | DownloadedBook, chapterIndex: number = 0) => {
    // Check if this is a downloaded book or if we have a downloaded version
    const downloadedBook = await getDownloadedBook(book.id);

    let tracks: Track[];
    let chaptersToUse: AudioChapter[];

    if (downloadedBook) {
      // Use local files for downloaded book
      chaptersToUse = downloadedBook.chapters.map(ch => ({
        id: ch.id,
        title: ch.title,
        description: ch.description,
        order: ch.order,
        audioUrl: ch.localAudioUrl,
        duration: ch.duration,
        isPublished: ch.isPublished,
      }));

      tracks = downloadedBook.chapters.map((chapter) => ({
        id: `${book.id}-${chapter.id}`,
        url: chapter.localAudioUrl,
        type: TrackType.HLS,
        title: chapter.title,
        artist: book.author,
        album: book.title,
        artwork: downloadedBook.thumbnail,
      }));
    } else {
      // Use remote streaming URLs
      // Filter only playable chapters (published with audio URL)
      const audioBook = book as AudioBook;
      const playableChapters = audioBook.chapters.filter(ch => ch.isPublished && ch.audioUrl);

      if (playableChapters.length === 0) {
        console.warn('Book has no playable chapters');
        return;
      }

      chaptersToUse = playableChapters;

      // Create tracks for playable chapters only
      // Use TrackType.HLS for HLS streams (.m3u8 playlists)
      tracks = playableChapters.map((chapter) => ({
        id: `${book.id}-${chapter.id}`,
        url: chapter.audioUrl,
        type: TrackType.HLS,
        title: chapter.title,
        artist: book.author,
        album: book.title,
        artwork: book.thumbnail,
      }));
    }

    if (tracks.length === 0) {
      console.warn('No tracks to play');
      return;
    }

    await TrackPlayer.reset();
    await TrackPlayer.add(tracks);

    // Find the track index for the requested chapter
    const requestedChapter = book.chapters[chapterIndex];
    const trackIndex = chaptersToUse.findIndex(ch => ch.id === requestedChapter?.id);
    const startIndex = trackIndex >= 0 ? trackIndex : 0;

    // Skip to the requested chapter
    if (startIndex > 0) {
      await TrackPlayer.skip(startIndex);
    }

    await TrackPlayer.play();
    // Store book with chapters to use for consistent navigation
    setCurrentBook({ ...book, chapters: chaptersToUse });
    setCurrentChapterIndex(startIndex);
  };

  const playChapter = async (index: number) => {
    if (!currentBook || index < 0 || index >= currentBook.chapters.length) {
      return;
    }
    await TrackPlayer.skip(index);
    await TrackPlayer.play();
    setCurrentChapterIndex(index);
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      await TrackPlayer.pause();
    } else {
      await TrackPlayer.play();
    }
  };

  const seekTo = async (pos: number) => {
    await TrackPlayer.seekTo(pos);
  };

  const skipForward = async () => {
    const newPosition = Math.min(position + 15, duration);
    await TrackPlayer.seekTo(newPosition);
  };

  const skipBackward = async () => {
    const newPosition = Math.max(position - 15, 0);
    await TrackPlayer.seekTo(newPosition);
  };

  const nextChapter = async () => {
    if (!currentBook) return;
    const nextIndex = currentChapterIndex + 1;
    if (nextIndex < currentBook.chapters.length) {
      await TrackPlayer.skipToNext();
      setCurrentChapterIndex(nextIndex);
    }
  };

  const previousChapter = async () => {
    if (!currentBook) return;
    // If we're more than 3 seconds into the chapter, restart it
    // Otherwise go to previous chapter
    if (position > 3) {
      await TrackPlayer.seekTo(0);
    } else {
      const prevIndex = currentChapterIndex - 1;
      if (prevIndex >= 0) {
        await TrackPlayer.skipToPrevious();
        setCurrentChapterIndex(prevIndex);
      } else {
        await TrackPlayer.seekTo(0);
      }
    }
  };

  const setPlaybackSpeed = async (speed: PlaybackSpeed) => {
    await TrackPlayer.setRate(speed);
    setPlaybackSpeedState(speed);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentBook,
        currentChapterIndex,
        isPlaying,
        progress: duration > 0 ? position / duration : 0,
        duration,
        position,
        playbackSpeed,
        playBook,
        playChapter,
        togglePlayPause,
        seekTo,
        skipForward,
        skipBackward,
        nextChapter,
        previousChapter,
        setPlaybackSpeed,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
