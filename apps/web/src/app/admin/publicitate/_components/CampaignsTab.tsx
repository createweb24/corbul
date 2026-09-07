"use client";

/**
 * Fila „Campanii" — client, perioadă, status, plus lista de bannere a
 * campaniei, deschisă chiar în tabel (adăugare, editare, ștergere pe loc).
 * Statusul se schimbă direct din rând, fără să deschizi formularul.
 */

import { Fragment, useMemo, useState } from "react";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/components/ui/cn";
import { ConfirmDialog, Modal } from "../../_components/Modal";
import { useToast } from "../../_components/toast";
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  Field,
  LoadingRows,
  Panel,
  PanelHead,
  Select,
  TextInput,
} from "../../_components/ui";
import {
  isoToLocalInput,
  localInputToIso,
} from "../../_lib/datetime";
import {
  adminFetch,
  ApiError,
  errorMessage,
  revalidateSite,
} from "../../_lib/session";
import { CAMPAIGN_STATUSES } from "../_lib/normalize";
import { STATUS_LABEL, STATUS_TONE } from "../_lib/labels";
import type {
  AdBannerDto,
  AdCampaignDto,
  AdCampaignPayload,
  AdCampaignStatus,
} from "../_lib/types";
import type { AdsStore } from "../_lib/store";
import { BannerForm } from "./BannerForm";
import { RowActions, TableScroll, Th } from "./bits";

interface Draft {
  name: string;
  advertiserId: string;
  status: AdCampaignStatus;
  startsAt: string;
  endsAt: string;
}

function defaultDraft(advertiserId: string): Draft {
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  return {
    name: "",
    advertiserId,
    status: "DRAFT",
    startsAt: isoToLocalInput(now.toISOString()),
    endsAt: isoToLocalInput(end.toISOString()),
  };
}

function periodState(
  campaign: AdCampaignDto,
): { label: string; tone: "ok" | "warn" | "neutral" } {
  const now = Date.now();
  const start = Date.parse(campaign.startsAt);
  const end = Date.parse(campaign.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { label: "perioadă necunoscută", tone: "neutral" };
  }
  if (now < start) return { label: "programată", tone: "warn" };
  if (now > end) return { label: "expirată", tone: "neutral" };
  return { label: "în perioadă", tone: "ok" };
}

export function CampaignsTab({ store }: { store: AdsStore }) {
  const toast = useToast();
  const { campaigns, advertisers, banners, zones, loading, errors, reload } = store;

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [advertiserFilter, setAdvertiserFilter] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const [editing, setEditing] = useState<AdCampaignDto | null | undefined>(
    undefined,
  );
  const [draft, setDraft] = useState<Draft>(() => defaultDraft(""));
  const [issues, setIssues] = useState<Partial<Record<keyof Draft, string>>>({});
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyRow, setBusyRow] = useState<number | null>(null);

  const [pendingDelete, setPendingDelete] = useState<AdCampaignDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  /** `{ campaignId }` = banner nou · obiect = editare */
  const [bannerEditing, setBannerEditing] = useState<
    { campaignId: number; banner: AdBannerDto | null } | null
  >(null);
  const [pendingBannerDelete, setPendingBannerDelete] =
    useState<AdBannerDto | null>(null);
  const [deletingBanner, setDeletingBanner] = useState(false);

  const advertiserById = useMemo(
    () => new Map(advertisers.map((advertiser) => [advertiser.id, advertiser])),
    [advertisers],
  );
  const zoneById = useMemo(
    () => new Map(zones.map((zone) => [zone.id, zone])),
    [zones],
  );
  const bannersByCampaign = useMemo(() => {
    const map = new Map<number, AdBannerDto[]>();
    for (const banner of banners) {
      const list = map.get(banner.campaignId) ?? [];
      list.push(banner);
      map.set(banner.campaignId, list);
    }
    return map;
  }, [banners]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      if (statusFilter && campaign.status !== statusFilter) return false;
      if (advertiserFilter && String(campaign.advertiserId) !== advertiserFilter) {
        return false;
      }
      if (!needle) return true;
      const advertiser = advertiserById.get(campaign.advertiserId);
      return [
        campaign.name,
        campaign.advertiserName ?? "",
        advertiser?.companyName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [campaigns, query, statusFilter, advertiserFilter, advertiserById]);

  function open(campaign: AdCampaignDto | null) {
    setEditing(campaign);
    setDraft(
      campaign
        ? {
            name: campaign.name,
            advertiserId: String(campaign.advertiserId || ""),
            status: campaign.status,
            startsAt: isoToLocalInput(campaign.startsAt),
            endsAt: isoToLocalInput(campaign.endsAt),
          }
        : defaultDraft(String(advertisers[0]?.id ?? "")),
    );
    setIssues({});
    setFormIssue(null);
  }

  function patch(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function validate(): AdCampaignPayload | null {
    const next: Partial<Record<keyof Draft, string>> = {};
    const name = draft.name.trim();
    const advertiserId = Number(draft.advertiserId);
    const startsAt = localInputToIso(draft.startsAt);
    const endsAt = localInputToIso(draft.endsAt);

    if (!name) next.name = "Numele campaniei este obligatoriu.";
    if (!Number.isInteger(advertiserId) || advertiserId <= 0) {
      next.advertiserId = "Alege clientul.";
    }
    if (!startsAt) next.startsAt = "Dată de început invalidă.";
    if (!endsAt) next.endsAt = "Dată de sfârșit invalidă.";
    if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) {
      next.endsAt = "Sfârșitul trebuie să fie după început.";
    }

    setIssues(next);
    if (Object.keys(next).length > 0 || !startsAt || !endsAt) {
      setFormIssue("Corectează câmpurile marcate.");
      return null;
    }
    setFormIssue(null);
    return { name, advertiserId, status: draft.status, startsAt, endsAt };
  }

  async function save() {
    const payload = validate();
    if (!payload || saving) return;
    setSaving(true);
    try {
      if (editing) {
        await adminFetch(`/admin/ads/campaigns/${editing.id}`, {
          method: "PUT",
          body: payload,
        });
        toast.ok("Campanie actualizată.", payload.name);
      } else {
        await adminFetch("/admin/ads/campaigns", {
          method: "POST",
          body: payload,
        });
        toast.ok("Campanie creată.", payload.name);
      }
      setEditing(undefined);
      void revalidateSite();
      await reload(["campaigns", "overview"]);
    } catch (caught) {
      const message = errorMessage(caught, "Campania nu a putut fi salvată.");
      setFormIssue(message);
      toast.error("Salvarea a eșuat.", message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(campaign: AdCampaignDto, status: AdCampaignStatus) {
    if (status === campaign.status) return;
    setBusyRow(campaign.id);
    try {
      await adminFetch(`/admin/ads/campaigns/${campaign.id}`, {
        method: "PUT",
        body: {
          name: campaign.name,
          advertiserId: campaign.advertiserId,
          startsAt: campaign.startsAt,
          endsAt: campaign.endsAt,
          status,
        },
      });
      void revalidateSite();
      await reload(["campaigns", "overview"]);
      toast.ok("Status actualizat.", `${campaign.name} · ${STATUS_LABEL[status]}`);
    } catch (caught) {
      toast.error("Statusul nu a fost salvat.", errorMessage(caught));
    } finally {
      setBusyRow(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await adminFetch(`/admin/ads/campaigns/${pendingDelete.id}`, {
        method: "DELETE",
      });
      toast.ok("Campanie ștearsă.", pendingDelete.name);
      setPendingDelete(null);
      void revalidateSite();
      await reload(["campaigns", "banners", "overview"]);
    } catch (caught) {
      const message =
        caught instanceof ApiError && caught.status === 409
          ? "Campania are bannere cu statistici acumulate. Treci-o pe „Încheiată” în loc s-o ștergi."
          : errorMessage(caught);
      toast.error("Ștergerea a eșuat.", message);
    } finally {
      setDeleting(false);
    }
  }

  async function confirmBannerDelete() {
    if (!pendingBannerDelete || deletingBanner) return;
    setDeletingBanner(true);
    try {
      await adminFetch(`/admin/ads/banners/${pendingBannerDelete.id}`, {
        method: "DELETE",
      });
      toast.ok("Banner șters.", pendingBannerDelete.name);
      setPendingBannerDelete(null);
      void revalidateSite();
      await reload(["banners", "campaigns", "overview"]);
    } catch (caught) {
      toast.error("Ștergerea a eșuat.", errorMessage(caught));
    } finally {
      setDeletingBanner(false);
    }
  }

  const filtered = Boolean(query || statusFilter || advertiserFilter);

  return (
    <>
      {errors.campaigns ? (
        <div className="mb-4">
          <ErrorNote
            message={errors.campaigns}
            onRetry={() => void reload(["campaigns"])}
          />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după campanie sau client…"
            aria-label="Caută campanii"
          />
        </div>
        <div className="w-48">
          <Select
            value={statusFilter}
            aria-label="Filtrează după status"
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Toate statusurile</option>
            {CAMPAIGN_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <Select
            value={advertiserFilter}
            aria-label="Filtrează după client"
            onChange={(event) => setAdvertiserFilter(event.target.value)}
          >
            <option value="">Toți clienții</option>
            {advertisers.map((advertiser) => (
              <option key={advertiser.id} value={advertiser.id}>
                {advertiser.companyName}
              </option>
            ))}
          </Select>
        </div>
        {filtered ? (
          <Button
            variant="quiet"
            onClick={() => {
              setQuery("");
              setStatusFilter("");
              setAdvertiserFilter("");
            }}
          >
            Golește filtrele
          </Button>
        ) : null}
      </div>

      <Panel>
        <PanelHead
          kicker="Vânzări"
          title="Campanii"
          action={
            <Button
              variant="gold"
              size="sm"
              onClick={() => open(null)}
              disabled={advertisers.length === 0}
              title={
                advertisers.length === 0
                  ? "Adaugă întâi un client în fila Clienți."
                  : undefined
              }
            >
              + Campanie nouă
            </Button>
          }
        />

        {loading && campaigns.length === 0 ? (
          <LoadingRows rows={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={filtered ? "Nicio campanie găsită" : "Nicio campanie"}
            message={
              filtered
                ? "Încearcă alte filtre."
                : advertisers.length === 0
                  ? "Adaugă întâi un client, apoi programează-i prima campanie."
                  : "Programează prima campanie: client, perioadă și bannere."
            }
            action={
              !filtered && advertisers.length > 0 ? (
                <Button variant="gold" onClick={() => open(null)}>
                  + Campanie nouă
                </Button>
              ) : undefined
            }
          />
        ) : (
          <TableScroll minWidth="min-w-[64rem]">
            <thead>
              <tr className="border-b border-line-2">
                <Th className="w-10">
                  <span className="sr-only">Extinde</span>
                </Th>
                <Th>Campanie</Th>
                <Th>Client</Th>
                <Th>Perioadă</Th>
                <Th align="right">Bannere</Th>
                <Th align="right">Status</Th>
                <Th align="right">Acțiuni</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((campaign) => {
                const advertiser = advertiserById.get(campaign.advertiserId);
                const list = bannersByCampaign.get(campaign.id) ?? [];
                const period = periodState(campaign);
                const isOpen = expanded === campaign.id;
                return (
                  <Fragment key={campaign.id}>
                    <tr
                      className={cn(
                        "align-top transition-colors duration-200 hover:bg-coal-2/50",
                        isOpen && "bg-coal-2/40",
                      )}
                    >
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : campaign.id)}
                          aria-expanded={isOpen}
                          aria-label={`Bannerele campaniei ${campaign.name}`}
                          className="press flex size-7 items-center justify-center border border-transparent text-mist transition-colors hover:border-line-2 hover:text-gold"
                        >
                          <svg
                            viewBox="0 0 16 16"
                            aria-hidden="true"
                            className={cn(
                              "size-3.5 transition-transform duration-200",
                              isOpen && "rotate-90",
                            )}
                          >
                            <path
                              d="M6 3.5 10.5 8 6 12.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => open(campaign)}
                          className="text-left font-display text-[0.9375rem] leading-snug text-ivory transition-colors hover:text-gold"
                        >
                          {campaign.name}
                        </button>
                        {campaign.stripeSessionId ? (
                          <p className="mt-0.5 truncate font-mono text-[0.625rem] text-mist">
                            {campaign.stripeSessionId}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 text-[0.8125rem] text-fog">
                        {campaign.advertiserName ??
                          advertiser?.companyName ??
                          "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <p className="text-[0.8125rem] tabular text-fog">
                          {campaign.startsAt
                            ? formatDateShort(campaign.startsAt, "ro")
                            : "—"}
                          {" → "}
                          {campaign.endsAt
                            ? formatDateShort(campaign.endsAt, "ro")
                            : "—"}
                        </p>
                        <p className="mt-1">
                          <Badge tone={period.tone}>{period.label}</Badge>
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right text-[0.8125rem] tabular text-fog">
                        {list.length || campaign.bannerCount || 0}
                      </td>
                      <td className="px-3 py-3">
                        <div
                          className={cn(
                            "ml-auto w-44",
                            busyRow === campaign.id && "opacity-50",
                          )}
                        >
                          <Select
                            value={campaign.status}
                            aria-label={`Statusul campaniei ${campaign.name}`}
                            disabled={busyRow === campaign.id}
                            onChange={(event) =>
                              void changeStatus(
                                campaign,
                                event.target.value as AdCampaignStatus,
                              )
                            }
                          >
                            {CAMPAIGN_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABEL[status]}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <RowActions>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => open(campaign)}
                          >
                            Editează
                          </Button>
                          <Button
                            size="sm"
                            variant="quiet"
                            className="px-2.5 text-mist hover:text-ember"
                            onClick={() => setPendingDelete(campaign)}
                            aria-label={`Șterge campania ${campaign.name}`}
                          >
                            Șterge
                          </Button>
                        </RowActions>
                      </td>
                    </tr>

                    {isOpen ? (
                      <tr className="bg-coal-2/25">
                        <td colSpan={7} className="px-3 pb-5 pt-1 sm:px-5">
                          <div className="border border-line bg-coal">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-fog">
                                  Bannerele campaniei
                                </p>
                                <Badge tone={STATUS_TONE[campaign.status]}>
                                  {STATUS_LABEL[campaign.status]}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="gold"
                                disabled={zones.length === 0}
                                onClick={() =>
                                  setBannerEditing({
                                    campaignId: campaign.id,
                                    banner: null,
                                  })
                                }
                              >
                                + Banner
                              </Button>
                            </div>

                            {list.length === 0 ? (
                              <p className="px-4 py-5 text-sm text-mist">
                                Campania nu are încă bannere. Fără cel puțin unul
                                activ, zonele rămân goale.
                              </p>
                            ) : (
                              <ul className="divide-y divide-line">
                                {list.map((banner) => {
                                  const zone = zoneById.get(banner.zoneId);
                                  return (
                                    <li
                                      key={banner.id}
                                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
                                    >
                                      <div className="min-w-0 flex-1 basis-56">
                                        <p className="truncate text-[0.8125rem] text-ivory">
                                          {banner.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-[0.6875rem] text-mist">
                                          {zone
                                            ? `${zone.name} · ${zone.width}×${zone.height}`
                                            : "zonă lipsă"}{" "}
                                          · greutate {banner.weight}
                                        </p>
                                      </div>
                                      <Badge
                                        tone={banner.imageUrl ? "gold" : "neutral"}
                                      >
                                        {banner.imageUrl ? "Imagine" : "HTML"}
                                      </Badge>
                                      <Badge tone={banner.active ? "ok" : "neutral"}>
                                        {banner.active ? "activ" : "oprit"}
                                      </Badge>
                                      <div className="ml-auto flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            setBannerEditing({
                                              campaignId: campaign.id,
                                              banner,
                                            })
                                          }
                                        >
                                          Editează
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="quiet"
                                          className="px-2.5 text-mist hover:text-ember"
                                          onClick={() =>
                                            setPendingBannerDelete(banner)
                                          }
                                          aria-label={`Șterge bannerul ${banner.name}`}
                                        >
                                          Șterge
                                        </Button>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </TableScroll>
        )}
      </Panel>

      {/* Formularul campaniei */}
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        busy={saving}
        size="lg"
        kicker={editing ? "Modificare" : "Campanie nouă"}
        title={editing ? editing.name : "Programează o campanie"}
        description="Bannerele campaniei se servesc doar cât timp statusul este „Activă” și data curentă se află în perioadă."
        footer={
          <>
            {formIssue ? (
              <p role="alert" className="mr-auto text-xs text-ember">
                {formIssue}
              </p>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(undefined)}
              disabled={saving}
            >
              Renunță
            </Button>
            <Button variant="gold" size="sm" loading={saving} onClick={() => void save()}>
              Salvează
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nume"
            htmlFor="camp-name"
            required
            error={issues.name}
            className="sm:col-span-2"
          >
            <TextInput
              id="camp-name"
              value={draft.name}
              invalid={Boolean(issues.name)}
              onChange={(event) => patch({ name: event.target.value })}
            />
          </Field>
          <Field
            label="Client"
            htmlFor="camp-advertiser"
            required
            error={issues.advertiserId}
          >
            <Select
              id="camp-advertiser"
              value={draft.advertiserId}
              invalid={Boolean(issues.advertiserId)}
              onChange={(event) => patch({ advertiserId: event.target.value })}
            >
              <option value="">— alege —</option>
              {advertisers.map((advertiser) => (
                <option key={advertiser.id} value={advertiser.id}>
                  {advertiser.companyName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" htmlFor="camp-status" required>
            <Select
              id="camp-status"
              value={draft.status}
              onChange={(event) =>
                patch({ status: event.target.value as AdCampaignStatus })
              }
            >
              {CAMPAIGN_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Început"
            htmlFor="camp-start"
            required
            error={issues.startsAt}
            hint="Ora Chișinăului."
          >
            <TextInput
              id="camp-start"
              type="datetime-local"
              value={draft.startsAt}
              invalid={Boolean(issues.startsAt)}
              onChange={(event) => patch({ startsAt: event.target.value })}
            />
          </Field>
          <Field label="Sfârșit" htmlFor="camp-end" required error={issues.endsAt}>
            <TextInput
              id="camp-end"
              type="datetime-local"
              value={draft.endsAt}
              invalid={Boolean(issues.endsAt)}
              onChange={(event) => patch({ endsAt: event.target.value })}
            />
          </Field>
        </div>
      </Modal>

      {/* Bannerele campaniei */}
      {bannerEditing ? (
        <BannerForm
          open
          banner={bannerEditing.banner}
          zones={zones}
          campaigns={campaigns}
          lockedCampaignId={bannerEditing.campaignId}
          onClose={() => setBannerEditing(null)}
          onSaved={() => reload(["banners", "campaigns", "overview"])}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        kicker="Operațiune ireversibilă"
        title="Ștergi campania?"
        message={
          <>
            <strong className="text-ivory">{pendingDelete?.name}</strong> și
            bannerele ei vor fi eliminate. Dacă are deja statistici, API-ul
            refuză ștergerea — pune-o pe „Încheiată”.
          </>
        }
        confirmLabel="Șterge campania"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={pendingBannerDelete !== null}
        kicker="Operațiune ireversibilă"
        title="Ștergi bannerul?"
        message={
          <>
            <strong className="text-ivory">{pendingBannerDelete?.name}</strong>{" "}
            va fi eliminat împreună cu statisticile lui.
          </>
        }
        confirmLabel="Șterge definitiv"
        busy={deletingBanner}
        onConfirm={() => void confirmBannerDelete()}
        onCancel={() => setPendingBannerDelete(null)}
      />
    </>
  );
}
