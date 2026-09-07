/**
 * Contractul de date pentru `GET /api/widgets` (SPEC §4).
 * Formele sunt LITERALE — `apps/web/src/lib/types.ts` le oglindește
 * ca `WeatherDto` / `RateDto` / `WidgetsDto`.
 */

export interface WeatherDay {
  /** ISO `YYYY-MM-DD` */
  date: string;
  /** cod meteo WMO */
  code: number;
  min: number;
  max: number;
}

export interface Weather {
  tempC: number;
  code: number;
  windKmh: number;
  humidity: number;
  /** exact 4 zile; days[0] = azi */
  days: WeatherDay[];
}

export interface Rate {
  code: string;
  nameRo: string;
  nameRu: string;
  /** MDL pentru 1 unitate de valută */
  rate: number;
  /** cursul de referință anterior (pentru săgeata ↑↓) */
  prev: number;
}

export interface Widgets {
  weather: Weather;
  rates: Rate[];
  fetchedAt: string;
  /** true dacă cel puțin una dintre surse a căzut pe valorile de rezervă */
  stale: boolean;
  /**
   * Data buletinului BNM efectiv folosit pentru `rate` (`YYYY-MM-DD`, din
   * atributul `Date` al XML-ului). Lipsește când cursul vine din rezervă.
   */
  ratesDate?: string;
}

/** Valutele afișate, în ordinea cerută de SPEC. */
export interface CurrencyMeta {
  code: string;
  nameRo: string;
  nameRu: string;
  /** curs de rezervă (MDL / 1 unitate) */
  rate: number;
  /** curs anterior de rezervă */
  prev: number;
}

export const CURRENCIES: readonly CurrencyMeta[] = [
  {
    code: 'EUR',
    nameRo: 'Euro',
    nameRu: 'Евро',
    rate: 19.42,
    prev: 19.38,
  },
  {
    code: 'USD',
    nameRo: 'Dolar SUA',
    nameRu: 'Доллар США',
    rate: 16.61,
    prev: 16.55,
  },
  {
    code: 'RON',
    nameRo: 'Leu românesc',
    nameRu: 'Румынский лей',
    rate: 3.9,
    prev: 3.89,
  },
  {
    code: 'RUB',
    nameRo: 'Rublă rusească',
    nameRu: 'Российский рубль',
    rate: 0.205,
    prev: 0.207,
  },
  {
    code: 'UAH',
    nameRo: 'Grivnă ucraineană',
    nameRu: 'Украинская гривна',
    rate: 0.401,
    prev: 0.399,
  },
  {
    code: 'GBP',
    nameRo: 'Liră sterlină',
    nameRu: 'Фунт стерлингов',
    rate: 22.41,
    prev: 22.3,
  },
] as const;

/** Vremea de rezervă din SPEC: 21 °C, cod WMO 2 (parțial noros). */
export const FALLBACK_WEATHER = {
  tempC: 21,
  code: 2,
  windKmh: 11,
  humidity: 58,
  /** tipare pentru cele 4 zile: [cod, min, max] */
  days: [
    { code: 2, min: 12, max: 21 },
    { code: 3, min: 11, max: 20 },
    { code: 1, min: 13, max: 22 },
    { code: 61, min: 10, max: 19 },
  ],
} as const;
