/**
 * Conversii între ISO 8601 și valoarea unui `<input type="datetime-local">`,
 * ancorate în fusul redacției (Europe/Chișinău).
 *
 * `datetime-local` nu are fus orar: browserul îl interpretează în fusul
 * mașinii. Redacția lucrează pe ora Chișinăului, iar restul aplicației
 * formatează tot cu `TIME_ZONE`, deci facem conversia explicit — altfel un
 * redactor aflat în altă zonă ar publica articole decalate cu câteva ore.
 */

import { TIME_ZONE } from "@/lib/format";

const PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface Wall {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function wallClock(date: Date): Wall {
  const parts = PARTS.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((part) => part.type === type);
    return found ? Number(found.value) : 0;
  };
  // `en-GB` cu hour12:false poate produce „24" pentru miezul nopții.
  const hour = get("hour") % 24;
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
    second: get("second"),
  };
}

/** Decalajul fusului redacției față de UTC, în minute, la momentul dat. */
function offsetMinutes(date: Date): number {
  const wall = wallClock(date);
  const asUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );
  return (asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60_000;
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0");
}

/** ISO → „2026-09-05T14:35" (ora Chișinăului). Șir gol la date invalide. */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const wall = wallClock(date);
  return (
    `${pad(wall.year, 4)}-${pad(wall.month)}-${pad(wall.day)}` +
    `T${pad(wall.hour)}:${pad(wall.minute)}`
  );
}

/**
 * „2026-09-05T14:35" (ora Chișinăului) → ISO UTC.
 * Întoarce `null` dacă valoarea nu e o dată validă.
 *
 * Decalajul se aplică în doi pași: prima estimare folosește decalajul de la
 * momentul aproximativ, a doua îl recalculează pe rezultat — corect și în
 * ziua schimbării orei de vară.
 */
export function localInputToIso(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    value.trim(),
  );
  if (!match) return null;

  const [, y, mo, d, h, mi, s] = match;
  const asUtc = Date.UTC(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    s ? Number(s) : 0,
  );
  if (Number.isNaN(asUtc)) return null;

  let timestamp = asUtc - offsetMinutes(new Date(asUtc)) * 60_000;
  timestamp = asUtc - offsetMinutes(new Date(timestamp)) * 60_000;

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Momentul curent, gata de pus într-un `datetime-local`. */
export function nowLocalInput(): string {
  return isoToLocalInput(new Date().toISOString());
}
