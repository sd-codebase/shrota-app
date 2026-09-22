import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/animations/FadeIn";

const SITE_URL = "https://shrota.in";
const CONTACT_EMAIL = "myshrota@gmail.com";

// ---------------------------------------------------------------------------
// EARNINGS — all figures in INR (₹). Shrota is small-scale right now, so
// these are deliberately modest, illustrative numbers — not a fixed offer.
// The owner can revise any of these any time; this is the ONLY place the
// numbers need to change, nothing else on the page hardcodes a ₹ value.
// ---------------------------------------------------------------------------
const EARNINGS = {
  newCreationBonus: 1000, // one-time, once your first story is approved & published
  monthlyBonus: 3000, // up to this much per month, based on listens
  completionBonus: 5000, // one-time, on completing a full series/audiobook
  qualityBonus: 1500, // up to this much per month, for high-quality narration/production
  revenueSharePercent: 20, // ongoing revenue share once published
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const metadata: Metadata = {
  title: "Write With Us | Shrota",
  description:
    "Bring your stories to life on Shrota. Submit your writing, get published as an audiobook, and start earning — built for Marathi writers and writer circles.",
  alternates: {
    canonical: `${SITE_URL}/write-with-us`,
  },
  openGraph: {
    title: "Write With Us | Shrota",
    description:
      "Bring your stories to life on Shrota. Submit your writing, get published as an audiobook, and start earning.",
    type: "website",
    url: `${SITE_URL}/write-with-us`,
    siteName: "Shrota",
    locale: "en_IN",
  },
};

const STEPS = [
  {
    step: "STEP 1",
    title: "Share your story",
    description:
      "Send us your manuscript, story idea, or existing writing — fiction, non-fiction, or serialized fiction, in Marathi.",
  },
  {
    step: "STEP 2",
    title: "We review it",
    description:
      "Our team reads your submission for quality and fit, and gets back to you with feedback or next steps.",
  },
  {
    step: "STEP 3",
    title: "Get published & start earning",
    description:
      "Once approved, we produce it as an audiobook on Shrota, and you start earning as listeners tune in.",
  },
];

const BENEFITS = [
  {
    title: "New creation bonus",
    amount: `Up to ${inr(EARNINGS.newCreationBonus)}`,
    description: "One-time, once your first story is approved and published.",
  },
  {
    title: "Monthly bonus",
    amount: `Up to ${inr(EARNINGS.monthlyBonus)}/month`,
    description: "Based on listens and engagement on your published work.",
  },
  {
    title: "Completion bonus",
    amount: `Up to ${inr(EARNINGS.completionBonus)}`,
    description: "One-time, when you complete a full series or audiobook.",
  },
  {
    title: "Quality bonus",
    amount: `Up to ${inr(EARNINGS.qualityBonus)}/month`,
    description: "For high-quality writing and production standards.",
  },
  {
    title: `Revenue share up to ${EARNINGS.revenueSharePercent}%`,
    amount: "Ongoing",
    description: "Earn a share of revenue for as long as your content is live on Shrota.",
  },
];

export default function WriteWithUsPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-6 border border-brand-orange/20">
              For Writers &amp; Writer Circles
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Write With{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                Shrota
              </span>
            </h1>
            <p className="text-text-secondary text-lg mb-8">
              Have a story to tell? Bring it to life as an audiobook on Shrota
              and reach thousands of Marathi listeners — while earning along
              the way.
            </p>
            <Button href={`mailto:${CONTACT_EMAIL}?subject=I%20want%20to%20write%20for%20Shrota`} size="lg">
              Submit Your Story
            </Button>
          </FadeIn>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-24 bg-bg-secondary">
        <Container>
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How to start earning from your writing
            </h2>
            <p className="text-text-secondary">
              A simple, three-step process to go from story to published
              audiobook.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, index) => (
              <FadeIn key={s.step} delay={index * 0.1}>
                <div className="bg-bg-card rounded-2xl p-8 border border-white/5 h-full">
                  <span className="text-sm font-semibold text-brand-orange tracking-wider">
                    {s.step}
                  </span>
                  <h3 className="text-xl font-bold text-text-primary mt-3 mb-3">
                    {s.title}
                  </h3>
                  <p className="text-text-secondary leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* Earnings / benefits */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What you can earn
            </h2>
            <p className="text-text-secondary">
              Shrota is a growing platform, and our writer program is growing
              with it. Here&apos;s what&apos;s on offer today.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {BENEFITS.map((b, index) => (
              <FadeIn key={b.title} delay={index * 0.05}>
                <div className="bg-bg-card rounded-2xl p-6 border border-white/5 h-full">
                  <p className="text-text-secondary text-sm mb-2">{b.title}</p>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange mb-2">
                    {b.amount}
                  </p>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-10">
            <p className="text-text-secondary text-sm max-w-xl mx-auto">
              As an early-stage platform, our writer earnings program is still
              evolving — these figures may be revised as Shrota grows.
              We&apos;ll always tell you what applies to your work upfront.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* CTA / Help */}
      <section className="py-24 bg-bg-secondary">
        <Container>
          <FadeIn className="max-w-2xl mx-auto text-center">
            <div className="bg-bg-card rounded-2xl p-8 md:p-12 border border-white/5">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Have a story ready, or just a question?
              </h2>
              <p className="text-text-secondary mb-8">
                Whether you&apos;re an individual writer or represent a{" "}
                <span className="italic">लेखक मंडळ</span> (writer circle),
                we&apos;d love to hear from you. Send us your work or write in
                with any questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button href={`mailto:${CONTACT_EMAIL}?subject=Writing%20for%20Shrota`} size="lg">
                  Email Us
                </Button>
                <Button href="/contact" variant="outline" size="lg">
                  Contact Page
                </Button>
              </div>
            </div>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
