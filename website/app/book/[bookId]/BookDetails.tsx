"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { BookShareData, getThumbnailUrl, getChapterImageUrl, formatDuration } from "@/lib/api";
import { AppStoreButtons } from "@/components/ui/AppStoreButtons";

interface BookDetailsProps {
  book: BookShareData | null;
}

export function BookDetails({ book }: BookDetailsProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Deep links always use the book's real ID (not the slug) — the mobile
  // app's link handler expects a UUID regardless of which URL (UUID or
  // slug) the visitor landed on.
  const deepLinkId = book?.id;

  const handleListenNow = () => {
    if (!deepLinkId) return;
    setIsRedirecting(true);

    // Try to open the app with deep link
    window.location.href = `shrota://book/${deepLinkId}`;

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
    if (isMobile && deepLinkId) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        window.location.href = `shrota://book/${deepLinkId}`;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [deepLinkId]);

  if (!book) {
    return null;
  }

  const thumbnailUrl = getThumbnailUrl(book.thumbnail);

  return (
    <div className="pt-20 min-h-screen">
      <section className="py-12 sm:py-24 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto">
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex items-center flex-wrap gap-2 text-sm text-text-secondary">
                <li>
                  <Link href="/" className="hover:text-text-primary transition-colors">
                    Shrota
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/books" className="hover:text-text-primary transition-colors">
                    Books
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-text-primary truncate max-w-[240px] sm:max-w-md" aria-current="page">
                  {book.title}
                </li>
              </ol>
            </nav>

            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
              {/* Book Cover */}
              <div className="flex-shrink-0">
                {thumbnailUrl ? (
                  <Image
                    src={thumbnailUrl}
                    alt={book.title}
                    width={200}
                    height={200}
                    unoptimized
                    className="rounded-2xl shadow-2xl object-cover"
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-card text-text-secondary text-sm border border-white/10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      {book.language_name}
                    </span>
                  )}
                  {book.total_duration && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-card text-text-secondary text-sm border border-white/10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDuration(book.total_duration)}
                    </span>
                  )}
                  {book.chapter_count > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-card text-text-secondary text-sm border border-white/10">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
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

            {/* Chapters */}
            {book.chapters.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-bold text-text-primary mb-4">
                  Chapters ({book.chapters.length})
                </h2>
                <div className="flex flex-col gap-3">
                  {book.chapters.map((chapter, index) => {
                    const chapterImageUrl = getChapterImageUrl(chapter.image);
                    return (
                      <div
                        key={chapter.id}
                        className="flex items-center gap-4 bg-bg-card rounded-xl p-3 sm:p-4 border border-white/5"
                      >
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-bg-secondary">
                          {chapterImageUrl ? (
                            <Image
                              src={chapterImageUrl}
                              alt={chapter.title}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm font-semibold">
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-text-primary font-medium truncate">
                            {index + 1}. {chapter.title}
                          </p>
                          {chapter.description && (
                            <p className="text-text-secondary text-sm truncate">
                              {chapter.description}
                            </p>
                          )}
                        </div>
                        {chapter.duration ? (
                          <span className="text-text-secondary text-sm flex-shrink-0">
                            {formatDuration(chapter.duration)}
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Download App Section */}
            <div className="mt-12 text-center">
              <p className="text-text-secondary mb-6">
                Don&apos;t have the app yet? Download Shrota to start listening.
              </p>
              <AppStoreButtons className="justify-center" />
            </div>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
