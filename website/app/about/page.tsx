import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "About Us - Shrota",
  description:
    "Learn about Shrota's mission to bring the joy of audiobooks to everyone, in every language.",
};

const values = [
  {
    title: "Accessibility",
    description:
      "We believe everyone deserves access to great stories, regardless of language or ability.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Quality",
    description:
      "Every audiobook is professionally narrated and produced to the highest standards.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    title: "Innovation",
    description:
      "We're constantly improving our app with new features based on listener feedback.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "Community",
    description:
      "Building a community of listeners who share their love of stories.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

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
              Bringing Stories to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                Life
              </span>
            </h1>
            <p className="text-text-secondary text-lg">
              Shrota was born from a simple belief: everyone deserves access to
              great stories, in their own language, on their own terms.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-bg-secondary">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-text-secondary text-lg mb-6">
                We&apos;re on a mission to democratize audiobooks and make them
                accessible to everyone. In a world where time is precious,
                audiobooks offer a way to enjoy literature while commuting,
                exercising, or simply relaxing.
              </p>
              <p className="text-text-secondary text-lg mb-6">
                But we noticed a gap - most audiobook platforms focus on English
                content. Shrota bridges this gap by offering a rich library of
                audiobooks in regional Indian languages, alongside popular English
                titles.
              </p>
              <p className="text-text-secondary text-lg">
                Our goal is simple: to help you fall in love with stories again,
                in the language that speaks to your heart.
              </p>
            </FadeIn>

            <FadeIn direction="right">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-brand-blue/20 to-brand-orange/20 rounded-3xl blur-xl" />
                <div className="relative bg-bg-card rounded-2xl p-8 border border-white/10">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { value: "2023", label: "Founded" },
                      { value: "10K+", label: "Audiobooks" },
                      { value: "15+", label: "Languages" },
                      { value: "100K+", label: "Listeners" },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                          {stat.value}
                        </p>
                        <p className="text-text-secondary mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              The principles that guide everything we do at Shrota.
            </p>
          </FadeIn>

          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
            {values.map((value) => (
              <FadeInStaggerItem key={value.title}>
                <div className="h-full bg-bg-card rounded-2xl p-6 border border-white/5 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-orange/20 flex items-center justify-center text-brand-blue-light">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">
                    {value.title}
                  </h3>
                  <p className="text-text-secondary">{value.description}</p>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </Container>
      </section>
    </div>
  );
}
