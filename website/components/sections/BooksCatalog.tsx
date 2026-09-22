"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { getThumbnailUrl, formatDuration, type BookCatalogItem } from "@/lib/api";

interface BooksCatalogProps {
  books: BookCatalogItem[];
}

export function BooksCatalog({ books }: BooksCatalogProps) {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string | null>(null);

  const genres = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.genre_names.forEach((g) => set.add(g)));
    return Array.from(set).sort();
  }, [books]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      const matchesGenre = !genre || b.genre_names.includes(genre);
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author_names.some((a) => a.toLowerCase().includes(q));
      return matchesGenre && matchesSearch;
    });
  }, [books, search, genre]);

  return (
    <div>
      {/* Search + genre filters */}
      <div className="mb-10 space-y-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or author..."
          className="w-full sm:w-96 px-4 py-2.5 rounded-full bg-bg-card border border-white/10 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand-orange/50 transition-colors"
        />
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setGenre(null)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                genre === null
                  ? "bg-brand-orange text-white border-brand-orange"
                  : "bg-bg-card text-text-secondary border-white/10 hover:border-white/20"
              }`}
            >
              All
            </button>
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g === genre ? null : g)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  genre === g
                    ? "bg-brand-orange text-white border-brand-orange"
                    : "bg-bg-card text-text-secondary border-white/10 hover:border-white/20"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-secondary text-center py-20">No audiobooks match your search.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((book, index) => {
            const thumbnailUrl = getThumbnailUrl(book.thumbnail);
            return (
              <FadeIn key={book.id} delay={Math.min(index, 12) * 0.03}>
                <Link
                  href={`/book/${book.slug}`}
                  className="group block h-full rounded-xl overflow-hidden bg-bg-card border border-white/10 hover:border-brand-orange/40 transition-colors duration-200"
                >
                  <div className="relative w-full aspect-square bg-bg-card overflow-hidden">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={book.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-orange">
                        <span className="text-3xl font-bold text-white">
                          {book.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-sm sm:text-base font-bold text-text-primary mb-1 leading-snug line-clamp-2 group-hover:text-brand-orange transition-colors duration-200">
                      {book.title}
                    </h2>
                    {book.author_names.length > 0 && (
                      <p className="text-text-secondary text-xs sm:text-sm mb-2 line-clamp-1">
                        {book.author_names.join(", ")}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 text-xs text-text-secondary">
                      {book.total_duration ? (
                        <span>{formatDuration(book.total_duration)}</span>
                      ) : null}
                      {book.total_duration && book.genre_names[0] ? <span>&middot;</span> : null}
                      {book.genre_names[0] && <span>{book.genre_names[0]}</span>}
                    </div>
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      )}
    </div>
  );
}
