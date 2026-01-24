"use client";

import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Download the App",
    description:
      "Get Shrota free on iOS or Android. Create your account in seconds.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Browse & Discover",
    description:
      "Explore thousands of audiobooks and stories. Find your next favorite.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Listen & Enjoy",
    description:
      "Press play and immerse yourself. Listen anywhere, anytime you want.",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-bg-secondary overflow-hidden">
      <Container>
        <FadeIn className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-brand-blue/10 text-brand-blue-light text-sm font-medium mb-6 border border-brand-blue/20">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Getting started with Shrota is effortless. Three simple steps to
            unlock a world of audio entertainment.
          </p>
        </FadeIn>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-orange -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <FadeIn key={step.number} delay={index * 0.15}>
                <motion.div
                  className="relative bg-bg-card rounded-2xl p-8 border border-white/5 text-center"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step number badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-brand-blue to-brand-orange flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Icon */}
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-blue/20 to-brand-orange/20 flex items-center justify-center text-brand-blue-light">
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-semibold mb-3 text-text-primary">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary">{step.description}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
