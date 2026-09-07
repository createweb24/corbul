import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "../_lib/ogImage";

/**
 * Imaginea OpenGraph a panoului — `/admin/opengraph-image`.
 *
 * Panoul este un root layout paralel; imaginea-convenție de la rădăcină
 * (`app/opengraph-image.tsx`) se rezolvă la nivelul rădăcinii, unde nu
 * există `metadataBase`, și ar produce un URL `http://localhost:3000/…`.
 * Declarată în segmentul `admin`, imaginea se rezolvă cu `metadataBase`
 * din `admin/layout.tsx`. Exporturile sunt declarate direct (Next nu
 * recunoaște `runtime` re-exportat din alt fișier).
 */

export const runtime = "nodejs";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function AdminOpenGraphImage() {
  return renderOgImage("ro");
}
