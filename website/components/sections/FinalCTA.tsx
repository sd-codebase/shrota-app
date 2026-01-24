"use client";

import { Container } from "@/components/ui/Container";
import { AppStoreButtons } from "@/components/ui/AppStoreButtons";
import { FadeIn } from "@/components/animations/FadeIn";
import { SoundWaves } from "@/components/animations/SoundWaves";

export function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-brand-orange via-brand-orange to-orange-600 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 opacity-30">
        <SoundWaves barCount={7} color="bg-white" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-30">
        <SoundWaves barCount={7} color="bg-white" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Start Listening?
            </h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of listeners who&apos;ve discovered the joy of
              audiobooks. Your first story awaits.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <AppStoreButtons className="justify-center" />
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="text-white/70 text-sm mt-6">
              Free to download. Start listening in seconds.
            </p>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
