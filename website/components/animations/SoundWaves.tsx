"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SoundWavesProps {
  className?: string;
  barCount?: number;
  color?: string;
}

export function SoundWaves({
  className,
  barCount = 5,
  color = "bg-brand-orange",
}: SoundWavesProps) {
  return (
    <div className={cn("flex items-end gap-1 h-8", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={cn("w-1 rounded-full", color)}
          initial={{ height: "20%" }}
          animate={{
            height: ["20%", "100%", "50%", "80%", "20%"],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

interface HeroWavesProps {
  className?: string;
}

export function HeroWaves({ className }: HeroWavesProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
    >
      {/* Animated gradient circles */}
      <motion.div
        className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full bg-brand-blue/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-1/2 -right-1/4 w-[600px] h-[600px] rounded-full bg-brand-orange/5 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Sound wave lines */}
      <svg
        className="absolute bottom-0 left-0 w-full h-64 opacity-20"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
      >
        <motion.path
          d="M0,160 C320,220 420,140 640,160 C860,180 960,100 1200,160 C1320,200 1400,140 1440,160 L1440,320 L0,320 Z"
          fill="url(#wave-gradient)"
          animate={{
            d: [
              "M0,160 C320,220 420,140 640,160 C860,180 960,100 1200,160 C1320,200 1400,140 1440,160 L1440,320 L0,320 Z",
              "M0,180 C320,140 420,200 640,180 C860,160 960,220 1200,180 C1320,140 1400,200 1440,180 L1440,320 L0,320 Z",
              "M0,160 C320,220 420,140 640,160 C860,180 960,100 1200,160 C1320,200 1400,140 1440,160 L1440,320 L0,320 Z",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
