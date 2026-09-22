import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { BooksCatalog } from "@/components/sections/BooksCatalog";
import { fetchBookCatalog } from "@/lib/api";

const SITE_URL = "https://shrota.in";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Audiobooks | Shrota",
  description:
    "Browse the full Shrota audiobook catalog — Marathi audiobooks and stories across every genre. Listen online or download the app.",
  alternates: {
    canonical: `${SITE_URL}/books`,
  },
  openGraph: {
    title: "Audiobooks | Shrota",
    description: "Browse the full Shrota audiobook catalog — Marathi audiobooks and stories across every genre.",
    type: "website",
    url: `${SITE_URL}/books`,
    siteName: "Shrota",
    locale: "en_IN",
  },
};

export default async function BooksPage() {
  const books = await fetchBookCatalog();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: books.map((book, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}/book/${book.slug}`,
      name: book.title,
    })),
  };

  return (
    <main className="min-h-screen bg-bg-primary pt-24 pb-20">
      {books.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Container>
        <FadeIn>
          <h1 className="text-4xl font-bold text-white mb-2">Audiobooks</h1>
          <p className="text-text-secondary mb-12">
            Browse {books.length > 0 ? books.length : ""} Marathi audiobooks and stories on Shrota
          </p>
        </FadeIn>

        {books.length === 0 ? (
          <FadeIn>
            <p className="text-text-secondary text-center py-20">No audiobooks available yet.</p>
          </FadeIn>
        ) : (
          <BooksCatalog books={books} />
        )}
      </Container>
    </main>
  );
}
