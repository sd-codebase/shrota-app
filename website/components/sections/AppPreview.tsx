"use client";

import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { FloatingElement, PhoneMockup } from "@/components/animations/FloatingElement";

export function AppPreview() {
  return (
    <section className="py-24 bg-bg-primary overflow-hidden">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Phone Mockups */}
          <div className="relative flex justify-center">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-radial from-brand-blue/20 via-transparent to-transparent blur-3xl" />

            <div className="relative flex items-center justify-center">
              {/* Left phone - slightly behind */}
              <FloatingElement
                duration={5}
                delay={0.5}
                yOffset={15}
                className="absolute -left-8 lg:-left-16 top-8 z-0 opacity-60 scale-90"
              >
                <PhoneMockup />
              </FloatingElement>

              {/* Main phone - center */}
              <FloatingElement duration={4} yOffset={20} className="relative z-10">
                <PhoneMockup />
              </FloatingElement>

              {/* Right phone - slightly behind */}
              <FloatingElement
                duration={5}
                delay={1}
                yOffset={15}
                className="absolute -right-8 lg:-right-16 top-8 z-0 opacity-60 scale-90"
              >
                <PhoneMockup />
              </FloatingElement>
            </div>
          </div>

          {/* Right - Content */}
          <div className="text-center lg:text-left">
            <FadeIn>
              <span className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-6 border border-brand-orange/20">
                Beautiful Design
              </span>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                Designed for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-blue">
                  Listeners
                </span>
              </h2>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-text-secondary text-lg mb-8">
                Every pixel crafted with care. A beautiful, intuitive interface
                that makes discovering and listening to audiobooks a delight.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <ul className="space-y-4">
                {[
                  "Dark mode that's easy on the eyes",
                  "Gesture controls for quick navigation",
                  "Clean, distraction-free listening experience",
                  "Personalized recommendations",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-text-secondary">
                    <svg
                      className="w-5 h-5 text-brand-orange flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </div>
      </Container>
    </section>
  );
}
