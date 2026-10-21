import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { BooksCatalog } from "@/components/sections/BooksCatalog";
import { fetchBookCatalog, fetchCategories, fetchCategoryRedirect } from "@/lib/api";

const SITE_URL = "https://shrota.in";

export const dynamic = 'force-dynamic';

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
}

async function loadCategory(slug: string) {
  const [categories, catalog] = await Promise.all([fetchCategories(), fetchBookCatalog()]);
  const category = categories.find((c) => c.slug === slug);
  const books = category ? catalog.filter((b) => b.genres.some((g) => g.slug === slug)) : [];
  return { categories, category, books };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const { category } = await loadCategory(categorySlug);
  if (!category) {
    return { title: "Category Not Found - Shrota" };
  }

  const url = `${SITE_URL}/category/${category.slug}`;
  const title = `${category.name} Audiobooks | Shrota`;
  const description =
    category.description?.slice(0, 160) ||
    `Listen to ${category.name} audiobooks in Marathi on Shrota — ${category.book_count} titles to stream or download in the app.`;

  return {
    title,
    description,
    keywords: ["Shrota", "audiobook", "Marathi audiobooks", category.name],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Shrota",
      locale: "en_IN",
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  const { categories, category, books } = await loadCategory(categorySlug);

  if (!category) {
    // An old slug (the admin changed it): redirect to the current URL.
    const currentSlug = await fetchCategoryRedirect(categorySlug);
    if (currentSlug && currentSlug !== categorySlug) {
      permanentRedirect(`/category/${currentSlug}`);
    }
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Audiobooks`,
    url: `${SITE_URL}/category/${category.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: books.map((book, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/book/${book.slug}`,
        name: book.title,
      })),
    },
  };

  return (
    <main className="min-h-screen bg-bg-primary pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <FadeIn>
          <h1 className="text-4xl font-bold text-white mb-2">{category.name} Audiobooks</h1>
          <p className="text-text-secondary mb-12">
            {category.description || `${books.length} ${category.name} audiobooks on Shrota`}
          </p>
        </FadeIn>

        <BooksCatalog books={books} categories={categories} activeCategory={category.slug} />
      </Container>
    </main>
  );
}
