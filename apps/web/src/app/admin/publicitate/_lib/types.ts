/**
 * Formele de date ale modulului de publicitate (CORBUL.MD §1–§2).
 *
 * Rutele `/api/admin/ads/*` sunt construite în paralel de AGENT-ADS-API, deci
 * panoul nu se sprijină pe forma exactă a răspunsului: tot ce intră trece prin
 * `normalize.ts`, iar tipurile de mai jos descriu doar ce folosește interfața.
 * Nimic nu se adaugă în `@/lib/types` — acela e teritoriul afișării publice.
 */

export type AdCampaignStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export interface AdZoneDto {
  id: number;
  key: string;
  name: string;
  width: number;
  height: number;
  /** identificatorul slotului din contul AdSense (gol = zonă fără rezervă) */
  adsenseSlotId: string | null;
  /** tarif lunar în bani (MDL × 100) */
  priceMonthly: number | null;
  active: boolean;
  order: number;
}

export interface AdvertiserDto {
  id: number;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  website: string | null;
  createdAt: string | null;
}

export interface AdCampaignDto {
  id: number;
  name: string;
  status: AdCampaignStatus;
  startsAt: string;
  endsAt: string;
  advertiserId: number;
  /** completat din răspuns dacă API-ul include clientul, altfel dedus local */
  advertiserName: string | null;
  stripeSessionId: string | null;
  /** numărul de bannere raportat de API; `null` = se numără din lista locală */
  bannerCount: number | null;
  createdAt: string | null;
}

export interface AdBannerDto {
  id: number;
  name: string;
  campaignId: number;
  zoneId: number;
  imageUrl: string | null;
  html: string | null;
  targetUrl: string;
  alt: string | null;
  weight: number;
  active: boolean;
  createdAt: string | null;
}

export interface AdStatRowDto {
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
  ctr: number;
}

/* ------------------------------------------------------------------ */
/* Corpurile trimise către API                                         */
/* ------------------------------------------------------------------ */

export interface AdZonePayload {
  key: string;
  name: string;
  width: number;
  height: number;
  adsenseSlotId: string | null;
  priceMonthly: number | null;
  active: boolean;
  order: number;
}

export interface AdvertiserPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  website: string | null;
}

export interface AdCampaignPayload {
  name: string;
  advertiserId: number;
  status: AdCampaignStatus;
  startsAt: string;
  endsAt: string;
}

export interface AdBannerPayload {
  name: string;
  campaignId: number;
  zoneId: number;
  imageUrl: string | null;
  html: string | null;
  targetUrl: string;
  alt: string | null;
  weight: number;
  active: boolean;
}
