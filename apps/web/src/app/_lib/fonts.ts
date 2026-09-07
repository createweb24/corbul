import type { Viewport } from "next";
import { Archivo, Playfair_Display, Source_Serif_4 } from "next/font/google";

/**
 * Cele trei familii tipografice ale identității Corbul.md, expuse ca
 * variabile CSS consumate de `@theme` din globals.css (SPEC §5).
 *
 * Aplicația are două root layout-uri paralele — `[locale]/layout.tsx`
 * (site-ul public) și `admin/layout.tsx` (panoul, doar RO) — fiecare cu
 * propriul `<html>`/`<body>`. Fonturile și viewport-ul se definesc o singură
 * dată, aici, și se aplică identic în amândouă.
 */

// titluri, masthead — voce editorială
export const display = Playfair_Display({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// corpul articolelor — lectură lungă
export const serif = Source_Serif_4({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// interfață, navigație, cifre, etichete.
// Archivo NU are subset chirilic pe Google Fonts (spre deosebire de
// Playfair Display și Source Serif 4), așa că textele rusești din UI cad
// pe fontul de sistem — de aceea lista de rezervă e explicită.
export const sans = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"],
});

/** `className` pentru `<html>`: activează cele trei variabile CSS. */
export const fontVariables = `${display.variable} ${serif.variable} ${sans.variable}`;

/** Viewport comun: temă permanent întunecată (SPEC §5). */
export const siteViewport: Viewport = {
  /**
   * Site-ul are ambele teme, iar alegerea se aplică pe `:root` prin
   * `color-scheme` din globals.css. Un `<meta name="color-scheme">` fix ar
   * spune browserului „această pagină e doar întunecată" și ar picta
   * controalele native greșit în tema luminoasă.
   */
  colorScheme: "light dark",
  /** bara browserului urmează tema sistemului până la alegerea cititorului */
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
  ],
};
