import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { AudioBook } from '../types';

interface PlayerState {
  // Current playback state
  currentBook: AudioBook | null;
  currentChapterIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  playbackSpeed: number;

  // Computed helper
  progress: number;

  // Actions to update state
  setCurrentBook: (book: AudioBook | null) => void;
  setCurrentChapterIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (position: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackState: (state: Partial<Pick<PlayerState, 'currentBook' | 'currentChapterIndex' | 'isPlaying' | 'position' | 'duration'>>) => void;
  reset: () => void;
}

const initialState = {
  currentBook: null,
  currentChapterIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  playbackSpeed: 1,
  progress: 0,
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,

  setCurrentBook: (book) => set({ currentBook: book }),

  setCurrentChapterIndex: (index) => set({ currentChapterIndex: index }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setPosition: (position) => set((state) => ({
    position,
    progress: state.duration > 0 ? position / state.duration : 0,
  })),

  setDuration: (duration) => set((state) => ({
    duration,
    progress: duration > 0 ? state.position / duration : 0,
  })),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  setPlaybackState: (newState) => set((state) => {
    const updated = { ...state, ...newState };
    return {
      ...newState,
      progress: updated.duration > 0 ? updated.position / updated.duration : 0,
    };
  }),

  reset: () => set(initialState),
}));

// Selector hooks for optimized re-renders
export const useCurrentBook = () => usePlayerStore((state) => state.currentBook);
export const useCurrentChapterIndex = () => usePlayerStore((state) => state.currentChapterIndex);
export const useIsPlaying = () => usePlayerStore((state) => state.isPlaying);
export const usePosition = () => usePlayerStore((state) => state.position);
export const useDuration = () => usePlayerStore((state) => state.duration);
export const useProgress = () => usePlayerStore((state) => state.progress);
export const usePlaybackProgress = () => usePlayerStore(
  useShallow((state) => ({
    position: state.position,
    duration: state.duration,
    progress: state.progress,
  }))
);

// Helper to check if a specific book is currently playing
export const useIsBookPlaying = (bookId: string | undefined) =>
  usePlayerStore((state) => state.currentBook?.id === bookId && state.isPlaying);

// Helper to check if a specific chapter of a book is currently playing
export const useIsChapterPlaying = (bookId: string | undefined, chapterIndex: number) =>
  usePlayerStore((state) =>
    state.currentBook?.id === bookId &&
    state.currentChapterIndex === chapterIndex &&
    state.isPlaying
  );
