/**
 * Citirea defensivă a răspunsurilor de la `/api/admin/ads/*`.
 *
 * Modulul de API se scrie în paralel; până se așază, un câmp lipsă sau un
 * `advertiser` inclus în loc de `advertiserId` nu are voie să arunce pagina în
 * ecranul de eroare al lui React. Tot ce intră trece pe aici și iese ca DTO
 * complet, cu valori implicite rezonabile.
 */

import type {
  AdBannerDto,
  AdCampaignDto,
  AdCampaignStatus,
  AdStatRowDto,
  AdvertiserDto,
  AdZoneDto,
  AdsOverviewDto,
} from "./types";

export const CAMPAIGN_STATUSES: AdCampaignStatus[] = [
  "DRAFT",
  "PENDING_PAYMENT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function optNum(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = num(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function optStr(value: unknown): string | null {
  const text = str(value, "").trim();
  return text ? text : null;
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return fallback;
}

/** Acceptă atât `[…]` cât și `{ items: […] }` — ambele forme apar în API. */
function listOf(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.items)) return value.items;
  return [];
}

function isoDate(value: unknown): string {
  const text = str(value, "");
  if (!text) return "";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function status(value: unknown): AdCampaignStatus {
  const text = str(value, "DRAFT").toUpperCase();
  return (CAMPAIGN_STATUSES as string[]).includes(text)
    ? (text as AdCampaignStatus)
    : "DRAFT";
}

/* ------------------------------------------------------------------ */

export function toZone(raw: unknown): AdZoneDto | null {
  if (!isRecord(raw)) return null;
  const id = optNum(raw.id);
  if (id === null) return null;
  return {
    id,
    key: str(raw.key, `zona-${id}`),
    name: str(raw.name, str(raw.key, `Zona ${id}`)),
    width: Math.max(1, Math.round(num(raw.width, 300))),
    height: Math.max(1, Math.round(num(raw.height, 250))),
    adsenseSlotId: optStr(raw.adsenseSlotId),
    priceMonthly: optNum(raw.priceMonthly),
    active: bool(raw.active, true),
    order: Math.round(num(raw.order, 0)),
  };
}

export function toZones(raw: unknown): AdZoneDto[] {
  return listOf(raw)
    .map(toZone)
    .filter((zone): zone is AdZoneDto => zone !== null)
    .sort((a, b) => a.order - b.order || a.id - b.id);
}

export function toAdvertiser(raw: unknown): AdvertiserDto | null {
  if (!isRecord(raw)) return null;
  const id = optNum(raw.id);
  if (id === null) return null;
  return {
    id,
    companyName: str(raw.companyName, `Client #${id}`),
    contactName: str(raw.contactName, ""),
    email: str(raw.email, ""),
    phone: optStr(raw.phone),
    website: optStr(raw.website),
    createdAt: isoDate(raw.createdAt) || null,
  };
}

export function toAdvertisers(raw: unknown): AdvertiserDto[] {
  return listOf(raw)
    .map(toAdvertiser)
    .filter((item): item is AdvertiserDto => item !== null)
    .sort((a, b) => a.companyName.localeCompare(b.companyName, "ro"));
}

export function toCampaign(raw: unknown): AdCampaignDto | null {
  if (!isRecord(raw)) return null;
  const id = optNum(raw.id);
  if (id === null) return null;

  const embedded = isRecord(raw.advertiser) ? raw.advertiser : null;
  const advertiserId =
    optNum(raw.advertiserId) ?? (embedded ? optNum(embedded.id) : null) ?? 0;
  const banners = listOf(raw.banners);

  return {
    id,
    name: str(raw.name, `Campania #${id}`),
    status: status(raw.status),
    startsAt: isoDate(raw.startsAt),
    endsAt: isoDate(raw.endsAt),
    advertiserId,
    advertiserName: embedded ? optStr(embedded.companyName) : null,
    stripeSessionId: optStr(raw.stripeSessionId),
    bannerCount: Array.isArray(raw.banners)
      ? banners.length
      : optNum(isRecord(raw._count) ? raw._count.banners : null),
    createdAt: isoDate(raw.createdAt) || null,
  };
}

export function toCampaigns(raw: unknown): AdCampaignDto[] {
  return listOf(raw)
    .map(toCampaign)
    .filter((item): item is AdCampaignDto => item !== null)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt) || b.id - a.id);
}

export function toBanner(raw: unknown): AdBannerDto | null {
  if (!isRecord(raw)) return null;
  const id = optNum(raw.id);
  if (id === null) return null;

  const zone = isRecord(raw.zone) ? raw.zone : null;
  const campaign = isRecord(raw.campaign) ? raw.campaign : null;

  return {
    id,
    name: str(raw.name, `Banner #${id}`),
    campaignId:
      optNum(raw.campaignId) ?? (campaign ? optNum(campaign.id) : null) ?? 0,
    zoneId: optNum(raw.zoneId) ?? (zone ? optNum(zone.id) : null) ?? 0,
    imageUrl: optStr(raw.imageUrl),
    html: typeof raw.html === "string" && raw.html.trim() ? raw.html : null,
    targetUrl: str(raw.targetUrl, ""),
    alt: optStr(raw.alt),
    weight: Math.min(100, Math.max(1, Math.round(num(raw.weight, 1)))),
    active: bool(raw.active, true),
    createdAt: isoDate(raw.createdAt) || null,
  };
}

export function toBanners(raw: unknown): AdBannerDto[] {
  return listOf(raw)
    .map(toBanner)
    .filter((item): item is AdBannerDto => item !== null)
    .sort((a, b) => b.id - a.id);
}

export function toStatRows(raw: unknown): AdStatRowDto[] {
  return listOf(raw)
    .map((row): AdStatRowDto | null => {
      if (!isRecord(row)) return null;
      const date = str(row.date, "").slice(0, 10);
      if (!date) return null;
      return {
        date,
        bannerId: optNum(row.bannerId) ?? 0,
        bannerName: str(row.bannerName, "—"),
        impressions: Math.max(0, Math.round(num(row.impressions, 0))),
        clicks: Math.max(0, Math.round(num(row.clicks, 0))),
      };
    })
    .filter((row): row is AdStatRowDto => row !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function toOverview(raw: unknown): AdsOverviewDto | null {
  if (!isRecord(raw)) return null;
  const campaigns = isRecord(raw.campaigns) ? raw.campaigns : {};
  const banners = isRecord(raw.banners) ? raw.banners : {};
  return {
    zones: Math.round(num(raw.zones, 0)),
    advertisers: Math.round(num(raw.advertisers, 0)),
    campaigns: {
      active: Math.round(num(campaigns.active, 0)),
      total: Math.round(num(campaigns.total, 0)),
    },
    banners: {
      active: Math.round(num(banners.active, 0)),
      total: Math.round(num(banners.total, 0)),
    },
    impressions30d: Math.round(num(raw.impressions30d, 0)),
    clicks30d: Math.round(num(raw.clicks30d, 0)),
    ctr: num(raw.ctr, 0),
  };
}

/** `{ ads: { adsenseClientId } }` din `GET /api/admin/settings`. */
export function toAdsenseClientId(raw: unknown): string {
  if (!isRecord(raw)) return "";
  const ads = raw.ads;
  if (typeof ads === "string") return ads;
  if (!isRecord(ads)) return "";
  return str(ads.adsenseClientId, "");
}
