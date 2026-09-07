/**
 * Corbul.md — categorii publice (SPEC §4, A1).
 * `count` numără doar articolele publicate. `id` e aditiv față de SPEC §4:
 * editorul din admin trimite `categoryId` numeric (§10ter).
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto, Locale, normalizeLocale, pick } from '../articles/article.types';

const categorySelect = {
  id: true,
  slug: true,
  hue: true,
  order: true,
  nameRo: true,
  nameRu: true,
  descRo: true,
  descRu: true,
  _count: { select: { articles: { where: { published: true } } } },
} satisfies Prisma.CategorySelect;

type CategoryRow = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

function toCategory(row: CategoryRow, locale: Locale): CategoryDto {
  return {
    id: row.id,
    slug: row.slug,
    name: pick(locale, row.nameRo, row.nameRu),
    description: pick(locale, row.descRo, row.descRu),
    hue: row.hue,
    order: row.order,
    count: row._count.articles,
  };
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ordinea din meniu = `order` crescător (SPEC §1). */
  async list(localeInput: unknown): Promise<CategoryDto[]> {
    const locale = normalizeLocale(localeInput);
    const rows = await this.prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      select: categorySelect,
    });
    return rows.map((row) => toCategory(row, locale));
  }

  async getBySlug(slug: string, localeInput: unknown): Promise<CategoryDto> {
    const locale = normalizeLocale(localeInput);
    const row = await this.prisma.category.findUnique({
      where: { slug },
      select: categorySelect,
    });
    if (!row) throw new NotFoundException('Categoria nu a fost găsită');
    return toCategory(row, locale);
  }
}
