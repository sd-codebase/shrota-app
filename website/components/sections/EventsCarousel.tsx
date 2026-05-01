"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { fetchHomeEvents, getEventCoverUrl, type Event } from "@/lib/api";

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function EventsCarousel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchHomeEvents().then(setEvents);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % events.length);
  }, [events.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + events.length) % events.length);
  }, [events.length]);

  useEffect(() => {
    if (events.length <= 1 || isPaused) return;
    timerRef.current = setTimeout(next, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, events.length, isPaused, next]);

  if (events.length === 0) return null;

  const event = events[current];

  return (
    <section className="py-16 bg-bg-secondary">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Events &amp; Updates</h2>
          <Link
            href="/events"
            className="text-sm text-brand-orange hover:text-brand-orange-light transition-colors font-medium"
          >
            See all →
          </Link>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden bg-bg-card"
          style={{ minHeight: 320 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
              className="flex flex-col md:flex-row min-h-[320px]"
            >
              {/* Cover image */}
              <div className="relative w-full md:w-2/5 h-64 md:h-auto shrink-0 bg-black">
                {event.cover_image ? (
                  <button
                    className="absolute inset-0 w-full h-full group cursor-zoom-in"
                    onClick={() => setLightboxSrc(getEventCoverUrl(event.cover_image!))}
                    aria-label="View full image"
                  >
                    <Image
                      src={getEventCoverUrl(event.cover_image)}
                      alt={event.title}
                      fill
                      unoptimized
                      className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                      <svg className="opacity-0 group-hover:opacity-100 transition-opacity text-white drop-shadow-lg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                      </svg>
                    </div>
                  </button>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-text-secondary text-4xl">📅</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col justify-between p-6 md:p-8 flex-1">
                <div>
                  <p className="text-xs text-text-secondary mb-3 uppercase tracking-wider">
                    {new Date(event.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3 leading-snug">
                    {event.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed line-clamp-3">
                    {event.text}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1 text-sm text-brand-orange hover:text-brand-orange-light transition-colors font-medium"
                  >
                    View all events →
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Arrows */}
          {events.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous event"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={next}
                aria-label="Next event"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators */}
        {events.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {events.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to event ${i + 1}`}
                className={`transition-all rounded-full ${
                  i === current
                    ? "w-6 h-2 bg-brand-orange"
                    : "w-2 h-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </Container>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={event.title}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </section>
  );
}
