import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ro"],
  defaultLocale: "ro",
  // o singură limbă, cu prefix explicit: /ro/...
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
