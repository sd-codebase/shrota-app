import type { MetadataRoute } from "next";
import { fetchBookCatalog, fetchAllNews } from "@/lib/api";

const SITE_URL = "https://shrota.in";

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/books", priority: 0.9, changeFrequency: "daily" },
  { path: "/news", priority: 0.7, changeFrequency: "daily" },
  { path: "/events", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.3, changeFrequency: "monthly" },
  { path: "/write-with-us", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, news] = await Promise.all([fetchBookCatalog(), fetchAllNews()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const bookEntries: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${SITE_URL}/book/${book.slug}`,
    lastModified: new Date(book.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const newsEntries: MetadataRoute.Sitemap = news.map((item) => ({
    url: `${SITE_URL}/news/${item.slug}`,
    lastModified: new Date(item.updated_at || item.created_at),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...bookEntries, ...newsEntries];
}
