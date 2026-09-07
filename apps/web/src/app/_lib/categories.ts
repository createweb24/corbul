import type { CategoryDto, Locale } from "@/lib/types";

/**
 * Lista canonică de categorii din SPEC §1 (ordinea = ordinea din meniu).
 *
 * Serverul rămâne sursa de adevăr — lista de aici are două roluri:
 *   1. validarea segmentului `[category]` înainte de a atinge rețeaua;
 *   2. degradare elegantă: meniul, footerul și paginile de categorie se
 *      randează corect și când API-ul este oprit.
 */

export interface CategorySeed {
  /** id-ul din seed-ul Prisma (autoincrement, în ordinea din SPEC §1) */
  id: number;
  slug: string;
  hue: number;
  order: number;
  nameRo: string;
  nameRu: string;
}

export const CATEGORY_SEEDS: readonly CategorySeed[] = [
  { id: 1, slug: "investigatii", hue: 42, order: 1, nameRo: "Investigații", nameRu: "Расследования" },
  { id: 2, slug: "politica", hue: 0, order: 2, nameRo: "Politică", nameRu: "Политика" },
  { id: 3, slug: "economie", hue: 145, order: 3, nameRo: "Economie", nameRu: "Экономика" },
  { id: 4, slug: "energie", hue: 28, order: 4, nameRo: "Energie", nameRu: "Энергетика" },
  { id: 5, slug: "juridic", hue: 210, order: 5, nameRo: "Juridic", nameRu: "Юридическое" },
  { id: 6, slug: "finante", hue: 165, order: 6, nameRo: "Finanțe", nameRu: "Финансы" },
  {
    id: 7,
    slug: "infrastructura",
    hue: 260,
    order: 7,
    nameRo: "Infrastructură",
    nameRu: "Инфраструктура",
  },
  { id: 8, slug: "coruptie", hue: 355, order: 8, nameRo: "Corupție", nameRu: "Коррупция" },
  { id: 9, slug: "analize", hue: 190, order: 9, nameRo: "Analize", nameRu: "Аналитика" },
  { id: 10, slug: "opinie", hue: 300, order: 10, nameRo: "Opinie", nameRu: "Мнение" },
  {
    id: 11,
    slug: "business-public",
    hue: 85,
    order: 11,
    nameRo: "Business public",
    nameRu: "Госбизнес",
  },
] as const;

export const CATEGORY_SLUGS: readonly string[] = CATEGORY_SEEDS.map((c) => c.slug);

export function isCategorySlug(value: string): boolean {
  return CATEGORY_SLUGS.includes(value);
}

export function categorySeed(slug: string): CategorySeed | undefined {
  return CATEGORY_SEEDS.find((c) => c.slug === slug);
}

export function categoryName(slug: string, locale: Locale): string {
  const seed = categorySeed(slug);
  if (!seed) return slug;
  return locale === "ru" ? seed.nameRu : seed.nameRo;
}

export function categoryHue(slug: string): number {
  return categorySeed(slug)?.hue ?? 42;
}

/** Varianta „de rezervă" a răspunsului `GET /api/categories`. */
export function fallbackCategories(locale: Locale): CategoryDto[] {
  return CATEGORY_SEEDS.map((seed) => ({
    id: seed.id,
    slug: seed.slug,
    name: locale === "ru" ? seed.nameRu : seed.nameRo,
    description: "",
    hue: seed.hue,
    order: seed.order,
    count: 0,
  }));
}
