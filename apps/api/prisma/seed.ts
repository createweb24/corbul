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
/* Publicitate — cele 5 zone (ADS-SPEC §1)                             */
/* `priceMonthly` este în bani (MDL × 100).                            */
/* ------------------------------------------------------------------ */

interface SeedZone {
  key: string;
  name: string;
  width: number;
  height: number;
  priceMonthly: number;
  order: number;
}

const AD_ZONES: SeedZone[] = [
  {
    key: 'header_leaderboard',
    name: 'Bandă sub antet',
    width: 970,
    height: 90,
    priceMonthly: 5_000_000,
    order: 1,
  },
  {
    key: 'home_infeed',
    name: 'În flux, prima pagină',
    width: 970,
    height: 250,
    priceMonthly: 4_500_000,
    order: 2,
  },
  {
    key: 'article_inline',
    name: 'În corpul articolului',
    width: 728,
    height: 90,
    priceMonthly: 3_500_000,
    order: 3,
  },
  {
    key: 'sidebar_top',
    name: 'Coloană laterală, sus',
    width: 300,
    height: 250,
    priceMonthly: 3_000_000,
    order: 4,
  },
  {
    key: 'sidebar_bottom',
    name: 'Coloană laterală, jos',
    width: 300,
    height: 600,
    priceMonthly: 4_000_000,
    order: 5,
  },
];

const DEMO_ADVERTISER = {
  companyName: 'Casa de avocatură Lupu & Asociații',
  contactName: 'Victor Lupu',
  email: 'contact@lupu-asociatii.md',
  phone: '+373 22 27 84 10',
  website: 'https://lupu-asociatii.md',
};

const DEMO_CAMPAIGN_NAME = 'Prezență permanentă 2026';
const DEMO_TARGET_URL = 'https://lupu-asociatii.md';

/**
 * Marcaj propriu pentru bannerele demonstrative: fără imagini externe, ca
 * site-ul să arate complet și fără rețea. Culorile vin din tokenii temei
 * (`--color-*`), cu valori de rezervă pentru contextele fără CSS încărcat.
 */
function demoBannerHtml(orientation: 'portrait' | 'landscape'): string {
  const row = orientation === 'landscape';
  return [
    `<div style="display:flex;flex-direction:${row ? 'row' : 'column'};align-items:center;justify-content:center;`,
    'gap:' + (row ? '18px' : '8px') + ';width:100%;height:100%;box-sizing:border-box;padding:12px 18px;text-align:center;',
    'background:var(--color-coal-2,#191d28);border:1px solid var(--color-gold,#d4af37);border-radius:var(--radius,4px);">',
    '<span style="font-family:var(--font-sans,system-ui,sans-serif);font-size:10px;letter-spacing:0.2em;',
    'text-transform:uppercase;color:var(--color-mist,#6b7288);white-space:nowrap;">Spațiu publicitar</span>',
    '<span style="font-family:var(--font-display,Georgia,serif);font-size:' + (row ? '20px' : '19px') + ';',
    'line-height:1.2;font-weight:700;color:var(--color-gold,#d4af37);">Casa de avocatură Lupu &amp; Asociații</span>',
    '<span style="font-family:var(--font-sans,system-ui,sans-serif);font-size:11px;',
    'color:var(--color-fog,#9aa2b5);">Drept comercial, fiscal și societar · Chișinău</span>',
    '</div>',
  ].join('');
}

interface SeedBanner {
  name: string;
  zoneKey: string;
  html: string;
  alt: string;
  weight: number;
}

const DEMO_BANNERS: SeedBanner[] = [
  {
    name: 'Lupu & Asociații — coloană laterală',
    zoneKey: 'sidebar_top',
    html: demoBannerHtml('portrait'),
    alt: 'Casa de avocatură Lupu & Asociații — drept comercial și fiscal',
    weight: 1,
  },
  {
    name: 'Lupu & Asociații — bandă sub antet',
    zoneKey: 'header_leaderboard',
    html: demoBannerHtml('landscape'),
    alt: 'Casa de avocatură Lupu & Asociații — drept comercial și fiscal',
    weight: 1,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

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

  /* --- publicitate: zone ----------------------------------------- */
  const zoneIds = new Map<string, number>();
  for (const zone of AD_ZONES) {
    const row = await prisma.adZone.upsert({
      where: { key: zone.key },
      update: {
        name: zone.name,
        width: zone.width,
        height: zone.height,
        priceMonthly: zone.priceMonthly,
        order: zone.order,
        active: true,
      },
      create: zone,
    });
    zoneIds.set(row.key, row.id);
  }
  console.log(`✓ ${zoneIds.size} zone de publicitate`);

  // `adsenseClientId` se completează din admin: seed-ul doar creează cheia,
  // fără să suprascrie un identificator deja introdus.
  await prisma.setting.upsert({
    where: { key: 'ads' },
    update: {},
    create: { key: 'ads', value: { adsenseClientId: null } },
  });

  /* --- publicitate: client, campanie și bannere demonstrative ----- */
  const advertiser = await prisma.advertiser.upsert({
    where: { email: DEMO_ADVERTISER.email },
    update: {
      companyName: DEMO_ADVERTISER.companyName,
      contactName: DEMO_ADVERTISER.contactName,
      phone: DEMO_ADVERTISER.phone,
      website: DEMO_ADVERTISER.website,
    },
    create: DEMO_ADVERTISER,
  });

  // `AdCampaign` n-are cheie naturală unică: identificăm campania demo prin
  // (nume, client) ca seed-ul să rămână idempotent.
  const now = Date.now();
  const campaignData = {
    status: 'ACTIVE',
    startsAt: new Date(now - 7 * DAY_MS),
    endsAt: new Date(now + 60 * DAY_MS),
  };
  const existingCampaign = await prisma.adCampaign.findFirst({
    where: { name: DEMO_CAMPAIGN_NAME, advertiserId: advertiser.id },
    select: { id: true },
  });
  const campaign = existingCampaign
    ? await prisma.adCampaign.update({
        where: { id: existingCampaign.id },
        data: campaignData,
      })
    : await prisma.adCampaign.create({
        data: {
          name: DEMO_CAMPAIGN_NAME,
          advertiserId: advertiser.id,
          ...campaignData,
        },
      });

  for (const banner of DEMO_BANNERS) {
    const zoneId = zoneIds.get(banner.zoneKey);
    if (zoneId === undefined) {
      throw new Error(
        `Bannerul „${banner.name}" trimite la o zonă necunoscută: ${banner.zoneKey}`,
      );
    }

    const data = {
      zoneId,
      imageUrl: null,
      html: banner.html,
      targetUrl: DEMO_TARGET_URL,
      alt: banner.alt,
      weight: banner.weight,
      active: true,
    };

    const existingBanner = await prisma.adBanner.findFirst({
      where: { name: banner.name, campaignId: campaign.id },
      select: { id: true },
    });
    if (existingBanner) {
      await prisma.adBanner.update({ where: { id: existingBanner.id }, data });
    } else {
      await prisma.adBanner.create({
        data: { name: banner.name, campaignId: campaign.id, ...data },
      });
    }
  }
  console.log(
    `✓ client demo „${advertiser.companyName}", 1 campanie ACTIVE, ${DEMO_BANNERS.length} bannere`,
  );
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
