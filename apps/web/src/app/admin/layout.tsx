import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { fontVariables, siteViewport } from "@/app/_lib/fonts";
import { siteUrl } from "@/app/_lib/site";
import { AdminChrome } from "./_components/AdminShell";
import { ToastProvider } from "./_components/toast";
import { ThemeScript } from "@/components/ui/ThemeScript";

/**
 * Root layout paralel al panoului (SPEC §9 + §10bis).
 *
 * Panoul trăiește în afara segmentului `[locale]`, deci își declară propriile
 * `<html lang="ro">` și `<body>` — fonturile și viewport-ul sunt aceleași cu
 * ale site-ului public (`app/_lib/fonts.ts`). Interfața este doar în română
 * și este scoasă din indexare.
 */

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Panou editorial",
    template: "%s · Panou Corbul.md",
  },
  description: "Panoul de administrare al portalului Corbul.md.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export const viewport = siteViewport;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ro" className={fontVariables} suppressHydrationWarning>
      <body className="bg-obsidian text-ivory">
        <ThemeScript />
        <ToastProvider>
          <AdminChrome>{children}</AdminChrome>
        </ToastProvider>
      </body>
    </html>
  );
}
