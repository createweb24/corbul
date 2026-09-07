import { safeFetch } from "@/lib/api";
import type { Locale } from "@/lib/types";

/**
 * Zonele de banner, citite din `GET /api/ads/zones` (ADS-SPEC §2).
 *
 * Contractul public al API-ului: `{key, name, width, height, priceMonthly,
 * order}`, doar zonele active, ordonate după `order`. `priceMonthly` este
 * exprimat în bani (lei × 100).
 *
 * Tipul rămâne local acestei secțiuni: `AdZoneDto` din `lib/types.ts` este
 * proprietatea AGENT-ADS-WEB, iar paginile de serviciu nu trebuie să depindă
 * de ordinea în care se termină munca celorlalți agenți.
 *
 * Dacă API-ul nu răspunde (sau modulul de publicitate încă nu e pornit),
 * întoarcem grila din seed — pagina comercială trebuie să arate tarifele
 * chiar și cu serverul oprit.
 */

export interface AdZoneInfo {
  key: string;
  name: string;
  width: number;
  height: number;
  /** în bani (lei × 100); `null` dacă zona nu are preț public */
  priceMonthly: number | null;
  order: number;
}

/** Denumirile zonelor în cele două limbi — API-ul le are doar în română. */
const ZONE_NAMES: Record<string, { ro: string; ru: string }> = {
  header_leaderboard: {
    ro: "Bandă sub antet",
    ru: "Полоса под шапкой сайта",
  },
  home_infeed: {
    ro: "În flux, prima pagină",
    ru: "В ленте главной страницы",
  },
  article_inline: {
    ro: "În corpul articolului",
    ru: "В теле статьи",
  },
  sidebar_top: {
    ro: "Coloană laterală, sus",
    ru: "Боковая колонка, вверху",
  },
  sidebar_bottom: {
    ro: "Coloană laterală, jos",
    ru: "Боковая колонка, внизу",
  },
};

/** Ce vede cititorul despre fiecare zonă, dincolo de dimensiune și preț. */
const ZONE_NOTES: Record<string, { ro: string; ru: string }> = {
  header_leaderboard: {
    ro: "Prima suprafață de pe pagină, imediat sub banda de ultimă oră. Apare pe toate paginile de rubrică.",
    ru: "Первая поверхность на странице, сразу под лентой срочных новостей. Показывается на всех рубричных страницах.",
  },
  home_infeed: {
    ro: "Între benzile tematice ale primei pagini, în fluxul de lectură. Format mare, o singură apariție per sesiune.",
    ru: "Между тематическими блоками главной страницы, внутри потока чтения. Крупный формат, один показ за сессию.",
  },
  article_inline: {
    ro: "După al treilea paragraf al articolului, unde cititorul este deja implicat în text.",
    ru: "После третьего абзаца статьи — там, где читатель уже втянут в текст.",
  },
  sidebar_top: {
    ro: "Deasupra widgetului de vreme, în coloana laterală vizibilă pe articole și rubrici.",
    ru: "Над виджетом погоды, в боковой колонке, видимой в статьях и рубриках.",
  },
  sidebar_bottom: {
    ro: "Sub „Cele mai citite”, la finalul coloanei laterale. Formatul vertical, cu cea mai lungă expunere.",
    ru: "Под блоком «Самое читаемое», в конце боковой колонки. Вертикальный формат с самым долгим контактом.",
  },
};

/** Grila din seed (ADS-SPEC §1) — plasa de siguranță cu API-ul oprit. */
const FALLBACK_ZONES: AdZoneInfo[] = [
  {
    key: "header_leaderboard",
    name: "Bandă sub antet",
    width: 970,
    height: 90,
    priceMonthly: 5000000,
    order: 1,
  },
  {
    key: "home_infeed",
    name: "În flux, prima pagină",
    width: 970,
    height: 250,
    priceMonthly: 4500000,
    order: 2,
  },
  {
    key: "article_inline",
    name: "În corpul articolului",
    width: 728,
    height: 90,
    priceMonthly: 3500000,
    order: 3,
  },
  {
    key: "sidebar_top",
    name: "Coloană laterală, sus",
    width: 300,
    height: 250,
    priceMonthly: 3000000,
    order: 4,
  },
  {
    key: "sidebar_bottom",
    name: "Coloană laterală, jos",
    width: 300,
    height: 600,
    priceMonthly: 4000000,
    order: 5,
  },
];

function isZone(value: unknown): value is AdZoneInfo {
  if (!value || typeof value !== "object") return false;
  const zone = value as Record<string, unknown>;
  return (
    typeof zone.key === "string" &&
    typeof zone.width === "number" &&
    typeof zone.height === "number"
  );
}

/**
 * Zonele active, ordonate. Nu aruncă niciodată: la orice eroare de rețea
 * sau răspuns neașteptat întoarce grila din seed.
 */
export async function getAdZones(): Promise<AdZoneInfo[]> {
  const list = await safeFetch<unknown[]>("/ads/zones", { revalidate: 3600 });
  const zones = Array.isArray(list) ? list.filter(isZone) : [];
  const source = zones.length > 0 ? zones : FALLBACK_ZONES;
  return [...source].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function zoneName(zone: AdZoneInfo, locale: Locale): string {
  const names = ZONE_NAMES[zone.key];
  if (!names) return zone.name;
  return locale === "ru" ? names.ru : names.ro;
}

export function zoneNote(zone: AdZoneInfo, locale: Locale): string | null {
  const notes = ZONE_NOTES[zone.key];
  if (!notes) return null;
  return locale === "ru" ? notes.ru : notes.ro;
}

/** `5000000` bani → `50000` lei. `null` dacă zona nu are preț public. */
export function zonePriceMdl(zone: AdZoneInfo): number | null {
  if (typeof zone.priceMonthly !== "number" || zone.priceMonthly <= 0) {
    return null;
  }
  return Math.round(zone.priceMonthly / 100);
}
