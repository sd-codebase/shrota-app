import Image from "next/image";
import Link from "next/link";
import { FadeIn } from "@/components/animations/FadeIn";
import { getNewsCoverUrl, type News } from "@/lib/api";

interface NewsListProps {
  news: News[];
}

export function NewsList({ news }: NewsListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.map((item, index) => (
        <FadeIn key={item.id} delay={index * 0.05}>
          <Link
            href={`/news/${item.slug}`}
            className="group block h-full rounded-xl overflow-hidden bg-bg-card border border-white/10 hover:border-brand-orange/40 transition-colors duration-200"
          >
            <div className="relative w-full aspect-video bg-bg-card overflow-hidden">
              {item.cover_image ? (
                <Image
                  src={getNewsCoverUrl(item.cover_image)}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  📰
                </div>
              )}
            </div>
            <div className="p-5">
              <p className="text-xs text-text-secondary mb-2 uppercase tracking-wider">
                {new Date(item.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h2 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-brand-orange transition-colors duration-200">
                {item.title}
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">
                {item.text}
              </p>
            </div>
          </Link>
        </FadeIn>
      ))}
    </div>
  );
}
