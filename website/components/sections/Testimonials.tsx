"use client";

import { Container } from "@/components/ui/Container";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/animations/FadeIn";
import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Shrota has transformed my daily commute. Now I look forward to traffic jams!",
    author: "Priya Sawant",
    role: "Avid Listener",
    avatar: "PS",
  },
  {
    quote:
      "The Marathi audiobook collection is incredible. Finally, quality audiobooks in Marathi.",
    author: "Rajesh Kharat",
    role: "Marathi Literature Fan",
    avatar: "RK",
  },
  {
    quote:
      "My kids love the bedtime stories. The sleep timer is a lifesaver for parents!",
    author: "Anjali Mane",
    role: "Parent",
    avatar: "AM",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-bg-secondary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10">
        <FadeIn className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-brand-blue/10 text-brand-blue-light text-sm font-medium mb-6 border border-brand-blue/20">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Loved by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
              Listeners
            </span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Join thousands of happy listeners who&apos;ve made Shrota part of
            their daily routine.
          </p>
        </FadeIn>

        <FadeInStagger className="grid md:grid-cols-3 gap-6" staggerDelay={0.15}>
          {testimonials.map((testimonial, index) => (
            <FadeInStaggerItem key={index}>
              <motion.div
                className="h-full bg-bg-card rounded-2xl p-6 border border-white/5 flex flex-col"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {/* Quote icon */}
                <svg
                  className="w-10 h-10 text-brand-blue/30 mb-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>

                {/* Quote */}
                <p className="text-text-primary text-lg mb-6 flex-grow">
                  &quot;{testimonial.quote}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>

        {/* Stats */}
        <FadeIn delay={0.4} className="mt-16">
          <div className="bg-bg-card rounded-2xl p-8 border border-white/5">
            <div className="grid grid-cols-3 gap-8">
              {[
                { value: "10K+", label: "Happy Listeners" },
                { value: "100+", label: "Audiobooks" },
                { value: "Marathi", label: "Language" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                    {stat.value}
                  </p>
                  <p className="text-text-secondary mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
