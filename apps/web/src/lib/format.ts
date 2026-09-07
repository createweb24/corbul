/**
 * Formatări comune (date, numere, bani, cifre romane) + slugify.
 * Fusul orar este fixat la Europe/Chisinau ca server-ul și clientul
 * să producă exact același text (fără dezacorduri de hidratare).
 */

export const TIME_ZONE = "Europe/Chisinau";

export function localeTag(locale: string): string {
  return locale === "ru" ? "ru-RU" : "ro-RO";
}

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Implicit: „5 septembrie 2026" / «5 сентября 2026 г.».
 */
export function formatDate(
  iso: string | number | Date,
  locale: string,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(iso);
  if (!date) return "";
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
    ...opts,
  }).format(date);
}

/** „14:35" */
export function formatTime(
  iso: string | number | Date,
  locale: string,
  opts?: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(iso);
  if (!date) return "";
  return new Intl.DateTimeFormat(localeTag(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
    ...opts,
  }).format(date);
}

/** „5 septembrie 2026, 14:35" */
export function formatDateTime(
  iso: string | number | Date,
  locale: string,
): string {
  const date = toDate(iso);
  if (!date) return "";
  return `${formatDate(iso, locale)}, ${formatTime(iso, locale)}`;
}

/** „05.09.2026" — pentru tabele și admin */
export function formatDateShort(
  iso: string | number | Date,
  locale: string,
): string {
  const date = toDate(iso);
  if (!date) return "";
  return new Intl.DateTimeFormat(localeTag(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

const UNITS: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 31_536_000 },
  { unit: "month", seconds: 2_592_000 },
  { unit: "week", seconds: 604_800 },
  { unit: "day", seconds: 86_400 },
  { unit: "hour", seconds: 3_600 },
  { unit: "minute", seconds: 60 },
];

/**
 * „acum 3 ore" / «3 часа назад». `now` e injectabil pentru determinism.
 */
export function timeAgo(
  iso: string | number | Date,
  locale: string,
  now: Date = new Date(),
): string {
  const date = toDate(iso);
  if (!date) return "";
  const diffSeconds = (date.getTime() - now.getTime()) / 1000;
  const absolute = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat(localeTag(locale), {
    numeric: "auto",
  });

  for (const { unit, seconds } of UNITS) {
    if (absolute >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return rtf.format(Math.round(diffSeconds), "second");
}

export function formatNumber(
  value: number,
  locale: string,
  opts?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(localeTag(locale), opts).format(value);
}

/** 5430 → „5,4 mii" nu; păstrăm cifra exactă, dar grupată: „5 430". */
export function formatMoney(
  amount: number,
  locale: string,
  currency = "MDL",
  opts?: Intl.NumberFormatOptions,
): string {
  if (!Number.isFinite(amount)) return "—";
  const fraction = Number.isInteger(amount) ? 0 : 2;
  return new Intl.NumberFormat(localeTag(locale), {
    style: "currency",
    currency,
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
    ...opts,
  }).format(amount);
}

const ROMAN: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

/** 1 → „I", 4 → „IV", 2026 → „MMXXVI". Numerele ≤ 0 întorc „". */
export function romanNumeral(value: number): string {
  let remaining = Math.floor(value);
  if (!Number.isFinite(remaining) || remaining <= 0) return "";
  let out = "";
  for (const [amount, symbol] of ROMAN) {
    while (remaining >= amount) {
      out += symbol;
      remaining -= amount;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Slugify — aceleași reguli ca în apps/api/src/common/slugify.ts      */
/* ------------------------------------------------------------------ */

const ROMANIAN_MAP: Record<string, string> = {
  ă: "a",
  â: "a",
  î: "i",
  ș: "s",
  ş: "s",
  ț: "t",
  ţ: "t",
  Ă: "a",
  Â: "a",
  Î: "i",
  Ș: "s",
  Ş: "s",
  Ț: "t",
  Ţ: "t",
};

const CYRILLIC_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

const EXTRA_MAP: Record<string, string> = {
  ä: "a",
  ö: "o",
  ü: "u",
  ß: "ss",
  é: "e",
  è: "e",
  ê: "e",
  ç: "c",
  ñ: "n",
  "&": "-si-",
  "@": "-at-",
  "№": "nr",
};

export function transliterate(input: string): string {
  let out = "";
  for (const char of input) {
    const lower = char.toLowerCase();
    const mapped = ROMANIAN_MAP[char] ?? CYRILLIC_MAP[lower] ?? EXTRA_MAP[lower];
    out += mapped !== undefined ? mapped : char;
  }
  return out;
}

/** „Rețeaua offshore & licitațiile" → „reteaua-offshore-si-licitatiile" */
export function slugify(input: string): string {
  return transliterate(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

/** Scurtează un text la limita cuvântului, cu elipsă tipografică. */
export function truncate(input: string, max = 160): string {
  if (input.length <= max) return input;
  const cut = input.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Elimină etichetele HTML dintr-un fragment de conținut. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
