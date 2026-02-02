"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AppStoreButtonsProps {
  className?: string;
  direction?: "row" | "column";
}

// TODO: Update these URLs when apps are published to stores
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.shrota.app";
const APP_STORE_URL = "";    // e.g., "https://apps.apple.com/app/shrota/id123456789"

export function AppStoreButtons({
  className,
  direction = "row",
}: AppStoreButtonsProps) {
  const handleComingSoon = (e: React.MouseEvent) => {
    if (!GOOGLE_PLAY_URL && !APP_STORE_URL) {
      e.preventDefault();
      // Could show a toast/alert here
    }
  };

  return (
    <div
      className={cn(
        "flex gap-4",
        direction === "column" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
    >
      {/* Google Play Store */}
      <motion.a
        href={GOOGLE_PLAY_URL || "/"}
        onClick={handleComingSoon}
        target={GOOGLE_PLAY_URL ? "_blank" : undefined}
        rel={GOOGLE_PLAY_URL ? "noopener noreferrer" : undefined}
        aria-label={GOOGLE_PLAY_URL ? "Get it on Google Play" : "Coming soon to Google Play"}
        className="inline-flex items-center gap-3 rounded-xl bg-bg-card border border-white/10 px-5 py-3 transition-all hover:bg-bg-secondary hover:border-brand-blue/50"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg
          className="h-8 w-8"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"
            fill="currentColor"
          />
        </svg>
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary">GET IT ON</span>
          <span className="text-base font-semibold text-text-primary">
            Google Play
          </span>
        </div>
      </motion.a>

      {/* Apple App Store */}
      <motion.a
        href={APP_STORE_URL || "/"}
        onClick={handleComingSoon}
        target={APP_STORE_URL ? "_blank" : undefined}
        rel={APP_STORE_URL ? "noopener noreferrer" : undefined}
        aria-label={APP_STORE_URL ? "Download on the App Store" : "Coming soon to App Store"}
        className="inline-flex items-center gap-3 rounded-xl bg-bg-card border border-white/10 px-5 py-3 transition-all hover:bg-bg-secondary hover:border-brand-blue/50"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <svg
          className="h-8 w-8"
          viewBox="0 0 384 512"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
        </svg>
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary">Download on the</span>
          <span className="text-base font-semibold text-text-primary">
            App Store
          </span>
        </div>
      </motion.a>
    </div>
  );
}
