import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";

export default function NewsNotFound() {
  return (
    <div className="pt-20 min-h-screen">
      <section className="py-24 bg-bg-primary">
        <Container>
          <FadeIn className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-brand-blue-light"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              News Not Found
            </h1>
            <p className="text-text-secondary text-lg mb-8">
              Sorry, we couldn&apos;t find the news article you&apos;re looking for. It
              may have been removed or the link might be incorrect.
            </p>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-orange text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"
                />
              </svg>
              Back to News
            </Link>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
