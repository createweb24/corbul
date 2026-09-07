"use client";

/**
 * `/admin/publicitate` — gestiunea reclamelor (CORBUL.MD §4).
 *
 * O singură rută, șase file interne: Zone · Clienți · Campanii · Bannere ·
 * Statistici · AdSense. Fila curentă se ține în `?fila=` (fără `useSearchParams`,
 * ca pagina să rămână un client component simplu, exact ca `/admin/articole`),
 * iar datele se încarcă o singură dată, în depozitul comun.
 */

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/components/ui/cn";
import { formatNumber } from "@/lib/format";
import {
  Button,
  ErrorNote,
  PageHead,
} from "../_components/ui";
import { AdsenseTab } from "./_components/AdsenseTab";
import { AdvertisersTab } from "./_components/AdvertisersTab";
import { BannersTab } from "./_components/BannersTab";
import { CampaignsTab } from "./_components/CampaignsTab";
import { StatsTab } from "./_components/StatsTab";
import { ZonesTab } from "./_components/ZonesTab";
import { StatCell } from "./_components/bits";
import { formatCtr } from "./_lib/labels";
import { useAdsStore } from "./_lib/store";

type TabId =
  | "zone"
  | "clienti"
  | "campanii"
  | "bannere"
  | "statistici"
  | "adsense";

const TABS: { id: TabId; label: string }[] = [
  { id: "zone", label: "Zone" },
  { id: "clienti", label: "Clienți" },
  { id: "campanii", label: "Campanii" },
  { id: "bannere", label: "Bannere" },
  { id: "statistici", label: "Statistici" },
  { id: "adsense", label: "AdSense" },
];

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export default function PublicitatePage() {
  const store = useAdsStore();
  const [tab, setTab] = useState<TabId>("zone");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("fila");
    if (isTabId(fromUrl)) setTab(fromUrl);
  }, []);

  const changeTab = useCallback((next: TabId) => {
    setTab(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("fila", next);
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* fila rămâne doar în memorie — fără consecințe */
    }
  }, []);

  const { zones, advertisers, campaigns, banners, overview, errors, loading } =
    store;

  // Sinteza vine din API; dacă ruta lipsește încă, o deducem din liste, ca
  // banda de sus să spună totuși ceva adevărat.
  const activeCampaigns =
    overview?.campaigns.active ??
    campaigns.filter((campaign) => campaign.status === "ACTIVE").length;
  const totalCampaigns = overview?.campaigns.total ?? campaigns.length;
  const activeBanners =
    overview?.banners.active ?? banners.filter((banner) => banner.active).length;
  const totalBanners = overview?.banners.total ?? banners.length;
  const activeZones = zones.filter((zone) => zone.active).length;

  const parts = ["zones", "advertisers", "campaigns", "banners"] as const;
  const allDown = parts.every((part) => Boolean(errors[part]));

  const counts: Record<TabId, number | null> = {
    zone: zones.length,
    clienti: advertisers.length,
    campanii: campaigns.length,
    bannere: banners.length,
    statistici: null,
    adsense: null,
  };

  return (
    <>
      <PageHead
        kicker="Venituri"
        title="Publicitate"
        description="Spațiile de pe site, clienții care le cumpără, campaniile lor și randamentul fiecărui banner."
        action={
          <Button
            variant="ghost"
            loading={store.refreshing}
            onClick={() => void store.reload()}
          >
            Reîmprospătează
          </Button>
        }
      />

      {allDown ? (
        <div className="mb-6">
          <ErrorNote
            message={
              errors.zones ??
              "Modulul de publicitate al API-ului nu răspunde. Verifică serverul de pe portul 4100."
            }
            onRetry={() => void store.reload()}
          />
        </div>
      ) : null}

      {/* Sinteză */}
      <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-5">
        <StatCell
          label="Zone"
          value={formatNumber(activeZones, "ro")}
          note={`${formatNumber(zones.length, "ro")} definite`}
          loading={loading}
        />
        <StatCell
          label="Clienți"
          value={formatNumber(overview?.advertisers ?? advertisers.length, "ro")}
          note="companii cu contract"
          loading={loading}
        />
        <StatCell
          label="Campanii active"
          value={formatNumber(activeCampaigns, "ro")}
          note={`${formatNumber(totalCampaigns, "ro")} în total`}
          loading={loading}
        />
        <StatCell
          label="Bannere active"
          value={formatNumber(activeBanners, "ro")}
          note={`${formatNumber(totalBanners, "ro")} în total`}
          loading={loading}
        />
        <StatCell
          label="CTR 30 zile"
          value={
            overview
              ? formatCtr(overview.clicks30d, overview.impressions30d)
              : "—"
          }
          note={
            overview
              ? `${formatNumber(overview.impressions30d, "ro")} afișări · ${formatNumber(
                  overview.clicks30d,
                  "ro",
                )} clicuri`
              : "sinteza nu e disponibilă"
          }
          accent
          loading={loading}
        />
      </div>

      {/* File */}
      <div className="mb-6 mt-6 overflow-x-auto border-b border-line">
        <div
          role="tablist"
          aria-label="Secțiunile publicității"
          className="flex min-w-max"
          onKeyDown={(event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            event.preventDefault();
            const index = TABS.findIndex((item) => item.id === tab);
            const step = event.key === "ArrowRight" ? 1 : TABS.length - 1;
            const next = TABS[(index + step) % TABS.length].id;
            changeTab(next);
            document.getElementById(`fila-${next}`)?.focus();
          }}
        >
          {TABS.map((item) => {
            const active = item.id === tab;
            const count = counts[item.id];
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`fila-${item.id}`}
                aria-selected={active}
                aria-controls="fila-continut"
                tabIndex={active ? 0 : -1}
                onClick={() => changeTab(item.id)}
                className={cn(
                  "press relative px-4 py-3 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-200",
                  active ? "text-gold" : "text-mist hover:text-ivory",
                )}
              >
                {item.label}
                {count !== null && count > 0 ? (
                  <span
                    className={cn(
                      "ml-2 tabular text-[0.625rem]",
                      active ? "text-gold/70" : "text-mist",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 -bottom-px h-px transition-colors duration-200",
                    active ? "bg-gold" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div id="fila-continut" role="tabpanel" aria-labelledby={`fila-${tab}`}>
        {tab === "zone" ? <ZonesTab store={store} /> : null}
        {tab === "clienti" ? <AdvertisersTab store={store} /> : null}
        {tab === "campanii" ? <CampaignsTab store={store} /> : null}
        {tab === "bannere" ? <BannersTab store={store} /> : null}
        {tab === "statistici" ? <StatsTab store={store} /> : null}
        {tab === "adsense" ? <AdsenseTab store={store} /> : null}
      </div>

      {store.refreshing ? (
        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-mist">
          Se actualizează…
        </p>
      ) : null}
    </>
  );
}
