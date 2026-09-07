"use client";

/**
 * Fila „Zone" — cele cinci spații de pe site (CORBUL.MD §1), cu dimensiuni,
 * tarif lunar, slot AdSense de rezervă, ordine și comutator de activare
 * direct din tabel.
 */

import { useState } from "react";
import { formatMoney } from "@/lib/format";
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
  Switch,
  TextInput,
} from "../../_components/ui";
import { adminFetch, errorMessage, revalidateSite } from "../../_lib/session";
import {
  baniToLeiInput,
  intInRange,
  isZoneKey,
  leiInputToBani,
} from "../_lib/labels";
import type { AdZoneDto, AdZonePayload } from "../_lib/types";
import type { AdsStore } from "../_lib/store";
import { FormIssue, RowActions, RowToggle, TableScroll, Th } from "./bits";

interface Draft {
  key: string;
  name: string;
  width: string;
  height: string;
  priceLei: string;
  adsenseSlotId: string;
  order: string;
  active: boolean;
}

const EMPTY: Draft = {
  key: "",
  name: "",
  width: "300",
  height: "250",
  priceLei: "",
  adsenseSlotId: "",
  order: "0",
  active: true,
};

function draftFrom(zone: AdZoneDto): Draft {
  return {
    key: zone.key,
    name: zone.name,
    width: String(zone.width),
    height: String(zone.height),
    priceLei: baniToLeiInput(zone.priceMonthly),
    adsenseSlotId: zone.adsenseSlotId ?? "",
    order: String(zone.order),
    active: zone.active,
  };
}

export function ZonesTab({ store }: { store: AdsStore }) {
  const toast = useToast();
  const { zones, banners, loading, errors, reload } = store;

  const [editing, setEditing] = useState<AdZoneDto | null | undefined>(undefined);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [issues, setIssues] = useState<Partial<Record<keyof Draft, string>>>({});
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyRow, setBusyRow] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdZoneDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  function open(zone: AdZoneDto | null) {
    setEditing(zone);
    setDraft(zone ? draftFrom(zone) : EMPTY);
    setIssues({});
    setFormIssue(null);
  }

  function patch(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function validate(): AdZonePayload | null {
    const next: Partial<Record<keyof Draft, string>> = {};
    const key = draft.key.trim().toLowerCase();
    const name = draft.name.trim();
    const width = intInRange(draft.width, 1, 4000);
    const height = intInRange(draft.height, 1, 4000);
    const order = intInRange(draft.order, 0, 999);
    const price = leiInputToBani(draft.priceLei);

    if (!isZoneKey(key)) {
      next.key = "Litere mici, cifre și liniuță de subliniere (ex.: sidebar_top).";
    }
    if (!name) next.name = "Numele este obligatoriu.";
    if (width === null) next.width = "Lățime între 1 și 4000 px.";
    if (height === null) next.height = "Înălțime între 1 și 4000 px.";
    if (order === null) next.order = "Număr întreg între 0 și 999.";
    if (price === "invalid") next.priceLei = "Sumă pozitivă, în lei.";

    const duplicate = zones.some(
      (zone) => zone.key === key && zone.id !== editing?.id,
    );
    if (duplicate) next.key = "Există deja o zonă cu această cheie.";

    setIssues(next);
    if (Object.keys(next).length > 0 || width === null || height === null || order === null) {
      setFormIssue("Corectează câmpurile marcate.");
      return null;
    }

    setFormIssue(null);
    return {
      key,
      name,
      width,
      height,
      order,
      active: draft.active,
      adsenseSlotId: draft.adsenseSlotId.trim() || null,
      priceMonthly: price === "invalid" ? null : price,
    };
  }

  async function save() {
    const payload = validate();
    if (!payload || saving) return;
    setSaving(true);
    try {
      if (editing) {
        await adminFetch(`/admin/ads/zones/${editing.id}`, {
          method: "PUT",
          body: payload,
        });
        toast.ok("Zonă actualizată.", payload.name);
      } else {
        await adminFetch("/admin/ads/zones", { method: "POST", body: payload });
        toast.ok("Zonă creată.", payload.name);
      }
      setEditing(undefined);
      void revalidateSite();
      await reload(["zones", "overview"]);
    } catch (caught) {
      const message = errorMessage(caught, "Zona nu a putut fi salvată.");
      setFormIssue(message);
      toast.error("Salvarea a eșuat.", message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(zone: AdZoneDto) {
    setBusyRow(zone.id);
    try {
      await adminFetch(`/admin/ads/zones/${zone.id}`, {
        method: "PUT",
        body: { ...zonePayload(zone), active: !zone.active },
      });
      void revalidateSite();
      await reload(["zones", "overview"]);
      toast.ok(
        !zone.active ? "Zonă activată." : "Zonă oprită.",
        zone.name,
      );
    } catch (caught) {
      toast.error(
        "Starea zonei nu a fost salvată.",
        errorMessage(caught),
      );
    } finally {
      setBusyRow(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await adminFetch(`/admin/ads/zones/${pendingDelete.id}`, {
        method: "DELETE",
      });
      toast.ok("Zonă ștearsă.", pendingDelete.name);
      setPendingDelete(null);
      void revalidateSite();
      await reload(["zones", "banners", "overview"]);
    } catch (caught) {
      toast.error(
        "Ștergerea a eșuat.",
        errorMessage(
          caught,
          "Zona are bannere legate de ea și nu poate fi ștearsă.",
        ),
      );
    } finally {
      setDeleting(false);
    }
  }

  const bannersByZone = new Map<number, number>();
  for (const banner of banners) {
    bannersByZone.set(banner.zoneId, (bannersByZone.get(banner.zoneId) ?? 0) + 1);
  }

  return (
    <>
      {errors.zones ? (
        <div className="mb-4">
          <ErrorNote
            message={errors.zones}
            onRetry={() => void reload(["zones"])}
          />
        </div>
      ) : null}

      <Panel>
        <PanelHead
          kicker="Inventar"
          title="Zone publicitare"
          action={
            <Button variant="gold" size="sm" onClick={() => open(null)}>
              + Zonă nouă
            </Button>
          }
        />

        {loading && zones.length === 0 ? (
          <LoadingRows rows={5} />
        ) : zones.length === 0 ? (
          <EmptyState
            title="Nicio zonă definită"
            message="Zonele sunt spațiile în care site-ul cere reclame (`AdSlot`). Fără ele, nimic nu se afișează."
            action={
              <Button variant="gold" onClick={() => open(null)}>
                + Zonă nouă
              </Button>
            }
          />
        ) : (
          <TableScroll minWidth="min-w-[58rem]">
            <thead>
              <tr className="border-b border-line-2">
                <Th className="w-14" align="right">
                  #
                </Th>
                <Th>Zonă</Th>
                <Th align="right">Dimensiune</Th>
                <Th align="right">Tarif lunar</Th>
                <Th>Slot AdSense</Th>
                <Th align="right">Bannere</Th>
                <Th align="right">Stare</Th>
                <Th align="right">Acțiuni</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {zones.map((zone) => (
                <tr
                  key={zone.id}
                  className={cn(
                    "align-top transition-colors duration-200 hover:bg-coal-2/50",
                    !zone.active && "opacity-65",
                  )}
                >
                  <td className="px-3 py-3 text-right text-[0.8125rem] tabular text-mist">
                    {zone.order}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => open(zone)}
                      className="text-left font-display text-[0.9375rem] leading-snug text-ivory transition-colors hover:text-gold"
                    >
                      {zone.name}
                    </button>
                    <p className="mt-0.5 font-mono text-[0.6875rem] text-mist">
                      {zone.key}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-[0.8125rem] tabular text-fog">
                    {zone.width} × {zone.height}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-[0.8125rem] tabular text-ivory">
                    {zone.priceMonthly === null
                      ? "—"
                      : formatMoney(zone.priceMonthly / 100, "ro", "MDL")}
                  </td>
                  <td className="px-3 py-3">
                    {zone.adsenseSlotId ? (
                      <span className="font-mono text-[0.75rem] text-fog">
                        {zone.adsenseSlotId}
                      </span>
                    ) : (
                      <Badge tone="neutral">fără</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-[0.8125rem] tabular text-fog">
                    {bannersByZone.get(zone.id) ?? 0}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <RowToggle
                        on={zone.active}
                        label={`Zona ${zone.name}`}
                        busy={busyRow === zone.id}
                        onToggle={() => void toggleActive(zone)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <RowActions>
                      <Button size="sm" variant="ghost" onClick={() => open(zone)}>
                        Editează
                      </Button>
                      <Button
                        size="sm"
                        variant="quiet"
                        className="px-2.5 text-mist hover:text-ember"
                        onClick={() => setPendingDelete(zone)}
                        aria-label={`Șterge zona ${zone.name}`}
                      >
                        Șterge
                      </Button>
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableScroll>
        )}
      </Panel>

      {/* Formular */}
      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        busy={saving}
        size="lg"
        kicker={editing ? "Modificare" : "Zonă nouă"}
        title={editing ? editing.name : "Adaugă o zonă"}
        description="Cheia este citită de componenta `AdSlot` de pe site; dimensiunile rezervă spațiul în pagină, ca să nu existe salt de layout."
        footer={
          <>
            <FormIssue message={formIssue} />
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
            label="Cheie"
            htmlFor="zone-key"
            required
            error={issues.key}
            hint="Folosită în cod: header_leaderboard, sidebar_top…"
          >
            <TextInput
              id="zone-key"
              mono
              spellCheck={false}
              autoComplete="off"
              value={draft.key}
              invalid={Boolean(issues.key)}
              onChange={(event) => patch({ key: event.target.value })}
            />
          </Field>
          <Field label="Nume" htmlFor="zone-name" required error={issues.name}>
            <TextInput
              id="zone-name"
              value={draft.name}
              invalid={Boolean(issues.name)}
              onChange={(event) => patch({ name: event.target.value })}
            />
          </Field>
          <Field label="Lățime (px)" htmlFor="zone-width" required error={issues.width}>
            <TextInput
              id="zone-width"
              inputMode="numeric"
              value={draft.width}
              invalid={Boolean(issues.width)}
              onChange={(event) => patch({ width: event.target.value })}
            />
          </Field>
          <Field
            label="Înălțime (px)"
            htmlFor="zone-height"
            required
            error={issues.height}
          >
            <TextInput
              id="zone-height"
              inputMode="numeric"
              value={draft.height}
              invalid={Boolean(issues.height)}
              onChange={(event) => patch({ height: event.target.value })}
            />
          </Field>
          <Field
            label="Tarif lunar (lei)"
            htmlFor="zone-price"
            error={issues.priceLei}
            hint="Gol = tarif la cerere. Se stochează în bani (lei × 100)."
          >
            <TextInput
              id="zone-price"
              inputMode="decimal"
              value={draft.priceLei}
              invalid={Boolean(issues.priceLei)}
              onChange={(event) => patch({ priceLei: event.target.value })}
            />
          </Field>
          <Field
            label="Ordine"
            htmlFor="zone-order"
            required
            error={issues.order}
            hint="Ordinea în lista publică de zone."
          >
            <TextInput
              id="zone-order"
              inputMode="numeric"
              value={draft.order}
              invalid={Boolean(issues.order)}
              onChange={(event) => patch({ order: event.target.value })}
            />
          </Field>
          <Field
            label="Slot AdSense"
            htmlFor="zone-slot"
            className="sm:col-span-2"
            hint="Rezerva Google, folosită doar când zona nu are banner direct activ."
          >
            <TextInput
              id="zone-slot"
              mono
              spellCheck={false}
              autoComplete="off"
              placeholder="1234567890"
              value={draft.adsenseSlotId}
              onChange={(event) => patch({ adsenseSlotId: event.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Switch
              checked={draft.active}
              onChange={(next) => patch({ active: next })}
              label="Zonă activă"
              hint="Oprită, zona nu mai este servită nici cu banner, nici cu AdSense."
            />
          </div>

          <div className="sm:col-span-2">
            <PreviewFrame draft={draft} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        kicker="Operațiune ireversibilă"
        title="Ștergi zona?"
        message={
          <>
            <strong className="text-ivory">{pendingDelete?.name}</strong> va
            dispărea din inventar. Bannerele care o folosesc rămân fără spațiu,
            iar `AdSlot` pentru cheia{" "}
            <span className="font-mono text-fog">{pendingDelete?.key}</span> nu va
            mai afișa nimic.
          </>
        }
        confirmLabel="Șterge zona"
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function zonePayload(zone: AdZoneDto): AdZonePayload {
  return {
    key: zone.key,
    name: zone.name,
    width: zone.width,
    height: zone.height,
    adsenseSlotId: zone.adsenseSlotId,
    priceMonthly: zone.priceMonthly,
    active: zone.active,
    order: zone.order,
  };
}

/** Caseta goală, la scara zonei — cât spațiu ocupă efectiv în pagină. */
function PreviewFrame({ draft }: { draft: Draft }) {
  const width = intInRange(draft.width, 1, 4000) ?? 300;
  const height = intInRange(draft.height, 1, 4000) ?? 250;
  const ratio = Math.round((width / height) * 100) / 100;
  return (
    <div className="border border-line bg-coal-2/40 px-4 py-3">
      <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-fog">
        Spațiul rezervat
      </p>
      <p className="mt-1 font-mono text-[0.75rem] text-mist">
        {width} × {height} px · raport {ratio}
      </p>
      <div
        aria-hidden="true"
        className="mt-3 w-full border border-dashed border-line-2 bg-coal"
        style={{ aspectRatio: `${width} / ${height}`, maxHeight: 220 }}
      />
    </div>
  );
}
