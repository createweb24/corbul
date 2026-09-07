/**
 * Catalogul redacțional: categoriile și autorii, în forma de care are nevoie
 * editorul de articole.
 *
 * `GET /api/categories?locale=ro` întoarce `CategoryDto` cu `id` numeric
 * (câmp aditiv la contractul SPEC §4), exact ce cer `POST/PUT
 * /api/admin/articles` prin `categoryId`. Lista e citită o singură dată pe
 * sesiune și memorată; o categorie fără articole rămâne selectabilă.
 */

import type { AdminAuthorDto, CategoryDto } from "@/lib/types";
import { adminFetch, publicFetch } from "./session";

export type AdminCategory = CategoryDto;

let cache: AdminCategory[] | null = null;
let pending: Promise<AdminCategory[]> | null = null;

/** Categoriile în ordinea din meniu. */
export async function loadCategories(force = false): Promise<AdminCategory[]> {
  if (!force && cache) return cache;
  if (!force && pending) return pending;

  pending = (async () => {
    const categories = await publicFetch<CategoryDto[]>("/categories?locale=ro");
    const sorted = categories.slice().sort((a, b) => a.order - b.order);
    cache = sorted;
    return sorted;
  })();

  try {
    return await pending;
  } finally {
    pending = null;
  }
}

/** Golește memoria locală (contoarele `count` se schimbă după salvări). */
export function invalidateCategories(): void {
  cache = null;
}

export function categoryBySlug(
  categories: AdminCategory[],
  slug: string,
): AdminCategory | undefined {
  return categories.find((category) => category.slug === slug);
}

export function categoryById(
  categories: AdminCategory[],
  id: number,
): AdminCategory | undefined {
  return categories.find((category) => category.id === id);
}

/** Nuanța HSL a categoriei — pentru coperți și pentru graficul din panou. */
export function hueForSlug(categories: AdminCategory[], slug: string): number {
  return categoryBySlug(categories, slug)?.hue ?? 42;
}

export async function loadAuthors(): Promise<AdminAuthorDto[]> {
  const authors = await adminFetch<AdminAuthorDto[]>("/admin/authors");
  return authors
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "ro"));
}
