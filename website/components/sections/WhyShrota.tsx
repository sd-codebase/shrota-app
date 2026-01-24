"use client";

import { Container } from "@/components/ui/Container";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/animations/FadeIn";
import { motion } from "framer-motion";

const benefits = [
  {
    title: "Offline Mode",
    description: "Download your favorites and listen without internet. Perfect for travel.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
  {
    title: "Sleep Timer",
    description: "Fall asleep to your favorite stories. We'll stop when you drift off.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    title: "Variable Speed",
    description: "Speed up or slow down narration. Learn faster or savor every word.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Bookmarks",
    description: "Mark your favorite moments. Never lose that perfect quote again.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
  },
  {
    title: "Cross-Device Sync",
    description: "Start on your phone, continue on your tablet. Your progress follows you.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    title: "Curated Collections",
    description: "Hand-picked playlists for every mood. Let us guide your next listen.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
];

export function WhyShrota() {
  return (
    <section className="py-24 bg-bg-primary">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div>
            <FadeIn>
              <span className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-6 border border-brand-orange/20">
                Features
              </span>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Why Choose{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                  Shrota
                </span>
                ?
              </h2>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-text-secondary text-lg mb-8">
                We&apos;ve built every feature with listeners in mind. From
                commuters to bedtime readers, Shrota adapts to your lifestyle.
              </p>
            </FadeIn>

            <FadeInStagger className="grid sm:grid-cols-2 gap-4" staggerDelay={0.1}>
              {benefits.map((benefit) => (
                <FadeInStaggerItem key={benefit.title}>
                  <motion.div
                    className="flex items-start gap-4 p-4 rounded-xl bg-bg-card/50 border border-white/5"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-blue/20 text-brand-blue flex items-center justify-center">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          </div>

          {/* Right - Visual */}
          <FadeIn direction="right" className="hidden lg:block">
            <div className="relative">
              {/* Decorative elements */}
              <div className="absolute -top-8 -left-8 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl" />

              {/* Main visual */}
              <div className="relative rounded-3xl bg-gradient-to-br from-bg-card to-bg-secondary p-8 border border-white/10">
                <div className="space-y-4">
                  {/* Visualization bars */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-blue/30 to-brand-orange/30" />
                      <div className="flex-1">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-orange"
                          style={{ width: `${100 - i * 12}%` }}
                        />
                        <div className="h-2 mt-2 rounded-full bg-white/10 w-2/3" />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Stats overlay */}
                <div className="absolute -bottom-6 -right-6 bg-bg-card rounded-2xl p-4 border border-white/10 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Synced</p>
                      <p className="text-xs text-text-secondary">All devices</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
