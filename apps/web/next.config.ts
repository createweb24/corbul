import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Rădăcina monorepo-ului, calculată față de ACEST fișier, nu față de
// directorul din care se rulează comanda: pe Vercel build-ul poate porni
// din rădăcina depozitului sau din `apps/web`, iar `process.cwd()` ar da
// două rezultate diferite (unul dintre ele în afara depozitului).
const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const nextConfig: NextConfig = {
  // Într-un monorepo, Turbopack trebuie ancorat explicit la rădăcină,
  // altfel o alege greșit din lockfile-uri străine.
  turbopack: {
    root: monorepoRoot,
  },
  poweredByHeader: false,
  async redirects() {
    return [
      // browserele cer /favicon.ico din oficiu; marca este SVG (SPEC §0.7),
      // servită de ruta-convenție `app/icon.svg`
      { source: "/favicon.ico", destination: "/icon.svg", permanent: true },
      // Ediția rusă a fost retrasă: vechile adrese /ru/... duc la echivalentul
      // românesc, ca legăturile deja indexate să nu cadă în 404.
      { source: "/ru", destination: "/ro", permanent: true },
      { source: "/ru/:path*", destination: "/ro/:path*", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
