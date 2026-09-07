import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "./_lib/ogImage";

/**
 * Imaginea OpenGraph implicită (SPEC §7) — `/opengraph-image`.
 * Varianta cu prefix de limbă trăiește în `[locale]/opengraph-image.tsx`;
 * ea este cea folosită efectiv de paginile publice, pentru că middleware-ul
 * i18n redirecționează căile fără prefix.
 */

export const runtime = "nodejs";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return renderOgImage("ro");
}
