"use client";

/**
 * Fila „Bannere" — toate creațiile din sistem, filtrabile pe zonă și campanie,
 * cu activare inline, previzualizare la dimensiunea reală și editor complet.
 */

import { useMemo, useState } from "react";
import { cn } from "@/components/ui/cn";
import { ConfirmDialog, Modal } from "../../_components/Modal";
import { useToast } from "../../_components/toast";
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  LoadingRows,
  Panel,
  PanelHead,
  Select,
  TextInput,
} from "../../_components/ui";
import { adminFetch, errorMessage, revalidateSite } from "../../_lib/session";
import type { AdBannerDto } from "../_lib/types";
import type { AdsStore } from "../_lib/store";
import { BannerForm } from "./BannerForm";
import { BannerPreview } from "./BannerPreview";
import { RowActions, RowToggle, TableScroll, Th } from "./bits";

export function BannersTab({ store }: { store: AdsStore }) {
  const toast = useToast();
  const { banners, zones, campaigns, advertisers, loading, errors, reload } = store;

  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [editing, setEditing] = useState<AdBannerDto | null | undefined>(undefined);
  const [preview, setPreview] = useState<AdBannerDto | null>(null);
  const [busyRow, setBusyRow] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdBannerDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const zoneById = useMemo(
    () => new Map(zones.map((zone) => [zone.id, zone])),
    [zones],
  );
  const campaignById = useMemo(
    () => new Map(campaigns.map((campaign) => [campaign.id, campaign])),
    [campaigns],
  );
  const advertiserById = useMemo(
    () => new Map(advertisers.map((advertiser) => [advertiser.id, advertiser])),
    [advertisers],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return banners.filter((banner) => {
      if (zoneFilter && String(banner.zoneId) !== zoneFilter) return false;
      if (campaignFilter && String(banner.campaignId) !== campaignFilter) {
        return false;
      }
      if (!needle) return true;
      const campaign = campaignById.get(banner.campaignId);
      return [banner.name, banner.targetUrl, campaign?.name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [banners, query, zoneFilter, campaignFilter, campaignById]);

  async function toggleActive(banner: AdBannerDto) {
    setBusyRow(banner.id);
    try {
      await adminFetch(`/admin/ads/banners/${banner.id}`, {
        method: "PUT",
        body: {
          name: banner.name,
          campaignId: banner.campaignId,
          zoneId: banner.zoneId,
          imageUrl: banner.imageUrl,
          html: banner.html,
          targetUrl: banner.targetUrl,
          alt: banner.alt,
          weight: banner.weight,
          active: !banner.active,
        },
      });
      void revalidateSite();
      await reload(["banners", "overview"]);
      toast.ok(banner.active ? "Banner oprit." : "Banner activat.", banner.name);
    } catch (caught) {
      toast.error("Starea bannerului nu a fost salvată.", errorMessage(caught));
    } finally {
      setBusyRow(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await adminFetch(`/admin/ads/banners/${pendingDelete.id}`, {
        method: "DELETE",
      });
      toast.ok("Banner șters.", pendingDelete.name);
      setPendingDelete(null);
      void revalidateSite();
      await reload(["banners", "overview"]);
    } catch (caught) {
      toast.error("Ștergerea a eșuat.", errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  }

  const previewZone = preview ? zoneById.get(preview.zoneId) : undefined;
  const filtered = Boolean(query || zoneFilter || campaignFilter);

  return (
    <>
      {errors.banners ? (
        <div className="mb-4">
          <ErrorNote
            message={errors.banners}
            onRetry={() => void reload(["banners"])}
          />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după nume, campanie sau destinație…"
            aria-label="Caută bannere"
          />
        </div>
        <div className="w-52">
          <Select
            value={zoneFilter}
            aria-label="Filtrează după zonă"
            onChange={(event) => setZoneFilter(event.target.value)}
          >
            <option value="">Toate zonele</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <Select
            value={campaignFilter}
            aria-label="Filtrează după campanie"
            onChange={(event) => setCampaignFilter(event.target.value)}
          >
            <option value="">Toate campaniile</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        </div>
        {filtered ? (
          <Button
            variant="quiet"
            onClick={() => {
              setQuery("");
              setZoneFilter("");
              setCampaignFilter("");
            }}
          >
            Golește filtrele
          </Button>
        ) : null}
      </div>

      <Panel>
        <PanelHead
          kicker="Creații"
          title="Bannere"
          action={
            <Button
              variant="gold"
              size="sm"
              onClick={() => setEditing(null)}
              disabled={campaigns.length === 0 || zones.length === 0}
              title={
                campaigns.length === 0 || zones.length === 0
                  ? "Ai nevoie de cel puțin o zonă și o campanie."
                  : undefined
              }
            >
              + Banner nou
            </Button>
          }
        />

        {loading && banners.length === 0 ? (
          <LoadingRows rows={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={filtered ? "Niciun banner găsit" : "Niciun banner"}
            message={
              filtered
                ? "Încearcă alte filtre."
                : campaigns.length === 0
                  ? "Creează întâi o campanie: fiecare banner îi aparține uneia."
                  : "Adaugă prima creație și alege-i zona."
            }
            action={
              !filtered && campaigns.length > 0 && zones.length > 0 ? (
                <Button variant="gold" onClick={() => setEditing(null)}>
                  + Banner nou
                </Button>
              ) : undefined
            }
          />
        ) : (
          <TableScroll minWidth="min-w-[62rem]">
            <thead>
              <tr className="border-b border-line-2">
                <Th>Banner</Th>
                <Th>Zonă</Th>
                <Th>Campanie</Th>
                <Th>Destinație</Th>
                <Th align="right">Greutate</Th>
                <Th align="right">Stare</Th>
                <Th align="right">Acțiuni</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((banner) => {
                const zone = zoneById.get(banner.zoneId);
                const campaign = campaignById.get(banner.campaignId);
                const advertiser = campaign
                  ? advertiserById.get(campaign.advertiserId)
                  : undefined;
                return (
                  <tr
                    key={banner.id}
                    className={cn(
                      "align-top transition-colors duration-200 hover:bg-coal-2/50",
                      !banner.active && "opacity-65",
                    )}
                  >
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setEditing(banner)}
                        className="text-left font-display text-[0.9375rem] leading-snug text-ivory transition-colors hover:text-gold"
                      >
                        {banner.name}
                      </button>
                      <p className="mt-1">
                        <Badge tone={banner.imageUrl ? "gold" : "neutral"}>
                          {banner.imageUrl ? "Imagine" : "HTML"}
                        </Badge>
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[0.8125rem] text-fog">
                        {zone?.name ?? "— zonă lipsă —"}
                      </p>
                      {zone ? (
                        <p className="mt-0.5 font-mono text-[0.6875rem] text-mist">
                          {zone.width} × {zone.height}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[0.8125rem] text-fog">
                        {campaign?.name ?? "—"}
                      </p>
                      <p className="mt-0.5 text-[0.6875rem] text-mist">
                        {campaign?.advertiserName ??
                          advertiser?.companyName ??
                          "client necunoscut"}
                      </p>
                    </td>
                    <td className="max-w-56 px-3 py-3">
                      <a
                        href={banner.targetUrl}
                        target="_blank"
                        rel="noreferrer nofollow"
                        className="link-gold block truncate text-[0.75rem]"
                        title={banner.targetUrl}
                      >
                        {banner.targetUrl}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-right text-[0.8125rem] tabular text-fog">
                      {banner.weight}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end">
                        <RowToggle
                          on={banner.active}
                          label={`Bannerul ${banner.name}`}
                          busy={busyRow === banner.id}
                          onToggle={() => void toggleActive(banner)}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <RowActions>
                        <Button
                          size="sm"
                          variant="quiet"
                          onClick={() => setPreview(banner)}
                        >
                          Vezi
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditing(banner)}
                        >
                          Editează
                        </Button>
                        <Button
                          size="sm"
                          variant="quiet"
                          className="px-2.5 text-mist hover:text-ember"
                          onClick={() => setPendingDelete(banner)}
                          aria-label={`Șterge bannerul ${banner.name}`}
                        >
                          Șterge
                        </Button>
                      </RowActions>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableScroll>
        )}
      </Panel>

      {editing !== undefined ? (
        <BannerForm
          open
          banner={editing}
          zones={zones}
          campaigns={campaigns}
          onClose={() => setEditing(undefined)}
          onSaved={() => reload(["banners", "campaigns", "overview"])}
        />
      ) : null}

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        size="xl"
        kicker="Previzualizare"
        title={preview?.name ?? ""}
        description="Randare la dimensiunea reală a zonei, ca pe site."
        footer={
          <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
            Închide
          </Button>
        }
      >
        {preview ? (
          <BannerPreview
            width={previewZone?.width ?? 300}
            height={previewZone?.height ?? 250}
            zoneName={previewZone?.name}
            imageUrl={preview.imageUrl}
            html={preview.html}
            alt={preview.alt}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        kicker="Operațiune ireversibilă"
        title="Ștergi bannerul?"
        message={
          <>
            <strong className="text-ivory">{pendingDelete?.name}</strong> va fi
            eliminat împreună cu statisticile lui zilnice (afișări și clicuri).
          </>
        }
        confirmLabel="Șterge definitiv"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
