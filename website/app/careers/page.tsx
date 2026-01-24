import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/animations/FadeIn";

export const metadata: Metadata = {
  title: "Careers - Shrota",
  description: "Join the Shrota team and help bring the joy of audiobooks to millions.",
};

const benefits = [
  {
    title: "Remote First",
    description: "Work from anywhere in India. We believe in flexibility and trust.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: "Health Insurance",
    description: "Comprehensive health coverage for you and your family.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: "Learning Budget",
    description: "Annual budget for courses, books, and conferences.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "Flexible Hours",
    description: "We care about output, not when you clock in.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const openings = [
  {
    title: "Senior iOS Developer",
    department: "Engineering",
    location: "Remote (India)",
    type: "Full-time",
  },
  {
    title: "Android Developer",
    department: "Engineering",
    location: "Remote (India)",
    type: "Full-time",
  },
  {
    title: "Content Partnerships Manager",
    department: "Content",
    location: "Mumbai / Remote",
    type: "Full-time",
  },
  {
    title: "UX Designer",
    department: "Design",
    location: "Remote (India)",
    type: "Full-time",
  },
  {
    title: "Audio Editor",
    department: "Content",
    location: "Mumbai",
    type: "Full-time",
  },
];

export default function CareersPage() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-brand-orange/10 text-brand-orange text-sm font-medium mb-6 border border-brand-orange/20">
              We&apos;re Hiring
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Build the Future of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-orange">
                Audio
              </span>
            </h1>
            <p className="text-text-secondary text-lg">
              Join our mission to make audiobooks accessible to everyone. We&apos;re
              looking for passionate people who love stories as much as we do.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-bg-secondary">
        <Container>
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Join Shrota?</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              We offer more than just a job. We offer a chance to make a real impact.
            </p>
          </FadeIn>

          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
            {benefits.map((benefit) => (
              <FadeInStaggerItem key={benefit.title}>
                <div className="h-full bg-bg-card rounded-2xl p-6 border border-white/5 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-orange/20 flex items-center justify-center text-brand-blue-light">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">
                    {benefit.title}
                  </h3>
                  <p className="text-text-secondary">{benefit.description}</p>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </Container>
      </section>

      {/* Open Positions */}
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Open Positions</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Find your next role at Shrota. Don&apos;t see a fit? Send us your
              resume anyway - we&apos;re always looking for talented people.
            </p>
          </FadeIn>

          <FadeInStagger className="max-w-3xl mx-auto space-y-4" staggerDelay={0.1}>
            {openings.map((job) => (
              <FadeInStaggerItem key={job.title}>
                <div className="bg-bg-card rounded-2xl p-6 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-1">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
                      <span className="px-2 py-1 rounded-full bg-brand-blue/10 text-brand-blue-light">
                        {job.department}
                      </span>
                      <span>{job.location}</span>
                      <span>&bull;</span>
                      <span>{job.type}</span>
                    </div>
                  </div>
                  <Button href="#" size="sm">
                    Apply Now
                  </Button>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>

          {/* General Application */}
          <FadeIn delay={0.5} className="mt-16">
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-brand-blue/10 to-brand-orange/10 rounded-2xl p-8 border border-white/5 text-center">
              <h3 className="text-2xl font-bold mb-4">Don&apos;t See a Fit?</h3>
              <p className="text-text-secondary mb-6">
                We&apos;re always looking for talented people. Send us your resume
                and tell us how you can contribute to Shrota.
              </p>
              <Button href="mailto:careers@shrota.com" variant="secondary">
                Send Your Resume
              </Button>
            </div>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
