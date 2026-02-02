import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "About Us - Shrota",
  description:
    "Shrota is a digital audio platform by Shravanam Soft Solutions LLP, dedicated to making knowledge, literature, and learning accessible through audiobooks.",
};

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-brand-blue/10 text-brand-blue-light text-sm font-medium mb-6 border border-brand-blue/20">
              About Us
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                Shrota
              </span>
            </h1>
            <p className="text-text-secondary text-lg">
              A digital audio platform developed by Shravanam Soft Solutions LLP
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* About Content Section */}
      <section className="py-24 bg-bg-secondary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto">
            <div className="bg-bg-card rounded-2xl p-8 md:p-12 border border-white/5 space-y-8">
              <div>
                <p className="text-text-secondary text-lg leading-relaxed">
                  <strong className="text-text-primary">&apos;Shrota&apos;</strong> is a digital audio platform developed by Shravanam Soft Solutions LLP, dedicated to making knowledge, literature, and learning accessible through high-quality audiobooks and audio content.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Our Mission</h2>
                <p className="text-text-secondary text-lg leading-relaxed">
                  Our mission is to promote listening culture by bringing books, stories, educational material, and inspiring content to users in a simple, user-friendly mobile and web experience.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-4">Our Goal</h2>
                <p className="text-text-secondary text-lg leading-relaxed">
                  Shrota aims to empower learners, readers, and creators by transforming the way people consume content in the digital age.
                </p>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* App Tagline Section */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto text-center">
            <div className="bg-gradient-to-br from-brand-blue/10 to-brand-orange/10 rounded-2xl p-8 md:p-12 border border-white/5">
              <p className="text-xl md:text-2xl text-text-primary leading-relaxed">
                Shrota is an audiobook and audio content platform by Shravanam Soft Solutions LLP, created to make books, knowledge, and learning accessible through engaging and easy-to-use digital audio experiences.
              </p>
            </div>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
