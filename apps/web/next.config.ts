import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Într-un monorepo, Turbopack trebuie ancorat explicit la rădăcină,
  // altfel o alege greșit din lockfile-uri străine.
  turbopack: {
    root: path.join(process.cwd(), "../.."),
  },
  poweredByHeader: false,
  async redirects() {
    return [
      // browserele cer /favicon.ico din oficiu; marca este SVG (SPEC §0.7),
      // servită de ruta-convenție `app/icon.svg`
      { source: "/favicon.ico", destination: "/icon.svg", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
