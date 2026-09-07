"use client";

import { useLocale, useTranslations } from "next-intl";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";
import { apiBaseUrl, apiFetch } from "@/lib/api";
import type { ServedAdDto, ServedAdZoneRef } from "@/lib/types";
import { adZoneSize } from "./zones";

/**
 * Un spațiu publicitar (ADS-SPEC §3).
 *
 * Reguli de bază, în ordinea importanței:
 *   1. nu aruncă niciodată — API-ul oprit, o zonă inexistentă sau un răspuns
 *      stricat înseamnă „fără reclamă", nu o pagină ruptă;
 *   2. rezervă spațiul din prima, din dimensiunile locale ale zonei, ca
 *      sosirea răspunsului să nu împingă conținutul (CLS);
 *   3. nu scrie nicio culoare literală: chenarul și fundalul de rezervă merg
 *      pe tokeni (`border-line`, `bg-coal`), deci arată corect în ambele teme.
 */

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

const ADSENSE_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

export interface AdSlotProps {
  /** cheia zonei: `header_leaderboard`, `sidebar_top`, … */
  zoneKey: string;
  className?: string;
  /** eticheta „PUBLICITATE" deasupra reclamei (implicit da) */
  label?: boolean;
}

type SlotState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "filled"; ad: ServedAdDto };

/**
 * `clickUrl` vine ca o cale absolută pe serverul API (`/api/ads/click/12`),
 * iar `NEXT_PUBLIC_API_URL` include deja prefixul `/api`. Concatenarea simplă
 * ar da `/api/api/…`, așa că rezolvăm calea față de ORIGINEA API-ului și
 * adăugăm prefixul doar dacă lipsește.
 */
function resolveClickUrl(clickUrl: string): string | null {
  if (!clickUrl) return null;
  if (/^https?:\/\//i.test(clickUrl)) return clickUrl;
  try {
    const base = new URL(
      apiBaseUrl(),
      typeof window === "undefined" ? "http://localhost" : window.location.href,
    );
    const prefix = base.pathname.replace(/\/+$/, "");
    const path = clickUrl.startsWith("/") ? clickUrl : `/${clickUrl}`;
    const full =
      prefix && !path.startsWith(`${prefix}/`) ? `${prefix}${path}` : path;
    return `${base.origin}${full}`;
  } catch {
    return null;
  }
}

/** Un răspuns este „util" doar dacă are efectiv ce randa. */
function isRenderable(ad: ServedAdDto): boolean {
  if (ad.provider === "DIRECT") {
    return Boolean((ad.imageUrl || ad.html) && resolveClickUrl(ad.clickUrl));
  }
  if (ad.provider === "ADSENSE") return Boolean(ad.client && ad.slot);
  return false;
}

function sizeOf(zone: ServedAdZoneRef | null | undefined, zoneKey: string) {
  if (zone && zone.width > 0 && zone.height > 0) {
    return { width: zone.width, height: zone.height };
  }
  return adZoneSize(zoneKey);
}

export function AdSlot({ zoneKey, className, label = true }: AdSlotProps) {
  const [state, setState] = useState<SlotState>({ status: "loading" });
  const locale = useLocale();
  const t = useTranslations("ads");
  const pushed = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    setState({ status: "loading" });
    pushed.current = false;

    apiFetch<ServedAdDto>(`/ads/serve/${encodeURIComponent(zoneKey)}`, {
      noStore: true,
      signal: controller.signal,
    })
      .then((ad) => {
        if (!alive) return;
        setState(
          ad && isRenderable(ad) ? { status: "filled", ad } : { status: "empty" },
        );
      })
      .catch(() => {
        // API oprit, zonă inexistentă, rețea căzută — pur și simplu fără reclamă
        if (alive) setState({ status: "empty" });
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [zoneKey]);

  const ad = state.status === "filled" ? state.ad : null;
  const isAdsense = ad?.provider === "ADSENSE";

  // AdSense cere o singură împingere per element <ins>; în modul strict al
  // React efectul rulează de două ori, de unde straja.
  useEffect(() => {
    if (!isAdsense || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // scriptul Google e blocat — spațiul rămâne gol, fără eroare
    }
  }, [isAdsense]);

  // fără reclamă: niciun chenar gol, nicio urmă în pagină
  if (state.status === "empty") return null;

  const size = sizeOf(ad?.zone, zoneKey);
  // Textele au rezervă locală: cheile `ads.*` se adaugă în messages/*.json de
  // proprietarul lor, iar până atunci eticheta trebuie să arate corect, nu să
  // afișeze numele cheii.
  const labelText = t.has("label")
    ? t("label")
    : locale === "ru"
      ? "РЕКЛАМА"
      : "PUBLICITATE";
  const linkLabel = t.has("linkLabel")
    ? t("linkLabel")
    : locale === "ru"
      ? "Открыть рекламу в новой вкладке"
      : "Deschide reclama într-o filă nouă";

  return (
    <div
      className={cn("no-print flex w-full flex-col items-center", className)}
      data-ad-zone={zoneKey}
    >
      <div className="w-full" style={{ maxWidth: `${size.width}px` }}>
        {label ? (
          <p className="mb-1.5 h-[13px] font-sans text-[10px] uppercase leading-[13px] tracking-[0.2em] text-mist">
            {ad ? labelText : ""}
          </p>
        ) : null}

        {/* Cât timp răspunsul nu a sosit, spațiul e rezervat dar INVIZIBIL:
            majoritatea zonelor n-au banner vândut, iar o casetă cu chenar
            care apare și dispare la fiecare încărcare arată ca un defect.
            Chenarul se aprinde abia când există efectiv o reclamă. */}
        <div
          className={cn(
            "relative w-full overflow-hidden transition-colors duration-200",
            ad ? "border border-line bg-coal" : "border border-transparent",
          )}
          style={{ aspectRatio: `${size.width} / ${size.height}` }}
        >
          {ad?.provider === "DIRECT" ? (
            <DirectAd ad={ad} size={size} fallbackAlt={linkLabel} />
          ) : null}

          {ad?.provider === "ADSENSE" ? (
            <>
              <Script
                id="corbul-adsbygoogle"
                src={`${ADSENSE_SRC}?client=${encodeURIComponent(ad.client)}`}
                strategy="afterInteractive"
                crossOrigin="anonymous"
                data-ad-client={ad.client}
              />
              <ins
                className="adsbygoogle"
                style={{ display: "block", width: "100%", height: "100%" }}
                data-ad-client={ad.client}
                data-ad-slot={ad.slot}
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DirectAd({
  ad,
  size,
  fallbackAlt,
}: {
  ad: Extract<ServedAdDto, { provider: "DIRECT" }>;
  size: { width: number; height: number };
  fallbackAlt: string;
}) {
  const href = resolveClickUrl(ad.clickUrl);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className="block h-full w-full"
      aria-label={ad.alt || fallbackAlt}
    >
      {ad.imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={ad.imageUrl}
          alt={ad.alt ?? ""}
          width={size.width}
          height={size.height}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
        />
      ) : (
        /* marcajul vine din panoul de administrare (sursă de încredere),
           nu de la vizitatori — la fel ca HTML-ul articolelor */
        <div
          className="h-full w-full"
          dangerouslySetInnerHTML={{ __html: ad.html ?? "" }}
        />
      )}
    </a>
  );
}

export default AdSlot;
