import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";
import type { WeatherDto } from "@/lib/types";

/**
 * Vremea la Chișinău — starea curentă + 4 zile.
 * Iconițele sunt SVG scrise de mână, pe grupele de coduri WMO
 * (fără emoji, fără librării).
 *
 * Datele vin dintr-un singur fetch server-side către `/api/widgets`
 * și se transmit ca props (SPEC §6).
 */

/* ------------------------------------------------------------------ */
/* Coduri WMO → iconiță + etichetă                                     */
/* ------------------------------------------------------------------ */

export type WeatherIconName =
  | "clear"
  | "partly"
  | "overcast"
  | "fog"
  | "rain"
  | "showers"
  | "snow"
  | "thunder";

/** Cheia din `widgets.weather.codes.*` pentru un cod WMO. */
export function weatherLabelKey(code: number): string {
  switch (code) {
    case 0:
      return "clear";
    case 1:
      return "mainlyClear";
    case 2:
      return "partly";
    case 3:
      return "overcast";
    case 45:
    case 48:
      return "fog";
    case 51:
    case 53:
    case 55:
      return "drizzle";
    case 56:
    case 57:
      return "freezingDrizzle";
    case 61:
    case 63:
    case 65:
      return "rain";
    case 66:
    case 67:
      return "freezingRain";
    case 71:
    case 73:
    case 75:
      return "snow";
    case 77:
      return "snowGrains";
    case 80:
    case 81:
    case 82:
      return "showers";
    case 85:
    case 86:
      return "snowShowers";
    case 95:
      return "thunder";
    case 96:
    case 99:
      return "thunderHail";
    default:
      return "unknown";
  }
}

/** Grupa vizuală (una din cele 8 iconițe) pentru un cod WMO. */
export function weatherIconName(code: number): WeatherIconName {
  if (code <= 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code === 85 || code === 86) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 95) return "thunder";
  return "overcast";
}

const CLOUD =
  "M17.2 18.6H7.4a4.3 4.3 0 0 1-.5-8.57 6 6 0 0 1 11.44 1.05 3.83 3.83 0 0 1-1.14 7.52Z";

const SUN_RAYS: [number, number, number, number][] = [
  [12, 1.6, 12, 3.6],
  [12, 20.4, 12, 22.4],
  [1.6, 12, 3.6, 12],
  [20.4, 12, 22.4, 12],
  [4.7, 4.7, 6.1, 6.1],
  [17.9, 17.9, 19.3, 19.3],
  [19.3, 4.7, 17.9, 6.1],
  [6.1, 17.9, 4.7, 19.3],
];

export interface WeatherIconProps {
  code: number;
  size?: number;
  className?: string;
  /** etichetă textuală; dacă lipsește, iconița e pur decorativă */
  label?: string;
}

/**
 * Iconiță de vreme, desenată în linie (`currentColor`), pe grupele WMO.
 * Soarele primește accentul auriu, restul moștenește culoarea textului.
 */
export function WeatherIcon({
  code,
  size = 24,
  className,
  label,
}: WeatherIconProps) {
  const name = weatherIconName(code);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {name === "clear" && (
        <g className="text-gold" stroke="currentColor">
          <circle cx="12" cy="12" r="4.4" />
          {SUN_RAYS.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
      )}

      {name === "partly" && (
        <>
          <g className="text-gold" stroke="currentColor">
            <circle cx="8.6" cy="8" r="3.1" />
            <line x1="8.6" y1="1.9" x2="8.6" y2="3.3" />
            <line x1="2.5" y1="8" x2="3.9" y2="8" />
            <line x1="4.3" y1="3.7" x2="5.3" y2="4.7" />
            <line x1="12.9" y1="3.7" x2="11.9" y2="4.7" />
          </g>
          <path d={CLOUD} />
        </>
      )}

      {name === "overcast" && (
        <>
          <path d={CLOUD} />
          <path d="M5.4 8.1a5.1 5.1 0 0 1 8.4-2.6" opacity={0.55} />
        </>
      )}

      {name === "fog" && (
        <>
          <path d="M16.9 14.4H7.4a4.3 4.3 0 0 1-.5-8.57 6 6 0 0 1 11.44 1.05 3.83 3.83 0 0 1-1.44 7.52Z" />
          <line x1="4.2" y1="17.8" x2="19.8" y2="17.8" />
          <line x1="6.6" y1="20.8" x2="17.4" y2="20.8" />
        </>
      )}

      {name === "rain" && (
        <>
          <path d="M16.9 14.6H7.4a4.3 4.3 0 0 1-.5-8.57 6 6 0 0 1 11.44 1.05 3.83 3.83 0 0 1-1.44 7.52Z" />
          <line x1="8.6" y1="17.6" x2="7.6" y2="20.4" />
          <line x1="12.4" y1="17.6" x2="11.4" y2="20.4" />
          <line x1="16.2" y1="17.6" x2="15.2" y2="20.4" />
        </>
      )}

      {name === "showers" && (
        <>
          <path d="M16.9 13.8H7.4a4.3 4.3 0 0 1-.5-8.57 6 6 0 0 1 11.44 1.05 3.83 3.83 0 0 1-1.44 7.52Z" />
          <line x1="8.4" y1="16.4" x2="6.5" y2="21.2" />
          <line x1="13" y1="16.4" x2="11.1" y2="21.2" />
          <line x1="17.6" y1="16.4" x2="15.7" y2="21.2" />
        </>
      )}

      {name === "snow" && (
        <>
          <path d="M16.9 14.2H7.4a4.3 4.3 0 0 1-.5-8.57 6 6 0 0 1 11.44 1.05 3.83 3.83 0 0 1-1.44 7.52Z" />
          <g>
            <line x1="8.4" y1="16.9" x2="8.4" y2="20.5" />
            <line x1="6.8" y1="17.8" x2="10" y2="19.6" />
            <line x1="10" y1="17.8" x2="6.8" y2="19.6" />
          </g>
          <g>
            <line x1="15.6" y1="16.9" x2="15.6" y2="20.5" />
            <line x1="14" y1="17.8" x2="17.2" y2="19.6" />
            <line x1="17.2" y1="17.8" x2="14" y2="19.6" />
          </g>
        </>
      )}

      {name === "thunder" && (
        <>
          <path d="M16.9 13.6H7.4a4.3 4.3 0 0 1-.5-8.57 6 6 0 0 1 11.44 1.05 3.83 3.83 0 0 1-1.44 7.52Z" />
          <path
            d="M13.4 15.4 9.6 20.1h3.1l-1.1 3.1 4.4-5.2h-3.1l.9-2.6Z"
            className="text-gold"
            stroke="currentColor"
            strokeWidth={1.25}
          />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Widgetul                                                            */
/* ------------------------------------------------------------------ */

export interface WeatherWidgetProps {
  weather: WeatherDto | null;
  /** true dacă sursa externă nu a răspuns (valori de rezervă) */
  stale?: boolean;
}

export function WeatherWidget({ weather, stale = false }: WeatherWidgetProps) {
  const t = useTranslations("widgets");
  const locale = useLocale();

  if (!weather) return null;

  const days = weather.days.slice(0, 4);
  const currentLabel = t(`weather.codes.${weatherLabelKey(weather.code)}`);

  return (
    <section
      className="border border-line bg-coal"
      aria-labelledby="widget-weather-title"
    >
      <div className="h-px bg-gradient-to-r from-gold/60 via-gold/10 to-transparent" />

      <header className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
        <h2
          id="widget-weather-title"
          className="font-[family-name:var(--font-display)] text-[16px] font-semibold tracking-tight text-ivory"
        >
          {t("weather.title")}
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-mist">
          {stale ? t("stale") : t("weather.city")}
        </span>
      </header>

      <div className="flex items-center gap-4 px-4 py-4">
        <WeatherIcon code={weather.code} size={46} className="text-fog" />
        <div className="min-w-0">
          <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-mist">
            {t("weather.now")}
          </p>
          <p className="flex items-baseline gap-1 font-[family-name:var(--font-display)] text-[34px] leading-none font-semibold text-ivory">
            {Math.round(weather.tempC)}
            <span className="text-[18px] text-gold">°C</span>
          </p>
          <p className="mt-1 truncate text-[13px] text-fog">{currentLabel}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-y border-line bg-line text-[12px]">
        <div className="flex items-baseline justify-between bg-coal px-4 py-2">
          <dt className="text-mist">{t("weather.wind")}</dt>
          <dd className="font-medium text-fog tabular-nums">
            {Math.round(weather.windKmh)} {t("weather.kmh")}
          </dd>
        </div>
        <div className="flex items-baseline justify-between bg-coal px-4 py-2">
          <dt className="text-mist">{t("weather.humidity")}</dt>
          <dd className="font-medium text-fog tabular-nums">
            {Math.round(weather.humidity)}%
          </dd>
        </div>
      </dl>

      <div className="px-4 py-3">
        <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-mist">
          {t("weather.forecast")}
        </p>
        <ul className="grid grid-cols-4 gap-1">
          {days.map((day, index) => (
            <li
              key={day.date}
              className="flex flex-col items-center gap-1 rounded-[var(--radius)] px-1 py-2 text-center transition-colors duration-200 hover:bg-coal-2"
            >
              <span className="text-[10px] uppercase tracking-[0.1em] text-mist">
                {index === 0
                  ? t("weather.today")
                  : formatDate(day.date, locale, {
                      weekday: "short",
                      day: undefined,
                      month: undefined,
                      year: undefined,
                    })}
              </span>
              <WeatherIcon
                code={day.code}
                size={22}
                className="text-fog"
                label={t(`weather.codes.${weatherLabelKey(day.code)}`)}
              />
              <span className="text-[12px] tabular-nums text-ivory">
                {Math.round(day.max)}°
              </span>
              <span className="text-[11px] tabular-nums text-mist">
                {Math.round(day.min)}°
              </span>
            </li>
          ))}
        </ul>
      </div>

      {stale ? (
        <p className="border-t border-line px-4 py-2 text-[11px] text-mist">
          {t("staleNote")}
        </p>
      ) : null}
    </section>
  );
}

export default WeatherWidget;
