import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/animations/FadeIn";
import { NewsList } from "@/components/sections/NewsList";
import { fetchAllNews } from "@/lib/api";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "News | Shrota",
  description: "Latest news from Shrota Audiobooks.",
};

export default async function NewsPage() {
  const news = await fetchAllNews();

  return (
    <main className="min-h-screen bg-bg-primary pt-24 pb-20">
      <Container>
        <FadeIn>
          <h1 className="text-4xl font-bold text-white mb-2">News</h1>
          <p className="text-text-secondary mb-12">Latest news from Shrota</p>
        </FadeIn>

        {news.length === 0 ? (
          <FadeIn>
            <p className="text-text-secondary text-center py-20">No news yet.</p>
          </FadeIn>
        ) : (
          <NewsList news={news} />
        )}
      </Container>
    </main>
  );
}
