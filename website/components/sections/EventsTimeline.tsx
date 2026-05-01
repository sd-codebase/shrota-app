"use client";

import { useState } from "react";
import Image from "next/image";
import { FadeIn } from "@/components/animations/FadeIn";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { getEventCoverUrl, type Event } from "@/lib/api";

interface EventsTimelineProps {
  events: Event[];
}

export function EventsTimeline({ events }: EventsTimelineProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState("");

  const openLightbox = (src: string, alt: string) => {
    setLightboxSrc(src);
    setLightboxAlt(alt);
  };

  return (
    <>
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[39px] top-0 bottom-0 w-px bg-brand-orange/20 hidden sm:block" />

        <div className="flex flex-col gap-10">
          {events.map((event, index) => (
            <FadeIn key={event.id} delay={index * 0.05}>
              <div className="flex gap-6 sm:gap-8">
                {/* Thumbnail */}
                <div className="relative shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-bg-card border border-white/10">
                    {event.cover_image ? (
                      <button
                        className="w-full h-full group cursor-zoom-in relative block"
                        onClick={() => openLightbox(getEventCoverUrl(event.cover_image!), event.title)}
                        aria-label="View full image"
                      >
                        <Image
                          src={getEventCoverUrl(event.cover_image)}
                          alt={event.title}
                          width={80}
                          height={80}
                          unoptimized
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
                      </button>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📅
                      </div>
                    )}
                  </div>
                  {/* dot on timeline */}
                  <div className="absolute -right-[21px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-brand-orange border-2 border-bg-primary hidden sm:block" />
                </div>

                {/* Content */}
                <div className="flex-1 border-l-2 border-brand-orange/30 pl-6 pb-2">
                  <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">
                    {new Date(event.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h2 className="text-lg font-bold text-white mb-3 leading-snug">
                    {event.title}
                  </h2>
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                    {event.text}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt={lightboxAlt}
          onClose={() => setLightboxSrc(null)}
        />
      )}
    </>
  );
}
