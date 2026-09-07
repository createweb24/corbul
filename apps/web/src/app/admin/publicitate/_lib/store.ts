"use client";

/**
 * Depozitul comun al filelor din `/admin/publicitate`.
 *
 * Toate filele lucrează cu aceleași patru liste (zone, clienți, campanii,
 * bannere), deci se încarcă o singură dată, în pagină, și se reîmprospătează
 * punctual după fiecare salvare. Fiecare listă își ține propria eroare: dacă
 * ruta de campanii încă nu există, fila Zone rămâne perfect utilizabilă.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { adminFetch, errorMessage } from "../../_lib/session";
import {
  toAdvertisers,
  toBanners,
  toCampaigns,
  toOverview,
  toZones,
} from "./normalize";
import type {
  AdBannerDto,
  AdCampaignDto,
  AdvertiserDto,
  AdZoneDto,
  AdsOverviewDto,
} from "./types";

export type AdsPart = "zones" | "advertisers" | "campaigns" | "banners" | "overview";

const ALL_PARTS: AdsPart[] = [
  "zones",
  "advertisers",
  "campaigns",
  "banners",
  "overview",
];

const ENDPOINT: Record<AdsPart, string> = {
  zones: "/admin/ads/zones",
  advertisers: "/admin/ads/advertisers",
  campaigns: "/admin/ads/campaigns",
  banners: "/admin/ads/banners",
  overview: "/admin/ads/overview",
};

const FALLBACK: Record<AdsPart, string> = {
  zones: "Zonele publicitare nu au putut fi încărcate.",
  advertisers: "Lista de clienți nu a putut fi încărcată.",
  campaigns: "Campaniile nu au putut fi încărcate.",
  banners: "Bannerele nu au putut fi încărcate.",
  overview: "Sinteza nu a putut fi încărcată.",
};

export interface AdsStore {
  zones: AdZoneDto[];
  advertisers: AdvertiserDto[];
  campaigns: AdCampaignDto[];
  banners: AdBannerDto[];
  overview: AdsOverviewDto | null;
  /** prima încărcare, cât timp nu există încă nimic pe ecran */
  loading: boolean;
  /** reîncărcare în fundal, după o salvare */
  refreshing: boolean;
  errors: Partial<Record<AdsPart, string>>;
  reload: (parts?: AdsPart[]) => Promise<void>;
}

export function useAdsStore(): AdsStore {
  const [zones, setZones] = useState<AdZoneDto[]>([]);
  const [advertisers, setAdvertisers] = useState<AdvertiserDto[]>([]);
  const [campaigns, setCampaigns] = useState<AdCampaignDto[]>([]);
  const [banners, setBanners] = useState<AdBannerDto[]>([]);
  const [overview, setOverview] = useState<AdsOverviewDto | null>(null);
  const [errors, setErrors] = useState<Partial<Record<AdsPart, string>>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const alive = useRef(true);
  const started = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reload = useCallback(async (parts: AdsPart[] = ALL_PARTS) => {
    const first = !started.current;
    started.current = true;
    if (first) setLoading(true);
    else setRefreshing(true);

    const results = await Promise.allSettled(
      parts.map((part) => adminFetch<unknown>(ENDPOINT[part])),
    );

    if (!alive.current) return;

    const nextErrors: Partial<Record<AdsPart, string>> = {};
    parts.forEach((part, index) => {
      const result = results[index];
      if (result.status === "rejected") {
        nextErrors[part] = errorMessage(result.reason, FALLBACK[part]);
        return;
      }
      const raw = result.value;
      if (part === "zones") setZones(toZones(raw));
      else if (part === "advertisers") setAdvertisers(toAdvertisers(raw));
      else if (part === "campaigns") setCampaigns(toCampaigns(raw));
      else if (part === "banners") setBanners(toBanners(raw));
      else setOverview(toOverview(raw));
    });

    setErrors((current) => {
      const merged = { ...current };
      for (const part of parts) {
        if (nextErrors[part]) merged[part] = nextErrors[part];
        else delete merged[part];
      }
      return merged;
    });

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    zones,
    advertisers,
    campaigns,
    banners,
    overview,
    loading,
    refreshing,
    errors,
    reload,
  };
}
