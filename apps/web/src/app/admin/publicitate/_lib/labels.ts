/**
 * Etichete în română, tonuri de badge și micile conversii folosite de toate
 * filele: bani ↔ lei, procente, validări de formular.
 */

import type { BadgeTone } from "../../_components/ui";
import type { AdCampaignStatus } from "./types";

export const STATUS_LABEL: Record<AdCampaignStatus, string> = {
  DRAFT: "Ciornă",
  PENDING_PAYMENT: "Așteaptă plata",
  ACTIVE: "Activă",
  PAUSED: "În pauză",
  COMPLETED: "Încheiată",
  CANCELLED: "Anulată",
};

export const STATUS_TONE: Record<AdCampaignStatus, BadgeTone> = {
  DRAFT: "neutral",
  PENDING_PAYMENT: "warn",
  ACTIVE: "ok",
  PAUSED: "warn",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

/* ------------------------------------------------------------------ */
/* Bani                                                                */
/* ------------------------------------------------------------------ */

/** 5 000 000 bani → „50000" (lei, gata de pus într-un input). */
export function baniToLeiInput(bani: number | null): string {
  if (bani === null || !Number.isFinite(bani)) return "";
  const lei = bani / 100;
  return Number.isInteger(lei) ? String(lei) : lei.toFixed(2);
}

/** „50000" / „50 000,50" → 5 000 050 bani. `null` dacă textul e gol. */
export function leiInputToBani(value: string): number | null | "invalid" {
  const text = value.replace(/\s+/g, "").replace(",", ".");
  if (!text) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) return "invalid";
  return Math.round(parsed * 100);
}

/** CTR în procente, cu o zecimală: 0.0234 sau 2.34 → „2,3 %". */
export function formatCtr(clicks: number, impressions: number): string {
  if (impressions <= 0) return "—";
  const ratio = (clicks / impressions) * 100;
  return `${ratio.toFixed(ratio >= 10 ? 1 : 2).replace(".", ",")} %`;
}

/* ------------------------------------------------------------------ */
/* Validări                                                            */
/* ------------------------------------------------------------------ */

/** Adresă absolută `http(s)://…` — regula din DTO-urile API-ului. */
export function isHttpUrl(value: string): boolean {
  if (!/^https?:\/\/\S+$/i.test(value.trim())) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Sursă de imagine acceptată: absolută sau cale internă `/…`. */
export function isImageSource(value: string): boolean {
  const text = value.trim();
  if (!text) return false;
  return text.startsWith("/") || isHttpUrl(text);
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** Întreg în interval; `null` dacă textul nu e un întreg valid. */
export function intInRange(value: string, min: number, max: number): number | null {
  const text = value.replace(/\s+/g, "");
  if (!text) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

/** Cheia unei zone: litere mici, cifre și liniuțe de subliniere. */
export function isZoneKey(value: string): boolean {
  return /^[a-z][a-z0-9_]{1,48}$/.test(value.trim());
}
