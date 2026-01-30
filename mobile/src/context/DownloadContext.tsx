import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { AudioBook, DownloadedBook, DownloadProgress } from '../types';
import {
  downloadBook as downloadBookService,
  deleteDownload as deleteDownloadService,
  getDownloads,
} from '../services/downloadService';
import { useAuth } from './AuthContext';

interface DownloadContextType {
  downloads: DownloadedBook[];
  activeDownloads: Map<string, DownloadProgress>;
  downloadBook: (book: AudioBook) => Promise<void>;
  cancelDownload: (bookId: string) => void;
  deleteDownload: (bookId: string) => Promise<void>;
  isDownloaded: (bookId: string) => boolean;
  isDownloading: (bookId: string) => boolean;
  getDownloadProgress: (bookId: string) => DownloadProgress | undefined;
  getDownloadedBookData: (bookId: string) => DownloadedBook | undefined;
  refreshDownloads: () => Promise<void>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export function DownloadProvider({ children }: { children: ReactNode }) {
  const [downloads, setDownloads] = useState<DownloadedBook[]>([]);
  const [activeDownloads, setActiveDownloads] = useState<Map<string, DownloadProgress>>(new Map());
  const { user } = useAuth();
  const previousUserIdRef = useRef<string | null>(null);

  // Refresh downloads when user changes (login/logout or different user)
  useEffect(() => {
    const currentUserId = user?.id || null;

    // Only refresh if user actually changed
    if (currentUserId !== previousUserIdRef.current) {
      previousUserIdRef.current = currentUserId;

      // Clear active downloads when user changes
      setActiveDownloads(new Map());

      // Refresh downloads for new user (will be empty if different user or logged out)
      refreshDownloads();
    }
  }, [user?.id]);

  const refreshDownloads = async () => {
    const data = await getDownloads();
    setDownloads(data);
  };

  const downloadBook = async (book: AudioBook) => {
    if (downloads.some(d => d.id === book.id)) {
      throw new Error('Book is already downloaded');
    }
    if (activeDownloads.has(book.id)) {
      throw new Error('Book is already downloading');
    }

    setActiveDownloads(prev => {
      const next = new Map(prev);
      next.set(book.id, {
        bookId: book.id,
        progress: 0,
        currentChapter: 0,
        totalChapters: book.chapters.filter(ch => ch.isPublished && ch.audioUrl).length,
        status: 'pending',
      });
      return next;
    });

    try {
      await downloadBookService(book, (progress) => {
        setActiveDownloads(prev => {
          const next = new Map(prev);
          next.set(book.id, progress);
          return next;
        });
      });

      setActiveDownloads(prev => {
        const next = new Map(prev);
        next.delete(book.id);
        return next;
      });

      await refreshDownloads();
    } catch (error) {
      setActiveDownloads(prev => {
        const next = new Map(prev);
        const current = next.get(book.id);
        if (current) {
          next.set(book.id, {
            ...current,
            status: 'error',
            error: error instanceof Error ? error.message : 'Download failed',
          });
        }
        return next;
      });

      throw error;
    }
  };

  const cancelDownload = (bookId: string) => {
    setActiveDownloads(prev => {
      const next = new Map(prev);
      next.delete(bookId);
      return next;
    });
  };

  const deleteDownload = async (bookId: string) => {
    await deleteDownloadService(bookId);
    await refreshDownloads();
  };

  const isDownloaded = useCallback((bookId: string) => {
    return downloads.some(d => d.id === bookId);
  }, [downloads]);

  const isDownloading = useCallback((bookId: string) => {
    const progress = activeDownloads.get(bookId);
    return progress?.status === 'downloading' || progress?.status === 'pending';
  }, [activeDownloads]);

  const getDownloadProgress = useCallback((bookId: string) => {
    return activeDownloads.get(bookId);
  }, [activeDownloads]);

  const getDownloadedBookData = useCallback((bookId: string) => {
    return downloads.find(d => d.id === bookId);
  }, [downloads]);

  return (
    <DownloadContext.Provider
      value={{
        downloads,
        activeDownloads,
        downloadBook,
        cancelDownload,
        deleteDownload,
        isDownloaded,
        isDownloading,
        getDownloadProgress,
        getDownloadedBookData,
        refreshDownloads,
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
}

export function useDownload() {
  const context = useContext(DownloadContext);
  if (context === undefined) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
}
