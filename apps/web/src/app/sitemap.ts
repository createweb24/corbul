import type { MetadataRoute } from "next";
import { qs, safeFetch } from "@/lib/api";
import type { AuthorDto, CategoryDto } from "@/lib/types";
import { CATEGORY_SEEDS } from "./_lib/categories";
import { getAllArticles } from "./_lib/data";
import { absoluteUrl, languageAlternates, LOCALES } from "./_lib/site";

/**
 * Harta site-ului: paginile statice, categoriile, autorii și articolele,
 * fiecare cu `alternates.languages` ro/ru (SPEC §7 și §10).
 * Se randează și cu API-ul oprit — atunci rămân doar rutele cunoscute.
 */

export const revalidate = 3600;

type Frequency = "daily" | "weekly" | "monthly" | "yearly";

const STATIC_PATHS: { path: string; priority: number; freq: Frequency }[] = [
  { path: "", priority: 1, freq: "daily" },
  { path: "/despre", priority: 0.7, freq: "monthly" },
  { path: "/echipa", priority: 0.6, freq: "monthly" },
  { path: "/contact", priority: 0.5, freq: "monthly" },
  { path: "/abonament", priority: 0.8, freq: "monthly" },
  { path: "/instrumente", priority: 0.6, freq: "monthly" },
  { path: "/confidentialitate", priority: 0.3, freq: "yearly" },
  { path: "/termeni", priority: 0.3, freq: "yearly" },
  // `/cautare` lipsește intenționat: pagina este `noindex`
];

function entry(
  path: string,
  lastModified: Date,
  priority: number,
  changeFrequency: Frequency,
): MetadataRoute.Sitemap {
  const languages = languageAlternates(path);
  return LOCALES.map((locale) => ({
    url: absoluteUrl(locale, path),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [articles, categories, authors] = await Promise.all([
    getAllArticles("ro"),
    safeFetch<CategoryDto[]>(`/categories${qs({ locale: "ro" })}`, { revalidate }),
    safeFetch<AuthorDto[]>(`/authors${qs({ locale: "ro" })}`, { revalidate }),
  ]);

  const out: MetadataRoute.Sitemap = [];

  for (const item of STATIC_PATHS) {
    out.push(...entry(item.path, now, item.priority, item.freq));
  }

  const categorySlugs =
    categories && categories.length > 0
      ? categories.map((category) => category.slug)
      : CATEGORY_SEEDS.map((seed) => seed.slug);
  for (const slug of categorySlugs) {
    out.push(...entry(`/${slug}`, now, 0.7, "daily"));
  }

  for (const author of authors ?? []) {
    out.push(...entry(`/autor/${author.slug}`, now, 0.5, "weekly"));
  }

  for (const article of articles) {
    const published = new Date(article.publishedAt);
    out.push(
      ...entry(
        `/articol/${article.slug}`,
        Number.isNaN(published.getTime()) ? now : published,
        article.featured ? 0.9 : 0.8,
        "weekly",
      ),
    );
  }

  return out;
}
