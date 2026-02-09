"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { BookShareData, getThumbnailUrl, formatDuration } from "@/lib/api";
import { AppStoreButtons } from "@/components/ui/AppStoreButtons";

interface BookDetailsProps {
  book: BookShareData | null;
  bookId: string;
}

export function BookDetails({ book, bookId }: BookDetailsProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleListenNow = () => {
    setIsRedirecting(true);

    // Try to open the app with deep link
    window.location.href = `shrota://book/${bookId}`;

    // Fallback to app store after timeout
    setTimeout(() => {
      if (!document.hidden) {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isAndroid = /android/i.test(navigator.userAgent);

        if (isIOS) {
          window.location.href =
            "https://apps.apple.com/app/shrota/id6739370270";
        } else if (isAndroid) {
          window.location.href =
            "https://play.google.com/store/apps/details?id=com.shrota.app";
        }
        setIsRedirecting(false);
      }
    }, 2500);
  };

  // Auto-attempt deep link on mobile
  useEffect(() => {
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (isMobile && book) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        window.location.href = `shrota://book/${bookId}`;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [bookId, book]);

  if (!book) {
    return null;
  }

  const thumbnailUrl = getThumbnailUrl(book.thumbnail);

  return (
    <div className="pt-20 min-h-screen">
      <section className="py-12 sm:py-24 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={book.title}
                    width={200}
                    height={200}
                    className="rounded-2xl shadow-2xl"
                    priority
                  />
                ) : (
                  <div className="w-[200px] h-[200px] rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {book.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Book Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary mb-3">
                  {book.title}
                </h1>

                {/* Authors */}
                {book.author_names.length > 0 && (
                  <p className="text-text-secondary text-lg mb-2">
                    <span className="text-brand-orange">By</span>{" "}
                    {book.author_names.join(", ")}
                  </p>
                )}

                {/* Narrators */}
                {book.artist_names.length > 0 && (
                  <p className="text-text-secondary mb-4">
                    <span className="text-brand-orange">Narrated by</span>{" "}
                    {book.artist_names.join(", ")}
                  </p>
                )}

                {/* Metadata Pills */}
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-6">
                  {book.language_name && (
                    <span className="px-3 py-1 rounded-full bg-bg-card text-text-secondary text-sm border border-white/10">
                      {book.language_name}
                    </span>
                  )}
                  {book.total_duration && (
                    <span className="px-3 py-1 rounded-full bg-bg-card text-text-secondary text-sm border border-white/10">
                      {formatDuration(book.total_duration)}
                    </span>
                  )}
                  {book.chapter_count > 0 && (
                    <span className="px-3 py-1 rounded-full bg-bg-card text-text-secondary text-sm border border-white/10">
                      {book.chapter_count}{" "}
                      {book.chapter_count === 1 ? "Chapter" : "Chapters"}
                    </span>
                  )}
                </div>

                {/* Genres */}
                {book.genre_names.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-6">
                    {book.genre_names.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue-light text-sm border border-brand-blue/20"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Listen Now Button */}
                <button
                  onClick={handleListenNow}
                  disabled={isRedirecting}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-orange to-brand-orange-light text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-3"
                >
                  {isRedirecting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Opening App...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Listen Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Description */}
            {book.information && (
              <div className="mt-12 bg-bg-card rounded-2xl p-6 md:p-8 border border-white/5">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                  About this audiobook
                </h2>
                <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                  {book.information}
                </p>
              </div>
            )}

            {/* Download App Section */}
            <div className="mt-12 text-center">
              <p className="text-text-secondary mb-6">
                Don&apos;t have the app yet? Download Shrota to start listening.
              </p>
              <AppStoreButtons />
            </div>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
