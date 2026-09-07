"use client";

/**
 * Formularul unui banner — folosit și din fila „Bannere", și din lista de
 * bannere a unei campanii. Un banner are fie imagine, fie marcaj HTML; ambele
 * se văd imediat în previzualizarea de alături, la dimensiunea reală a zonei.
 */

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/components/ui/cn";
import { Modal } from "../../_components/Modal";
import { useToast } from "../../_components/toast";
import {
  Button,
  Field,
  Select,
  Switch,
  TextArea,
  TextInput,
} from "../../_components/ui";
import { adminFetch, errorMessage, revalidateSite } from "../../_lib/session";
import { intInRange, isHttpUrl, isImageSource } from "../_lib/labels";
import type {
  AdBannerDto,
  AdBannerPayload,
  AdCampaignDto,
  AdZoneDto,
} from "../_lib/types";
import { BannerPreview } from "./BannerPreview";
import { FormIssue } from "./bits";

type Kind = "image" | "html";

interface Draft {
  name: string;
  campaignId: string;
  zoneId: string;
  kind: Kind;
  imageUrl: string;
  html: string;
  targetUrl: string;
  alt: string;
  weight: string;
  active: boolean;
}

const HTML_SAMPLE = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:var(--color-coal-2);border:1px solid var(--color-gold);color:var(--color-ivory);font-family:Archivo,sans-serif;letter-spacing:.12em;text-transform:uppercase;font-size:12px">
  Spațiu publicitar
</div>`;

function draftFrom(
  banner: AdBannerDto | null,
  campaigns: AdCampaignDto[],
  zones: AdZoneDto[],
  lockedCampaignId?: number,
): Draft {
  if (banner) {
    return {
      name: banner.name,
      campaignId: String(banner.campaignId || lockedCampaignId || ""),
      zoneId: String(banner.zoneId || ""),
      kind: banner.imageUrl ? "image" : "html",
      imageUrl: banner.imageUrl ?? "",
      html: banner.html ?? "",
      targetUrl: banner.targetUrl,
      alt: banner.alt ?? "",
      weight: String(banner.weight),
      active: banner.active,
    };
  }
  return {
    name: "",
    campaignId: String(lockedCampaignId ?? campaigns[0]?.id ?? ""),
    zoneId: String(zones.find((zone) => zone.active)?.id ?? zones[0]?.id ?? ""),
    kind: "html",
    imageUrl: "",
    html: "",
    targetUrl: "",
    alt: "",
    weight: "1",
    active: true,
  };
}

export interface BannerFormProps {
  open: boolean;
  banner: AdBannerDto | null;
  zones: AdZoneDto[];
  campaigns: AdCampaignDto[];
  /** campania e impusă din fila Campanii și nu se mai poate schimba */
  lockedCampaignId?: number;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

export function BannerForm({
  open,
  banner,
  zones,
  campaigns,
  lockedCampaignId,
  onClose,
  onSaved,
}: BannerFormProps) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(() =>
    draftFrom(banner, campaigns, zones, lockedCampaignId),
  );
  const [issues, setIssues] = useState<Partial<Record<keyof Draft, string>>>({});
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fiecare deschidere pornește de la valorile bannerului cerut.
  useEffect(() => {
    if (!open) return;
    setDraft(draftFrom(banner, campaigns, zones, lockedCampaignId));
    setIssues({});
    setFormIssue(null);
    // `campaigns`/`zones` se schimbă doar la reîncărcare; nu resetăm formularul
    // pentru ele cât timp e deschis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, banner, lockedCampaignId]);

  const zone = useMemo(
    () => zones.find((item) => String(item.id) === draft.zoneId) ?? null,
    [zones, draft.zoneId],
  );

  function patch(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function validate(): AdBannerPayload | null {
    const next: Partial<Record<keyof Draft, string>> = {};
    const name = draft.name.trim();
    const campaignId = Number(draft.campaignId);
    const zoneId = Number(draft.zoneId);
    const targetUrl = draft.targetUrl.trim();
    const weight = intInRange(draft.weight, 1, 100);
    const imageUrl = draft.imageUrl.trim();
    const html = draft.html.trim();

    if (!name) next.name = "Numele bannerului este obligatoriu.";
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      next.campaignId = "Alege campania.";
    }
    if (!Number.isInteger(zoneId) || zoneId <= 0) {
      next.zoneId = "Alege zona.";
    }
    if (!isHttpUrl(targetUrl)) {
      next.targetUrl = "Adresă completă, cu http:// sau https://.";
    }
    if (weight === null) next.weight = "Greutate între 1 și 100.";

    if (draft.kind === "image") {
      if (!isImageSource(imageUrl)) {
        next.imageUrl = "Adresa imaginii: https://… sau cale internă /….";
      }
    } else if (!html) {
      next.html = "Marcajul HTML nu poate fi gol.";
    }

    setIssues(next);
    if (Object.keys(next).length > 0 || weight === null) {
      setFormIssue("Corectează câmpurile marcate.");
      return null;
    }

    setFormIssue(null);
    return {
      name,
      campaignId,
      zoneId,
      targetUrl,
      weight,
      active: draft.active,
      alt: draft.alt.trim() || null,
      imageUrl: draft.kind === "image" ? imageUrl : null,
      html: draft.kind === "html" ? html : null,
    };
  }

  async function save() {
    const payload = validate();
    if (!payload || saving) return;
    setSaving(true);
    try {
      if (banner) {
        await adminFetch(`/admin/ads/banners/${banner.id}`, {
          method: "PUT",
          body: payload,
        });
        toast.ok("Banner actualizat.", payload.name);
      } else {
        await adminFetch("/admin/ads/banners", { method: "POST", body: payload });
        toast.ok("Banner creat.", payload.name);
      }
      void revalidateSite();
      await onSaved();
      onClose();
    } catch (caught) {
      const message = errorMessage(caught, "Bannerul nu a putut fi salvat.");
      setFormIssue(message);
      toast.error("Salvarea a eșuat.", message);
    } finally {
      setSaving(false);
    }
  }

  const lockedCampaign = lockedCampaignId
    ? campaigns.find((item) => item.id === lockedCampaignId)
    : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={saving}
      size="xl"
      kicker={banner ? "Modificare" : "Banner nou"}
      title={banner ? banner.name : "Adaugă un banner"}
      description="Bannerul se afișează în zona aleasă, cât timp campania lui este activă și în perioadă."
      footer={
        <>
          <FormIssue message={formIssue} />
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>
            Renunță
          </Button>
          <Button variant="gold" size="sm" loading={saving} onClick={() => void save()}>
            Salvează
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---------------------------------------------------------- */}
        <div className="flex flex-col gap-4">
          <Field label="Nume" htmlFor="banner-name" required error={issues.name}>
            <TextInput
              id="banner-name"
              value={draft.name}
              invalid={Boolean(issues.name)}
              onChange={(event) => patch({ name: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Campanie"
              htmlFor="banner-campaign"
              required
              error={issues.campaignId}
              hint={lockedCampaign ? "Impusă de campania deschisă." : undefined}
            >
              {lockedCampaign ? (
                <div className="border border-line bg-obsidian px-3 py-2 text-sm text-fog">
                  {lockedCampaign.name}
                </div>
              ) : (
                <Select
                  id="banner-campaign"
                  value={draft.campaignId}
                  invalid={Boolean(issues.campaignId)}
                  onChange={(event) => patch({ campaignId: event.target.value })}
                >
                  <option value="">— alege —</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                      {campaign.advertiserName ? ` · ${campaign.advertiserName}` : ""}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Zonă" htmlFor="banner-zone" required error={issues.zoneId}>
              <Select
                id="banner-zone"
                value={draft.zoneId}
                invalid={Boolean(issues.zoneId)}
                onChange={(event) => patch({ zoneId: event.target.value })}
              >
                <option value="">— alege —</option>
                {zones.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.width}×{item.height})
                    {item.active ? "" : " · oprită"}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Adresa de destinație"
            htmlFor="banner-target"
            required
            error={issues.targetUrl}
            hint="Unde ajunge cititorul la clic. Legătura primește rel=„sponsored”."
          >
            <TextInput
              id="banner-target"
              type="url"
              inputMode="url"
              spellCheck={false}
              autoComplete="off"
              placeholder="https://client.md/oferta"
              value={draft.targetUrl}
              invalid={Boolean(issues.targetUrl)}
              onChange={(event) => patch({ targetUrl: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Greutate"
              htmlFor="banner-weight"
              required
              error={issues.weight}
              hint="1–100. Cu cât e mai mare, cu atât apare mai des în zonă."
            >
              <TextInput
                id="banner-weight"
                inputMode="numeric"
                value={draft.weight}
                invalid={Boolean(issues.weight)}
                onChange={(event) => patch({ weight: event.target.value })}
              />
            </Field>
            <Field
              label="Text alternativ"
              htmlFor="banner-alt"
              hint="Pentru cititoarele de ecran."
            >
              <TextInput
                id="banner-alt"
                value={draft.alt}
                onChange={(event) => patch({ alt: event.target.value })}
              />
            </Field>
          </div>

          <Switch
            checked={draft.active}
            onChange={(next) => patch({ active: next })}
            label="Banner activ"
            hint="Oprit, nu intră în rotația zonei."
          />

          {/* Conținut: imagine sau marcaj */}
          <div>
            <p className="mb-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-fog">
              Conținut
            </p>
            <div className="mb-3 flex gap-1" role="group" aria-label="Tipul conținutului">
              {(["image", "html"] as Kind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => patch({ kind })}
                  aria-pressed={draft.kind === kind}
                  className={cn(
                    "press border px-3 py-1.5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-200",
                    draft.kind === kind
                      ? "border-gold bg-gold/12 text-gold"
                      : "border-line text-mist hover:border-line-2 hover:text-fog",
                  )}
                >
                  {kind === "image" ? "Imagine" : "Marcaj HTML"}
                </button>
              ))}
            </div>

            {draft.kind === "image" ? (
              <Field
                label="Adresa imaginii"
                htmlFor="banner-image"
                required
                error={issues.imageUrl}
                hint="https://… sau o cale internă /imagini/banner.png."
              >
                <TextInput
                  id="banner-image"
                  mono
                  spellCheck={false}
                  autoComplete="off"
                  value={draft.imageUrl}
                  invalid={Boolean(issues.imageUrl)}
                  onChange={(event) => patch({ imageUrl: event.target.value })}
                />
              </Field>
            ) : (
              <Field
                label="Marcaj HTML"
                htmlFor="banner-html"
                required
                error={issues.html}
                hint="Se inserează ca atare în zonă. Folosește variabilele de temă (var(--color-…)) ca bannerul să arate corect în ambele teme."
              >
                <TextArea
                  id="banner-html"
                  mono
                  rows={9}
                  spellCheck={false}
                  value={draft.html}
                  invalid={Boolean(issues.html)}
                  onChange={(event) => patch({ html: event.target.value })}
                />
              </Field>
            )}

            {draft.kind === "html" && !draft.html.trim() ? (
              <Button
                size="sm"
                variant="quiet"
                className="mt-2"
                onClick={() => patch({ html: HTML_SAMPLE })}
              >
                Inserează un marcaj de pornire
              </Button>
            ) : null}
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          {zone ? (
            <BannerPreview
              width={zone.width}
              height={zone.height}
              zoneName={zone.name}
              imageUrl={draft.kind === "image" ? draft.imageUrl : null}
              html={draft.kind === "html" ? draft.html : null}
              alt={draft.alt}
            />
          ) : (
            <div className="border border-dashed border-line bg-coal-2/40 px-4 py-10 text-center">
              <p className="text-sm text-mist">
                Alege o zonă ca să vezi previzualizarea la dimensiunea reală.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
