"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
  rotateOffset?: number;
}

export function FloatingElement({
  children,
  className,
  duration = 4,
  delay = 0,
  yOffset = 15,
  rotateOffset = 2,
}: FloatingElementProps) {
  return (
    <motion.div
      className={cn(className)}
      animate={{
        y: [-yOffset, yOffset, -yOffset],
        rotate: [-rotateOffset, rotateOffset, -rotateOffset],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

interface PhoneMockupProps {
  className?: string;
}

export function PhoneMockup({ className }: PhoneMockupProps) {
  return (
    <div
      className={cn(
        "relative w-[280px] h-[580px] rounded-[3rem] bg-gradient-to-br from-gray-800 to-gray-900 p-2 shadow-2xl",
        className
      )}
    >
      {/* Phone frame */}
      <div className="absolute inset-2 rounded-[2.5rem] bg-bg-primary overflow-hidden border border-white/10">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />

        {/* Screen Content */}
        <div className="w-full h-full pt-10 px-4 bg-gradient-to-b from-bg-secondary to-bg-primary">
          {/* App Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-4 bg-brand-blue/30 rounded" />
            <div className="w-8 h-8 rounded-full bg-brand-orange/30" />
          </div>

          {/* Featured Card */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-blue/20 to-brand-orange/20 p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-brand-blue/40" />
              <div>
                <div className="w-24 h-3 bg-white/30 rounded mb-2" />
                <div className="w-16 h-2 bg-white/20 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <svg
                  className="w-4 h-4 text-white ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </motion.div>
              <div className="flex-1 h-1 bg-white/20 rounded">
                <motion.div
                  className="h-full bg-brand-orange rounded"
                  initial={{ width: "0%" }}
                  animate={{ width: "60%" }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </div>
            </div>
          </div>

          {/* List Items */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3 border-b border-white/5"
            >
              <div className="w-12 h-12 rounded-lg bg-white/10" />
              <div className="flex-1">
                <div className="w-32 h-2.5 bg-white/20 rounded mb-2" />
                <div className="w-20 h-2 bg-white/10 rounded" />
              </div>
              <div className="w-6 h-6 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
