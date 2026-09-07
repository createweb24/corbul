import type { MetadataRoute } from "next";
import { siteUrl } from "./_lib/site";

/**
 * Panoul de administrare și paginile tranzacționale rămân în afara indexării;
 * restul site-ului este deschis, cu harta declarată explicit.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/*/abonament/succes"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
