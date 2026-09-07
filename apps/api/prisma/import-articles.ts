/**
 * Importă în baza Neon articolele scrise de redactori în scratchpad/new/*.json.
 * Idempotent: `upsert` după slug, ca seed-ul. Nu șterge nimic.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';

const DIR = process.env.NEW_DIR!;
const prisma = new PrismaClient();

const KEYS = [
  'slug', 'category', 'title_ro', 'title_ru', 'summary_ro', 'summary_ru',
  'contents', 'content_ro', 'content_ru', 'author', 'date', 'updated',
  'coverSeed', 'featured', 'breaking', 'views', 'readMin',
  'tags_ro', 'tags_ru', 'sources',
];
const REQUIRED = KEYS.filter((k) => k !== 'contents');
const ALLOWED_TAGS = /<\/?(p|h2|ul|li|blockquote|strong|em|a)(\s[^>]*)?>/g;

interface Art { [k: string]: any }

function problems(a: Art): string[] {
  const out: string[] = [];
  for (const k of REQUIRED) if (!(k in a)) out.push(`lipsește "${k}"`);
  if (typeof a.slug !== 'string' || !/^[a-z0-9-]{20,110}$/.test(a.slug))
    out.push(`slug invalid: ${a.slug}`);
  for (const f of ['content_ro', 'content_ru'] as const) {
    const v = a[f];
    if (typeof v !== 'string' || v.length < 1200) out.push(`${f} prea scurt (${v?.length ?? 0})`);
    else {
      const rest = v.replace(ALLOWED_TAGS, '');
      const stray = rest.match(/<[^>]+>/g);
      if (stray) out.push(`${f}: etichete nepermise ${[...new Set(stray)].slice(0, 3).join(' ')}`);
    }
  }
  for (const f of ['title_ro', 'title_ru', 'summary_ro', 'summary_ru'] as const)
    if (typeof a[f] !== 'string' || a[f].length < 20) out.push(`${f} prea scurt`);
  if (!Array.isArray(a.tags_ro) || !Array.isArray(a.tags_ru)) out.push('etichete invalide');
  if (!Array.isArray(a.sources) || a.sources.some((s: any) => !s?.label))
    out.push('surse invalide');
  if (Number.isNaN(Date.parse(a.date))) out.push(`dată invalidă: ${a.date}`);
  if (!Number.isInteger(a.coverSeed)) out.push('coverSeed invalid');
  if (!Number.isInteger(a.views) || !Number.isInteger(a.readMin)) out.push('views/readMin invalide');
  return out;
}

async function main(): Promise<void> {
  const categories = new Map((await prisma.category.findMany()).map((c) => [c.slug, c.id]));
  const authors = new Map((await prisma.author.findMany()).map((a) => [a.slug, a.id]));
  const existing = new Set((await prisma.article.findMany({ select: { slug: true } })).map((a) => a.slug));

  const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
  const seen = new Set<string>();
  let written = 0, skipped = 0;

  for (const file of files) {
    const list: Art[] = JSON.parse(readFileSync(join(DIR, file), 'utf8'));
    let ok = 0;
    for (const a of list) {
      const errs = problems(a);
      if (!categories.has(a.category)) errs.push(`categorie necunoscută: ${a.category}`);
      if (!authors.has(a.author)) errs.push(`autor necunoscut: ${a.author}`);
      if (seen.has(a.slug)) errs.push('slug duplicat în lot');
      if (errs.length) {
        console.log(`  ✗ ${file} · ${a.slug ?? '(fără slug)'} — ${errs.join('; ')}`);
        skipped += 1;
        continue;
      }
      seen.add(a.slug);
      const premium = (a.category === 'investigatii' || a.category === 'analize') && !a.featured;
      const data = {
        categoryId: categories.get(a.category)!,
        authorId: authors.get(a.author)!,
        titleRo: a.title_ro, titleRu: a.title_ru,
        summaryRo: a.summary_ro, summaryRu: a.summary_ru,
        contentRo: a.content_ro, contentRu: a.content_ru,
        tagsRo: a.tags_ro, tagsRu: a.tags_ru,
        sources: a.sources as unknown as Prisma.InputJsonValue,
        coverSeed: a.coverSeed, featured: !!a.featured, breaking: !!a.breaking,
        premium, published: true, views: a.views, readMin: a.readMin,
        publishedAt: new Date(a.date),
        updatedAt: a.updated ? new Date(a.updated) : null,
      };
      await prisma.article.upsert({
        where: { slug: a.slug }, update: data, create: { slug: a.slug, ...data },
      });
      ok += 1; written += 1;
    }
    console.log(`✓ ${file.padEnd(24)} ${ok}/${list.length}`);
  }

  const total = await prisma.article.count();
  console.log(`\nscrise: ${written} · respinse: ${skipped} · erau deja: ${existing.size} · total în bază: ${total}`);
}

main().finally(() => prisma.$disconnect());
