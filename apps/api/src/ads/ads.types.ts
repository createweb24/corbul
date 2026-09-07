/**
 * Formele de răspuns ale modulului de publicitate (ADS-SPEC §2).
 * Sunt contract pentru `apps/web/src/lib/types.ts` — nu se redenumesc câmpuri.
 */

/** Statusurile unei campanii (coloană `String` în Prisma, uniune în TS). */
export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export const CAMPAIGN_STATUSES: readonly CampaignStatus[] = [
  'DRAFT',
  'PENDING_PAYMENT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
];

/** Cheile celor 5 zone seed-uite — folosite ca valori implicite în web. */
export const ZONE_KEYS = [
  'header_leaderboard',
  'home_infeed',
  'article_inline',
  'sidebar_top',
  'sidebar_bottom',
] as const;

/* ------------------------------------------------------------------ */
/* Public                                                              */
/* ------------------------------------------------------------------ */

/** `GET /api/ads/zones` — vitrina comercială (pagina de publicitate). */
export interface AdZoneDto {
  key: string;
  name: string;
  width: number;
  height: number;
  /** În bani (MDL × 100); `null` dacă zona nu se vinde separat. */
  priceMonthly: number | null;
  order: number;
}

/** Geometria zonei, trimisă în fiecare răspuns de servire. */
export interface ServedZoneDto {
  key: string;
  width: number;
  height: number;
}

/**
 * `GET /api/ads/serve/:zoneKey` — uniune discriminată pe `provider`.
 * `zone: null` apare doar când cheia de zonă nu există (răspuns 200, ca o
 * zonă lipsă să nu spargă pagina).
 */
export type ServedAdDto =
  | {
      provider: 'DIRECT';
      bannerId: number;
      zone: ServedZoneDto;
      imageUrl: string | null;
      html: string | null;
      alt: string | null;
      /** Cale relativă la rădăcina API-ului: `/api/ads/click/<bannerId>`. */
      clickUrl: string;
    }
  | {
      provider: 'ADSENSE';
      zone: ServedZoneDto;
      client: string;
      slot: string;
    }
  | {
      provider: 'NONE';
      zone: ServedZoneDto | null;
    };

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export interface OkDto {
  ok: true;
}

/** Zona văzută din admin — include și câmpurile ascunse publicului. */
export interface AdminZoneDto {
  id: number;
  key: string;
  name: string;
  width: number;
  height: number;
  adsenseSlotId: string | null;
  priceMonthly: number | null;
  active: boolean;
  order: number;
  bannerCount: number;
}

export interface AdvertiserDto {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  website: string | null;
  createdAt: string;
  campaignCount: number;
}

/** Bannerul, cu referințele necesare tabelelor din admin. */
export interface AdBannerDto {
  id: number;
  name: string;
  campaignId: number;
  campaignName: string;
  zoneId: number;
  zoneKey: string;
  zoneName: string;
  width: number;
  height: number;
  imageUrl: string | null;
  html: string | null;
  targetUrl: string;
  alt: string | null;
  weight: number;
  active: boolean;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface AdCampaignDto {
  id: number;
  name: string;
  status: CampaignStatus;
  startsAt: string;
  endsAt: string;
  advertiserId: number;
  advertiserName: string;
  stripeSessionId: string | null;
  createdAt: string;
  banners: AdBannerDto[];
}

/** Un rând din `GET /api/admin/ads/stats`. `date` e o zi calendaristică. */
export interface AdStatRowDto {
  /** `YYYY-MM-DD` (coloană `@db.Date`, normalizată la UTC). */
  date: string;
  bannerId: number;
  bannerName: string;
  impressions: number;
  clicks: number;
}

export interface AdsOverviewDto {
  zones: number;
  advertisers: number;
  campaigns: { active: number; total: number };
  banners: { active: number; total: number };
  impressions30d: number;
  clicks30d: number;
  /** Procent (0–100), rotunjit la 2 zecimale. */
  ctr: number;
}
