/**
 * Seed Corbul.md — idempotent (upsert peste tot).
 * Sursa de conținut editorial: /.content/seed-content.json (nu se modifică).
 *
 *   npm run db:seed        (din rădăcina monorepo-ului)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
/* Forma fișierului de conținut                                        */
/* ------------------------------------------------------------------ */

interface SeedSource {
  label: string;
  url: string;
}

interface SeedAuthor {
  id: string;
  name: string;
  initials: string;
  role_ro: string;
  role_ru: string;
  bio_ro: string;
  bio_ru: string;
  email: string;
}

interface SeedArticle {
  id: string;
  slug: string;
  category: string;
  title_ro: string;
  title_ru: string;
  summary_ro: string;
  summary_ru: string;
  content_ro: string;
  content_ru: string;
  author: string;
  date: string;
  updated: string | null;
  coverSeed: number;
  featured: boolean;
  breaking: boolean;
  views: number;
  readMin: number;
  tags_ro: string[];
  tags_ru: string[];
  sources: SeedSource[];
}

interface SeedSettings {
  tagline_ro: string;
  tagline_ru: string;
  ticker_ro: string[];
  ticker_ru: string[];
  adminPassword: string;
}

interface SeedFile {
  settings: SeedSettings;
  authors: SeedAuthor[];
  articles: SeedArticle[];
}

/* ------------------------------------------------------------------ */
/* Categorii — ordinea din SPEC §1 este ordinea din meniu              */
/* Descrierile RO/RU sunt scrise de A0, în ton editorial sobru.        */
/* ------------------------------------------------------------------ */

interface SeedCategory {
  slug: string;
  hue: number;
  order: number;
  nameRo: string;
  nameRu: string;
  descRo: string;
  descRu: string;
}

const CATEGORIES: SeedCategory[] = [
  {
    slug: 'investigatii',
    hue: 42,
    order: 1,
    nameRo: 'Investigații',
    nameRu: 'Расследования',
    descRo:
      'Anchete de lungă durată, construite pe documente primare și confirmate din cel puțin două surse independente.',
    descRu:
      'Долгие расследования, построенные на первичных документах и подтверждённые минимум двумя независимыми источниками.',
  },
  {
    slug: 'politica',
    hue: 0,
    order: 2,
    nameRo: 'Politică',
    nameRu: 'Политика',
    descRo:
      'Deciziile puterii, actorii din spatele lor și consecințele concrete pentru cetățean.',
    descRu:
      'Решения власти, стоящие за ними игроки и конкретные последствия для граждан.',
  },
  {
    slug: 'economie',
    hue: 145,
    order: 3,
    nameRo: 'Economie',
    nameRu: 'Экономика',
    descRo:
      'Cifrele economiei reale — producție, comerț, prețuri și politici — citite dincolo de comunicate.',
    descRu:
      'Цифры реальной экономики — производство, торговля, цены и политика — прочитанные вне пресс-релизов.',
  },
  {
    slug: 'energie',
    hue: 28,
    order: 4,
    nameRo: 'Energie',
    nameRu: 'Энергетика',
    descRo:
      'Contracte, tarife și securitatea aprovizionării, de la formula prețului la rețeaua electrică.',
    descRu:
      'Контракты, тарифы и безопасность поставок — от ценовой формулы до электросети.',
  },
  {
    slug: 'juridic',
    hue: 210,
    order: 5,
    nameRo: 'Juridic',
    nameRu: 'Юридическое',
    descRo:
      'Legislația, practica instanțelor și reforma justiției, explicate fără jargon inutil.',
    descRu:
      'Законодательство, судебная практика и реформа юстиции — без лишнего жаргона.',
  },
  {
    slug: 'finante',
    hue: 165,
    order: 6,
    nameRo: 'Finanțe',
    nameRu: 'Финансы',
    descRo:
      'Bănci, buget, fiscalitate și traseul banilor publici, urmărit până la beneficiarul final.',
    descRu:
      'Банки, бюджет, налоги и путь публичных денег — прослеженный до конечного получателя.',
  },
  {
    slug: 'infrastructura',
    hue: 260,
    order: 7,
    nameRo: 'Infrastructură',
    nameRu: 'Инфраструктура',
    descRo:
      'Drumuri, poduri, apă și transport: cum se planifică, se atribuie și se recepționează lucrările.',
    descRu:
      'Дороги, мосты, вода и транспорт: как работы планируются, распределяются и принимаются.',
  },
  {
    slug: 'coruptie',
    hue: 355,
    order: 8,
    nameRo: 'Corupție',
    nameRu: 'Коррупция',
    descRo:
      'Conflicte de interese, averi nejustificate și mecanismele prin care instituțiile sunt capturate.',
    descRu:
      'Конфликты интересов, необоснованное имущество и механизмы захвата институтов.',
  },
  {
    slug: 'analize',
    hue: 190,
    order: 9,
    nameRo: 'Analize',
    nameRu: 'Аналитика',
    descRo:
      'Context, date și interpretare: de ce se întâmplă ceea ce se întâmplă și ce urmează.',
    descRu:
      'Контекст, данные и интерпретация: почему происходит то, что происходит, и что будет дальше.',
  },
  {
    slug: 'opinie',
    hue: 300,
    order: 10,
    nameRo: 'Opinie',
    nameRu: 'Мнение',
    descRo:
      'Comentarii semnate. Opiniile aparțin autorilor; faptele pe care se sprijină rămân verificate.',
    descRu:
      'Подписанные комментарии. Мнения принадлежат авторам; факты, на которые они опираются, проверены.',
  },
  {
    slug: 'business-public',
    hue: 85,
    order: 11,
    nameRo: 'Business public',
    nameRu: 'Госбизнес',
    descRo:
      'Întreprinderile de stat și municipale: performanță, contracte, guvernanță corporativă.',
    descRu:
      'Государственные и муниципальные предприятия: результаты, контракты, корпоративное управление.',
  },
];

/* ------------------------------------------------------------------ */

const CONTENT_PATH = join(__dirname, '../../../.content/seed-content.json');

function loadContent(): SeedFile {
  const raw = readFileSync(CONTENT_PATH, 'utf8');
  const parsed = JSON.parse(raw) as SeedFile;
  if (
    !parsed ||
    !Array.isArray(parsed.authors) ||
    !Array.isArray(parsed.articles) ||
    !parsed.settings
  ) {
    throw new Error(`Conținut invalid în ${CONTENT_PATH}`);
  }
  return parsed;
}

/** Articolele premium: investigații și analize care nu sunt „featured". */
function isPremium(article: SeedArticle): boolean {
  return (
    (article.category === 'investigatii' || article.category === 'analize') &&
    !article.featured
  );
}

function toJson(value: SeedSource[]): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

async function main(): Promise<void> {
  const content = loadContent();

  /* --- categorii ------------------------------------------------- */
  const categoryIds = new Map<string, number>();
  for (const category of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        hue: category.hue,
        order: category.order,
        nameRo: category.nameRo,
        nameRu: category.nameRu,
        descRo: category.descRo,
        descRu: category.descRu,
      },
      create: category,
    });
    categoryIds.set(row.slug, row.id);
  }
  console.log(`✓ ${categoryIds.size} categorii`);

  /* --- autori ---------------------------------------------------- */
  const authorIds = new Map<string, number>();
  for (const author of content.authors) {
    const data = {
      name: author.name,
      initials: author.initials,
      email: author.email,
      roleRo: author.role_ro,
      roleRu: author.role_ru,
      bioRo: author.bio_ro,
      bioRu: author.bio_ru,
    };
    const row = await prisma.author.upsert({
      where: { slug: author.id },
      update: data,
      create: { slug: author.id, ...data },
    });
    authorIds.set(row.slug, row.id);
  }
  console.log(`✓ ${authorIds.size} autori`);

  /* --- articole -------------------------------------------------- */
  let premiumCount = 0;
  for (const article of content.articles) {
    const categoryId = categoryIds.get(article.category);
    const authorId = authorIds.get(article.author);
    if (categoryId === undefined) {
      throw new Error(
        `Articolul „${article.slug}" trimite la o categorie necunoscută: ${article.category}`,
      );
    }
    if (authorId === undefined) {
      throw new Error(
        `Articolul „${article.slug}" trimite la un autor necunoscut: ${article.author}`,
      );
    }

    const premium = isPremium(article);
    if (premium) premiumCount += 1;

    const data = {
      categoryId,
      authorId,
      titleRo: article.title_ro,
      titleRu: article.title_ru,
      summaryRo: article.summary_ro,
      summaryRu: article.summary_ru,
      contentRo: article.content_ro,
      contentRu: article.content_ru,
      tagsRo: article.tags_ro,
      tagsRu: article.tags_ru,
      sources: toJson(article.sources),
      coverSeed: article.coverSeed,
      featured: article.featured,
      breaking: article.breaking,
      premium,
      published: true,
      views: article.views,
      readMin: article.readMin,
      publishedAt: new Date(article.date),
      updatedAt: article.updated ? new Date(article.updated) : null,
    };

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: data,
      create: { slug: article.slug, ...data },
    });
  }
  console.log(
    `✓ ${content.articles.length} articole (${premiumCount} marcate premium)`,
  );

  /* --- setări ---------------------------------------------------- */
  const settings: { key: string; value: Prisma.InputJsonValue }[] = [
    {
      key: 'tagline',
      value: {
        ro: content.settings.tagline_ro,
        ru: content.settings.tagline_ru,
      },
    },
    {
      key: 'ticker',
      value: {
        ro: content.settings.ticker_ro,
        ru: content.settings.ticker_ru,
      },
    },
    {
      key: 'pricing',
      value: {
        premiumMonthly: 149,
        premiumAnnual: 1490,
        currency: 'MDL',
        tiers: { bronze: 9900, silver: 19900, gold: 39900 },
      },
    },
    {
      key: 'contact',
      value: {
        email: 'redactia@corbul.md',
        phone: '+373 22 84 19 60',
        address_ro: 'str. Alexandru cel Bun 51, of. 12, Chișinău, MD-2012',
        address_ru: 'ул. Александру чел Бун 51, оф. 12, Кишинёв, MD-2012',
      },
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  // Profilurile sociale se completează din admin: seed-ul doar creează cheia
  // goală, fără să suprascrie adresele deja introduse.
  await prisma.setting.upsert({
    where: { key: 'social' },
    update: {},
    create: {
      key: 'social',
      value: { facebook: '', telegram: '', x: '', linkedin: '' },
    },
  });
  console.log(`✓ ${settings.length + 1} setări`);

  /* --- administrator --------------------------------------------- */
  const password = await bcrypt.hash(
    content.settings.adminPassword || 'corbul2026',
    10,
  );
  await prisma.adminUser.upsert({
    where: { email: 'admin@corbul.md' },
    update: { password, name: 'Redacția Corbul' },
    create: {
      email: 'admin@corbul.md',
      password,
      name: 'Redacția Corbul',
    },
  });
  console.log('✓ administrator admin@corbul.md');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seed finalizat.');
  })
  .catch(async (error: unknown) => {
    console.error('Seed eșuat:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
