import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // exclude API-ul, panoul de administrare (doar RO, în afara [locale]),
  // fișierele interne Next.js și rutele-fișier reale de la rădăcină
  // (pictograme, OG, sitemap, robots, manifest, redirectul RSS).
  // Orice altă cale fără prefix de limbă — inclusiv cele cu extensie, ex.
  // `/foo.txt`, `/.env` de la scanere — trece prin middleware și ajunge la
  // 404-ul tradus din `[locale]/[...rest]`, nu la segmentul `[locale]`
  // (unde ar fi doar o „limbă" necunoscută, cu eroare internă în jurnal).
  matcher:
    "/((?!api|admin|_next|_vercel|icon|apple-icon|opengraph-image|favicon\\.ico|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|rss\\.xml).*)",
};
