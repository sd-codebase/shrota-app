import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchBookForShare, getThumbnailUrl, BookShareError } from "@/lib/api";
import { BookDetails } from "./BookDetails";

const SITE_URL = "https://shrota.in";

interface BookPageProps {
  params: Promise<{ bookId: string }>;
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { bookId } = await params;

  try {
    const book = await fetchBookForShare(bookId);
    const thumbnailUrl = getThumbnailUrl(book.thumbnail);
    const description =
      book.information?.slice(0, 160) ||
      `Listen to "${book.title}" by ${book.author_names.join(", ")} on Shrota`;
    const url = `${SITE_URL}/book/${book.slug}`;

    return {
      title: `${book.title} - Shrota`,
      description,
      keywords: [
        "Shrota",
        "audiobook",
        book.title,
        ...book.author_names,
        ...book.genre_names,
      ],
      alternates: {
        canonical: url,
      },
      openGraph: {
        title: book.title,
        description,
        type: "book",
        url,
        images: thumbnailUrl ? [{ url: thumbnailUrl, width: 400, height: 400 }] : [],
        siteName: "Shrota",
        locale: "en_IN",
      },
      twitter: {
        card: "summary_large_image",
        title: book.title,
        description,
        images: thumbnailUrl ? [thumbnailUrl] : [],
      },
    };
  } catch {
    return {
      title: "Book Not Found - Shrota",
      description: "The requested audiobook could not be found.",
    };
  }
}

export default async function BookPage({ params }: BookPageProps) {
  const { bookId } = await params;

  try {
    const book = await fetchBookForShare(bookId);
    const url = `${SITE_URL}/book/${book.slug}`;
    const thumbnailUrl = getThumbnailUrl(book.thumbnail);

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Audiobook",
      name: book.title,
      description: book.information,
      url,
      ...(thumbnailUrl ? { image: [thumbnailUrl] } : {}),
      ...(book.author_names.length > 0
        ? { author: book.author_names.map((name) => ({ "@type": "Person", name })) }
        : {}),
      ...(book.artist_names.length > 0
        ? { readBy: book.artist_names.map((name) => ({ "@type": "Person", name })) }
        : {}),
      ...(book.genre_names.length > 0 ? { genre: book.genre_names } : {}),
      ...(book.language_name ? { inLanguage: book.language_name } : {}),
      ...(book.total_duration
        ? { duration: `PT${Math.round(book.total_duration / 60)}M` }
        : {}),
      publisher: {
        "@type": "Organization",
        name: "Shrota",
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <BookDetails book={book} />
      </>
    );
  } catch (error) {
    const bookError = error as BookShareError;
    if (bookError.status === 404) {
      notFound();
    }
    notFound();
  }
}
