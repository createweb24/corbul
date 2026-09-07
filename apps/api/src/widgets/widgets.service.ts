import { Injectable, Logger } from '@nestjs/common';

import {
  CURRENCIES,
  FALLBACK_WEATHER,
  Rate,
  Weather,
  WeatherDay,
  Widgets,
} from './widgets.types';

/** Fusul orar al redacției — identic cu cel folosit de web (`lib/format.ts`). */
const TIME_ZONE = 'Europe/Chisinau';

/** Cât timp ținem un răspuns bun în memorie (SPEC: 15 minute). */
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Un răspuns de rezervă se ține mult mai puțin, ca o pană de rețea
 * de câteva secunde să nu blocheze widgeturile un sfert de oră.
 */
const STALE_TTL_MS = 2 * 60 * 1000;

/** Timeout pentru fiecare sursă externă. */
const FETCH_TIMEOUT_MS = 5000;

/** Câte zile în urmă încercăm dacă BNM nu publică pe data cerută (weekend / sărbători). */
const BNM_MAX_BACKTRACK = 5;

const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast' +
  '?latitude=47.0105&longitude=28.8638' +
  '&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m' +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
  '&timezone=Europe%2FChisinau&forecast_days=4';

interface OpenMeteoCurrent {
  temperature_2m?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  relative_humidity_2m?: number;
}

interface OpenMeteoDaily {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
}

interface OpenMeteoResponse {
  current?: OpenMeteoCurrent;
  daily?: OpenMeteoDaily;
}

interface CacheEntry {
  data: Widgets;
  expiresAt: number;
}

/** Un buletin BNM parsat: cursuri pe cod + data publicării (`YYYY-MM-DD`). */
interface BnmBulletin {
  rates: Map<string, number>;
  date: string;
}

/** Cursurile finale + data buletinului din care provine `rate`. */
interface RatesBulletin {
  rates: Rate[];
  date: string;
}

/** Rezultatul parsării XML-ului BNM; `date` lipsește dacă atributul nu există. */
export interface ParsedBnmXml {
  rates: Map<string, number>;
  date: string | null;
}

@Injectable()
export class WidgetsService {
  private readonly logger = new Logger(WidgetsService.name);

  private cache: CacheEntry | null = null;

  /** Cererile concurente se atașează la aceeași reîmprospătare. */
  private inFlight: Promise<Widgets> | null = null;

  /**
   * Sumarul de widgeturi (vreme Chișinău + curs BNM).
   * NU aruncă niciodată: la orice eroare întoarce valorile de rezervă
   * marcate cu `stale: true`.
   */
  async summary(): Promise<Widgets> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.data;
    }
    if (this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = this.refresh()
      .then((data) => {
        this.cache = {
          data,
          expiresAt: Date.now() + (data.stale ? STALE_TTL_MS : CACHE_TTL_MS),
        };
        return data;
      })
      .catch((error: unknown) => {
        // Plasă de siguranță: `refresh` este deja defensiv, dar contractul
        // spune „nu aruncă niciodată".
        this.logger.error(
          `Reîmprospătarea widgeturilor a eșuat neașteptat: ${describe(error)}`,
        );
        const data = this.fallback();
        this.cache = { data, expiresAt: Date.now() + STALE_TTL_MS };
        return data;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  /* ---------------------------------------------------------------- */
  /* Reîmprospătare                                                    */
  /* ---------------------------------------------------------------- */

  private async refresh(): Promise<Widgets> {
    // Promise.allSettled: căderea unei surse nu o compromite pe cealaltă.
    const [weatherResult, ratesResult] = await Promise.allSettled([
      this.fetchWeather(),
      this.fetchRates(),
    ]);

    const weather =
      weatherResult.status === 'fulfilled' ? weatherResult.value : null;
    const bulletin =
      ratesResult.status === 'fulfilled' ? ratesResult.value : null;
    const rates = bulletin?.rates ?? null;

    if (weatherResult.status === 'rejected') {
      this.logger.warn(`Open-Meteo indisponibil: ${describe(weatherResult.reason)}`);
    }
    if (ratesResult.status === 'rejected') {
      this.logger.warn(`BNM indisponibil: ${describe(ratesResult.reason)}`);
    }

    const stale = weather === null || rates === null;
    if (stale) {
      this.logger.warn(
        'Widgeturi servite parțial din valorile de rezervă (stale = true)',
      );
    }

    return {
      weather: weather ?? this.fallbackWeather(),
      rates: rates ?? this.fallbackRates(),
      fetchedAt: new Date().toISOString(),
      stale,
      // Data buletinului BNM real; lipsește când cursul vine din rezervă.
      ...(bulletin ? { ratesDate: bulletin.date } : {}),
    };
  }

  /* ---------------------------------------------------------------- */
  /* Vreme — Open-Meteo                                                */
  /* ---------------------------------------------------------------- */

  private async fetchWeather(): Promise<Weather | null> {
    const raw = await this.fetchText(OPEN_METEO_URL, 'application/json');
    if (raw === null) return null;

    let parsed: OpenMeteoResponse;
    try {
      parsed = JSON.parse(raw) as OpenMeteoResponse;
    } catch {
      this.logger.warn('Răspuns Open-Meteo invalid (JSON nevalid)');
      return null;
    }

    const current = parsed.current;
    const daily = parsed.daily;
    if (!current || !daily) return null;

    const tempC = finite(current.temperature_2m);
    const code = finite(current.weather_code);
    if (tempC === null || code === null) return null;

    const times = daily.time ?? [];
    const codes = daily.weather_code ?? [];
    const maxes = daily.temperature_2m_max ?? [];
    const mins = daily.temperature_2m_min ?? [];

    const days: WeatherDay[] = [];
    for (let i = 0; i < 4; i += 1) {
      const date = times[i];
      const dayCode = finite(codes[i]);
      const max = finite(maxes[i]);
      const min = finite(mins[i]);
      if (typeof date !== 'string' || dayCode === null || max === null || min === null) {
        break;
      }
      days.push({
        date,
        code: Math.round(dayCode),
        min: Math.round(min),
        max: Math.round(max),
      });
    }
    if (days.length < 4) {
      this.logger.warn('Open-Meteo a întors mai puțin de 4 zile de prognoză');
      return null;
    }

    return {
      tempC: Math.round(tempC),
      code: Math.round(code),
      windKmh: Math.round(finite(current.wind_speed_10m) ?? 0),
      humidity: Math.round(finite(current.relative_humidity_2m) ?? 0),
      days,
    };
  }

  /* ---------------------------------------------------------------- */
  /* Curs valutar — BNM                                                */
  /* ---------------------------------------------------------------- */

  private async fetchRates(): Promise<RatesBulletin | null> {
    const today = new Date();

    const current = await this.fetchBnmNearest(today);
    if (!current) return null;

    // `prev` = cursul de acum 3 zile (SPEC).
    const previous = await this.fetchBnmNearest(addDays(today, -3));

    const rates: Rate[] = [];
    for (const currency of CURRENCIES) {
      const rate = current.rates.get(currency.code);
      if (rate === undefined) {
        this.logger.warn(`BNM nu a publicat cursul pentru ${currency.code}`);
        return null;
      }
      const prev = previous?.rates.get(currency.code);
      rates.push({
        code: currency.code,
        nameRo: currency.nameRo,
        nameRu: currency.nameRu,
        rate,
        prev: prev ?? rate,
      });
    }
    return { rates, date: current.date };
  }

  /**
   * BNM nu publică în weekend / sărbători: coborâm zi cu zi până găsim
   * un buletin cu valute (maxim `BNM_MAX_BACKTRACK` încercări).
   */
  private async fetchBnmNearest(from: Date): Promise<BnmBulletin | null> {
    for (let back = 0; back < BNM_MAX_BACKTRACK; back += 1) {
      const day = addDays(from, -back);
      const url =
        'https://www.bnm.md/ro/official_exchange_rates?get_xml=1&date=' +
        bnmDate(day);
      const xml = await this.fetchText(url, 'application/xml');
      if (xml === null) continue;
      const parsed = parseBnmXml(xml);
      if (parsed.rates.size > 0) {
        // Dacă XML-ul nu are atributul `Date`, data cerută e cea mai bună estimare.
        return { rates: parsed.rates, date: parsed.date ?? isoDate(day) };
      }
    }
    return null;
  }

  /* ---------------------------------------------------------------- */
  /* Utilitare de rețea                                                */
  /* ---------------------------------------------------------------- */

  /** GET cu AbortController de 5 s. Întoarce `null` la orice problemă. */
  private async fetchText(url: string, accept: string): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: accept,
          'User-Agent': 'Corbul.md/1.0 (+https://corbul.md)',
        },
      });
      if (!response.ok) {
        this.logger.warn(`${url} a răspuns ${response.status}`);
        return null;
      }
      return await response.text();
    } catch (error: unknown) {
      this.logger.warn(`Cerere eșuată către ${url}: ${describe(error)}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Valori de rezervă                                                 */
  /* ---------------------------------------------------------------- */

  private fallback(): Widgets {
    return {
      weather: this.fallbackWeather(),
      rates: this.fallbackRates(),
      fetchedAt: new Date().toISOString(),
      stale: true,
    };
  }

  private fallbackWeather(): Weather {
    const today = new Date();
    return {
      tempC: FALLBACK_WEATHER.tempC,
      code: FALLBACK_WEATHER.code,
      windKmh: FALLBACK_WEATHER.windKmh,
      humidity: FALLBACK_WEATHER.humidity,
      days: FALLBACK_WEATHER.days.map((day, index) => ({
        date: isoDate(addDays(today, index)),
        code: day.code,
        min: day.min,
        max: day.max,
      })),
    };
  }

  private fallbackRates(): Rate[] {
    return CURRENCIES.map((currency) => ({
      code: currency.code,
      nameRo: currency.nameRo,
      nameRu: currency.nameRu,
      rate: currency.rate,
      prev: currency.prev,
    }));
  }
}

/* ------------------------------------------------------------------ */
/* Funcții pure                                                        */
/* ------------------------------------------------------------------ */

/**
 * Parsează buletinul BNM cu expresii regulate pe elementele `<Valute>`.
 * `rate = Value / Nominal` (BNM cotează RUB/UAH la 10, JPY la 100 etc.).
 * Data vine din `<ValCurs Date="DD.MM.YYYY">`, convertită la `YYYY-MM-DD`.
 */
export function parseBnmXml(xml: string): ParsedBnmXml {
  const out = new Map<string, number>();
  const date = parseBnmDate(xml);
  const blocks = xml.match(/<Valute\b[^>]*>[\s\S]*?<\/Valute>/gi);
  if (!blocks) return { rates: out, date };

  for (const block of blocks) {
    const code = tag(block, 'CharCode');
    const nominalRaw = tag(block, 'Nominal');
    const valueRaw = tag(block, 'Value');
    if (!code || !valueRaw) continue;

    const nominal = Number(nominalRaw?.replace(',', '.') ?? '1');
    const value = Number(valueRaw.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) continue;

    const divisor = Number.isFinite(nominal) && nominal > 0 ? nominal : 1;
    out.set(code.toUpperCase(), round(value / divisor, 4));
  }
  return { rates: out, date };
}

/** `<ValCurs Date="07.09.2026">` → `2026-09-07`; `null` dacă lipsește. */
export function parseBnmDate(xml: string): string | null {
  const match = xml.match(/<ValCurs\b[^>]*\bDate="(\d{2})\.(\d{2})\.(\d{4})"/i);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function tag(block: string, name: string): string | null {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? match[1].trim() : null;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function finite(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Componentele calendaristice ale unei date în fusul Europe/Chisinau. */
function chisinauParts(date: Date): { year: string; month: string; day: string } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA produce `YYYY-MM-DD`.
  const [year, month, day] = formatter.format(date).split('-');
  return { year, month, day };
}

/** `DD.MM.YYYY` — formatul cerut de parametrul `date` al BNM. */
function bnmDate(date: Date): string {
  const { year, month, day } = chisinauParts(date);
  return `${day}.${month}.${year}`;
}

/** `YYYY-MM-DD` — formatul folosit de Open-Meteo și de web. */
function isoDate(date: Date): string {
  const { year, month, day } = chisinauParts(date);
  return `${year}-${month}-${day}`;
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}
