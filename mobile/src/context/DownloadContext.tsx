import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AudioBook, DownloadedBook, DownloadProgress } from '../types';
import {
  downloadBook as downloadBookService,
  deleteDownload as deleteDownloadService,
  getDownloads,
  isBookDownloaded,
  getDownloadedBook,
} from '../services/downloadService';

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

  // Load downloads on mount
  useEffect(() => {
    refreshDownloads();
  }, []);

  const refreshDownloads = async () => {
    const data = await getDownloads();
    setDownloads(data);
  };

  const downloadBook = async (book: AudioBook) => {
    // Check if already downloaded or downloading
    if (downloads.some(d => d.id === book.id)) {
      throw new Error('Book is already downloaded');
    }
    if (activeDownloads.has(book.id)) {
      throw new Error('Book is already downloading');
    }

    // Set initial progress
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

      // Remove from active downloads
      setActiveDownloads(prev => {
        const next = new Map(prev);
        next.delete(book.id);
        return next;
      });

      // Refresh downloads list
      await refreshDownloads();
    } catch (error) {
      // Update status to error
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
    // Note: Actual cancellation would require more complex handling
    // For now, just remove from active downloads
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
