import { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchBookForShare, getThumbnailUrl, BookShareError } from "@/lib/api";
import { BookDetails } from "./BookDetails";

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

    return {
      title: `${book.title} - Shrota`,
      description,
      openGraph: {
        title: book.title,
        description,
        type: "music.album",
        images: thumbnailUrl ? [{ url: thumbnailUrl, width: 400, height: 400 }] : [],
        siteName: "Shrota",
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
    return <BookDetails book={book} bookId={bookId} />;
  } catch (error) {
    const bookError = error as BookShareError;
    if (bookError.status === 404) {
      notFound();
    }
    if (bookError.status === 403) {
      return <BookDetails book={null} bookId={bookId} isRestricted />;
    }
    notFound();
  }
}
