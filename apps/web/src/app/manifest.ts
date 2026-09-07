import type { MetadataRoute } from "next";
import { DEFAULT_LOCALE, localePath, SITE_NAME } from "./_lib/site";

/**
 * `/manifest.webmanifest` — manifestul aplicației web (adăugare pe ecranul
 * de start, culoarea barei de sistem). Aceeași identitate ca `icon.svg`
 * și `apple-icon`: corb auriu pe obsidian.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — investigații și analiză`,
    short_name: SITE_NAME,
    description:
      "Portal de jurnalism de investigație și analiză economico-juridică din Republica Moldova.",
    lang: DEFAULT_LOCALE,
    start_url: localePath(DEFAULT_LOCALE),
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0d12",
    theme_color: "#0b0d12",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
