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
import { updateProgress, getBookProgress } from '../services/userActivityApi';
import { usePlayerStore } from '../stores/playerStore';
import { saveChapterProgress, getChapterProgress } from '../services/chapterProgressService';
import { DEFAULT_AUDIOBOOK_ARTWORK } from '../constants/placeholders';
import { Analytics } from '../services/analytics';

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

  // Get Zustand store actions
  const {
    setCurrentBook: setStoreCurrentBook,
    setCurrentChapterIndex: setStoreChapterIndex,
    setIsPlaying: setStoreIsPlaying,
    setPosition: setStorePosition,
    setDuration: setStoreDuration,
    setPlaybackSpeed: setStorePlaybackSpeed,
  } = usePlayerStore();

  // Sync state to Zustand store
  useEffect(() => {
    setStoreCurrentBook(currentBook);
  }, [currentBook]);

  useEffect(() => {
    setStoreChapterIndex(currentChapterIndex);
  }, [currentChapterIndex]);

  useEffect(() => {
    setStoreIsPlaying(isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    setStorePosition(position);
  }, [position]);

  useEffect(() => {
    setStoreDuration(duration);
  }, [duration]);

  useEffect(() => {
    setStorePlaybackSpeed(playbackSpeed);
  }, [playbackSpeed]);

  // Refs to track current values for progress saving without triggering re-renders
  const currentBookRef = useRef<AudioBook | null>(null);
  const currentChapterIndexRef = useRef<number>(0);
  const lastPositionRef = useRef<number>(0);
  const lastDurationRef = useRef<number>(0);

  // Keep refs in sync with state
  useEffect(() => {
    currentBookRef.current = currentBook;
  }, [currentBook]);

  useEffect(() => {
    currentChapterIndexRef.current = currentChapterIndex;
  }, [currentChapterIndex]);

  // Update position ref when position changes
  useEffect(() => {
    lastPositionRef.current = position;
  }, [position]);

  useEffect(() => {
    lastDurationRef.current = duration;
  }, [duration]);

  // Save chapter progress helper function
  const saveCurrentChapterProgress = async () => {
    const book = currentBookRef.current;
    if (!book) return;

    const chapterIndex = currentChapterIndexRef.current;
    const currentPosition = lastPositionRef.current;
    const currentDuration = lastDurationRef.current;

    if (currentPosition > 0) {
      // Save chapter progress locally
      await saveChapterProgress(book.id, chapterIndex, currentPosition, currentDuration);
    }
  };

  // Listen for track changes - save previous chapter progress before switching
  useEffect(() => {
    const subscription = TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async (event) => {
      if (event.index !== undefined && event.index !== null) {
        const book = currentBookRef.current;
        const prevChapterIndex = currentChapterIndexRef.current;

        // Save progress of the previous chapter before switching
        await saveCurrentChapterProgress();

        // Track chapter completion if moving to next chapter
        if (book && event.index > prevChapterIndex) {
          Analytics.trackChapterCompleted(book.id, prevChapterIndex);

          // Check if book is completed (moved past the last chapter)
          if (event.index >= book.chapters.length - 1) {
            const bookDuration = book.duration || 0;
            Analytics.trackBookCompleted(book.id, bookDuration);
          }
        }

        // Update to new chapter
        setCurrentChapterIndex(event.index);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Save progress when playback pauses or stops
  const wasPlayingRef = useRef<boolean>(false);
  useEffect(() => {
    if (wasPlayingRef.current && !isPlaying) {
      // Playback just paused/stopped - save progress immediately
      saveCurrentChapterProgress();
      // Track pause event
      const book = currentBookRef.current;
      if (book) {
        Analytics.trackPlaybackPaused(book.id, lastPositionRef.current, lastDurationRef.current);
      }
    } else if (!wasPlayingRef.current && isPlaying) {
      // Playback resumed
      const book = currentBookRef.current;
      if (book && lastPositionRef.current > 0) {
        Analytics.trackPlaybackResumed(book.id, lastPositionRef.current);
      }
    }
    wasPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Save progress periodically while playing
  useEffect(() => {
    if (!currentBook || !isPlaying) return;

    const saveProgress = async () => {
      try {
        const book = currentBookRef.current;
        if (!book) return;

        // Get current position from TrackPlayer directly
        const { position: currentPosition, duration: currentDuration } = await TrackPlayer.getProgress();
        const chapterIndex = currentChapterIndexRef.current;

        // Save chapter progress locally (always, even if not authenticated)
        await saveChapterProgress(book.id, chapterIndex, currentPosition, currentDuration);

        // Save to server if authenticated
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
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
        }

        lastSaveTimeRef.current = Date.now();
      } catch (error) {
        // Silently fail - don't disrupt playback
        console.log('Failed to save progress:', error);
      }
    };

    // Save immediately when starting to play (with a small delay to let playback stabilize)
    const initialSaveTimeout = setTimeout(() => {
      if (Date.now() - lastSaveTimeRef.current > PROGRESS_SAVE_INTERVAL) {
        saveProgress();
      }
    }, 1000);

    // Set up interval for periodic saves
    const interval = setInterval(() => {
      saveProgress();
    }, PROGRESS_SAVE_INTERVAL);

    return () => {
      clearTimeout(initialSaveTimeout);
      clearInterval(interval);
      // Save one last time when stopping
      saveProgress();
    };
  }, [currentBook?.id, isPlaying]);

  const playBook = async (book: AudioBook | DownloadedBook, chapterIndex?: number) => {
    // Check if this is a downloaded book or if we have a downloaded version
    const downloadedBook = await getDownloadedBook(book.id);

    // Determine the target chapter index and seek position
    let targetChapterIndex = chapterIndex ?? 0;
    let seekPosition = 0;

    if (chapterIndex !== undefined) {
      // Playing a specific chapter (from chapter card) - get progress from LOCAL STORAGE only
      try {
        const localProgress = await getChapterProgress(book.id, chapterIndex);
        if (localProgress && localProgress.position > 0) {
          seekPosition = localProgress.position;
        }
      } catch (error) {
        console.log('Could not fetch local chapter progress:', error);
      }
    } else {
      // Playing the book (Play/Resume button) - get progress from SERVER DB only
      try {
        const serverProgress = await getBookProgress(book.id);
        if (serverProgress && !serverProgress.is_completed) {
          targetChapterIndex = serverProgress.current_chapter_index;
          seekPosition = serverProgress.current_position;
        }
      } catch (error) {
        // Silently fail - user might not be authenticated
        console.log('Could not fetch server progress:', error);
      }
    }

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

      // Note: Android requires non-empty artwork URL
      tracks = downloadedBook.chapters.map((chapter) => ({
        id: `${book.id}-${chapter.id}`,
        url: chapter.localAudioUrl,
        type: TrackType.HLS,
        title: chapter.title,
        artist: book.author,
        album: book.title,
        artwork: chapter.thumbnail || downloadedBook.thumbnail || DEFAULT_AUDIOBOOK_ARTWORK,
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
      // Note: Android requires non-empty artwork URL
      tracks = playableChapters.map((chapter) => ({
        id: `${book.id}-${chapter.id}`,
        url: chapter.audioUrl,
        type: TrackType.HLS,
        title: chapter.title,
        artist: book.author,
        album: book.title,
        artwork: chapter.thumbnail || book.thumbnail || DEFAULT_AUDIOBOOK_ARTWORK,
      }));
    }

    if (tracks.length === 0) {
      console.warn('No tracks to play');
      return;
    }

    await TrackPlayer.reset();
    await TrackPlayer.add(tracks);

    // Find the track index for the requested chapter
    const requestedChapter = book.chapters[targetChapterIndex];
    const trackIndex = chaptersToUse.findIndex(ch => ch.id === requestedChapter?.id);
    const startIndex = trackIndex >= 0 ? trackIndex : 0;

    // Skip to the requested chapter
    if (startIndex > 0) {
      await TrackPlayer.skip(startIndex);
    }

    await TrackPlayer.play();

    // Seek to saved position if available
    if (seekPosition > 0) {
      // Small delay to let playback start before seeking
      setTimeout(async () => {
        try {
          await TrackPlayer.seekTo(seekPosition);
        } catch (error) {
          console.log('Could not seek to saved position:', error);
        }
      }, 500);
    }

    // Store book with chapters to use for consistent navigation
    setCurrentBook({ ...book, chapters: chaptersToUse });
    setCurrentChapterIndex(startIndex);

    // Track playback started
    const source = chapterIndex !== undefined ? 'chapter_list' : (seekPosition > 0 ? 'resume' : 'book_details');
    Analytics.trackPlaybackStarted(book.id, startIndex, source);
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
    Analytics.trackSeek('forward', 15);
  };

  const skipBackward = async () => {
    const newPosition = Math.max(position - 15, 0);
    await TrackPlayer.seekTo(newPosition);
    Analytics.trackSeek('backward', 15);
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
    Analytics.trackPlaybackSpeedChanged(speed);
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
