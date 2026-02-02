import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Work With Us - Shrota",
  description: "Join Shrota and be part of a growing digital audio platform. We're looking for passionate creators, storytellers, and technology enthusiasts.",
};

export default function CareersPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-6 border border-brand-orange/20">
              Join Us
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Work With{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                Us
              </span>
            </h1>
            <p className="text-text-secondary text-lg">
              At Shrota, we believe in the power of audio to educate, inspire,
              and transform lives. We are always looking for passionate individuals
              who want to be part of a growing digital audio platform.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* Call for Collaborators */}
      <section className="py-24 bg-bg-secondary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto">
            <div className="bg-bg-card rounded-2xl p-8 md:p-12 border border-white/5">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
                We&apos;re Looking For
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  "Writers",
                  "Voice Artists",
                  "Educators",
                  "Developers",
                  "Designers",
                  "Content Creators",
                ].map((role) => (
                  <div
                    key={role}
                    className="flex items-center gap-3 p-4 rounded-xl bg-bg-secondary border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-blue/20 to-brand-orange/20 flex items-center justify-center text-brand-blue-light">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-text-primary font-medium">{role}</span>
                  </div>
                ))}
              </div>

              <p className="text-text-secondary text-center mb-8">
                Whether you are a <strong className="text-text-primary">storyteller</strong>, <strong className="text-text-primary">narrator</strong>, <strong className="text-text-primary">translator</strong>, <strong className="text-text-primary">editor</strong>, or <strong className="text-text-primary">technology enthusiast</strong>, Shrota offers an opportunity to collaborate, learn, and grow while contributing to meaningful content for listeners across India and beyond.
              </p>

              <div className="bg-gradient-to-br from-brand-blue/10 to-brand-orange/10 rounded-xl p-6 border border-white/5 text-center">
                <p className="text-text-secondary mb-4">
                  If you are interested in working with us, please send your profile, sample work, or resume to:
                </p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange mb-6">
                  myshrota@gmail.com
                </p>
                <Button href="mailto:myshrota@gmail.com" size="lg">
                  Send Your Profile
                </Button>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Tagline Section */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="text-center">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange max-w-3xl mx-auto">
              Let&apos;s build the future of learning and storytelling together with Shrota.
            </p>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
