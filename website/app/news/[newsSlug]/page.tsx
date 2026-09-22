import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { fetchNewsBySlug, getNewsCoverUrl } from "@/lib/api";

export const dynamic = 'force-dynamic';

const SITE_URL = "https://shrota.in";

interface NewsDetailPageProps {
  params: Promise<{ newsSlug: string }>;
}

export async function generateMetadata({
  params,
}: NewsDetailPageProps): Promise<Metadata> {
  const { newsSlug } = await params;
  const news = await fetchNewsBySlug(newsSlug);

  if (!news) {
    return {
      title: "News Not Found - Shrota",
      description: "The requested news article could not be found.",
    };
  }

  const description = news.text.slice(0, 160);
  const url = `${SITE_URL}/news/${news.slug}`;
  const imageUrl = news.cover_image ? getNewsCoverUrl(news.cover_image) : undefined;

  return {
    title: `${news.title} | Shrota News`,
    description,
    keywords: ["Shrota", "Shrota news", "audiobooks news", news.title],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: news.title,
      description,
      type: "article",
      url,
      publishedTime: news.created_at,
      modifiedTime: news.updated_at || news.created_at,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: news.title }] : [],
      siteName: "Shrota",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { newsSlug } = await params;
  const news = await fetchNewsBySlug(newsSlug);

  if (!news) {
    notFound();
  }

  const url = `${SITE_URL}/news/${news.slug}`;
  const imageUrl = news.cover_image ? getNewsCoverUrl(news.cover_image) : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    description: news.text.slice(0, 200),
    datePublished: news.created_at,
    dateModified: news.updated_at || news.created_at,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(imageUrl ? { image: [imageUrl] } : {}),
    publisher: {
      "@type": "Organization",
      name: "Shrota",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/shrota-logo-eng.png`,
      },
    },
  };

  return (
    <main className="min-h-screen bg-bg-primary pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container>
        <FadeIn className="max-w-3xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center flex-wrap gap-2 text-sm text-text-secondary">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Shrota
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/news" className="hover:text-white transition-colors">
                  News
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-white truncate max-w-[240px] sm:max-w-md" aria-current="page">
                {news.title}
              </li>
            </ol>
          </nav>

          {news.cover_image && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-bg-card border border-white/10 mb-8">
              <Image
                src={getNewsCoverUrl(news.cover_image)}
                alt={news.title}
                fill
                unoptimized
                className="object-cover"
                priority
              />
            </div>
          )}

          <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider">
            {new Date(news.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
            {news.title}
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed whitespace-pre-line">
            {news.text}
          </p>
        </FadeIn>
      </Container>
    </main>
  );
}
