"use client";

import { Container } from "@/components/ui/Container";
import { AppStoreButtons } from "@/components/ui/AppStoreButtons";
import { HeroWaves } from "@/components/animations/SoundWaves";
import { FadeIn } from "@/components/animations/FadeIn";
import { FloatingElement, PhoneMockup } from "@/components/animations/FloatingElement";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-bg-primary">
      <HeroWaves />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <FadeIn>
              <span className="inline-block px-4 py-2 rounded-full bg-brand-blue/10 text-brand-blue-light text-sm font-medium mb-6 border border-brand-blue/20">
                Now available on iOS & Android
              </span>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Listen to Stories
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                  Anywhere, Anytime
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-lg sm:text-xl text-text-secondary mb-8 max-w-xl mx-auto lg:mx-0">
                Discover thousands of audiobooks, stories, and original content
                in multiple languages. Your next favorite story is just a tap away.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <AppStoreButtons className="justify-center lg:justify-start" />
            </FadeIn>

            <FadeIn delay={0.4}>
              <div className="flex items-center justify-center lg:justify-start gap-8 mt-10">
                <div>
                  <p className="text-3xl font-bold text-text-primary">10K+</p>
                  <p className="text-text-secondary text-sm">Audiobooks</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-text-primary">15+</p>
                  <p className="text-text-secondary text-sm">Languages</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <p className="text-3xl font-bold text-text-primary">4.8</p>
                  <p className="text-text-secondary text-sm">App Rating</p>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Phone Mockup */}
          <div className="hidden lg:flex justify-center">
            <FloatingElement duration={5} yOffset={20}>
              <PhoneMockup />
            </FloatingElement>
          </div>
        </div>
      </Container>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <FadeIn delay={0.6}>
          <div className="flex flex-col items-center gap-2 text-text-secondary">
            <span className="text-sm">Scroll to explore</span>
            <svg
              className="w-6 h-6 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
