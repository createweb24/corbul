import type { AdZoneKey } from "@/lib/types";

/**
 * Dimensiunile zonelor, copie locală a seed-ului din `apps/api` (ADS-SPEC §1).
 *
 * Rolul lor este unul singur: să rezerve spațiul ÎNAINTE ca răspunsul rutei
 * de servire să sosească, ca pagina să nu sară (CLS). Dimensiunea reală vine
 * tot din API (`zone.width/height`) și o înlocuiește pe aceasta de îndată ce
 * răspunsul ajunge — aici nu se ia nicio decizie de conținut.
 */

export interface AdSize {
  width: number;
  height: number;
}

export const AD_ZONE_SIZES: Record<AdZoneKey, AdSize> = {
  header_leaderboard: { width: 970, height: 90 },
  home_infeed: { width: 970, height: 250 },
  article_inline: { width: 728, height: 90 },
  sidebar_top: { width: 300, height: 250 },
  sidebar_bottom: { width: 300, height: 600 },
};

/** Zonă adăugată din admin, necunoscută la compilare: un dreptunghi sobru. */
export const DEFAULT_AD_SIZE: AdSize = { width: 728, height: 90 };

export function adZoneSize(zoneKey: string): AdSize {
  return (
    AD_ZONE_SIZES[zoneKey as AdZoneKey] ??
    DEFAULT_AD_SIZE
  );
}
