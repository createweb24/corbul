"use client";

/**
 * Fila „AdSense" — rezerva Google: un identificator de client, salvat în
 * setarea `ads`, plus câte un slot pe zonă. Regula serverului: reclama Google
 * apare doar când zona nu are banner direct activ ȘI există și client, și slot.
 */

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/components/ui/cn";
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
  TextInput,
} from "../../_components/ui";
import { adminFetch, errorMessage, revalidateSite } from "../../_lib/session";
import { toAdsenseClientId } from "../_lib/normalize";
import type { AdZoneDto } from "../_lib/types";
import type { AdsStore } from "../_lib/store";
import { TableScroll, Th } from "./bits";

/** `ca-pub-` + cifre. Gol = rezerva Google e oprită complet. */
function isClientId(value: string): boolean {
  return /^ca-pub-\d{10,20}$/.test(value.trim());
}

export function AdsenseTab({ store }: { store: AdsStore }) {
  const toast = useToast();
  const { zones, banners, loading: storeLoading, errors, reload } = store;

  const [clientId, setClientId] = useState("");
  const [savedClientId, setSavedClientId] = useState("");
  const [issue, setIssue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [slots, setSlots] = useState<Record<number, string>>({});
  const [busyZone, setBusyZone] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await adminFetch<unknown>("/admin/settings");
      const value = toAdsenseClientId(raw);
      setClientId(value);
      setSavedClientId(value);
    } catch (caught) {
      setError(
        errorMessage(caught, "Setarea AdSense nu a putut fi încărcată."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Câmpurile de slot pornesc de la valorile din baza de date.
  useEffect(() => {
    setSlots((current) => {
      const next: Record<number, string> = {};
      for (const zone of zones) {
        next[zone.id] = current[zone.id] ?? zone.adsenseSlotId ?? "";
      }
      return next;
    });
  }, [zones]);

  async function saveClientId() {
    const value = clientId.trim();
    if (value && !isClientId(value)) {
      setIssue("Formatul așteptat este ca-pub-0000000000000000.");
      toast.error("Identificatorul AdSense nu este valid.");
      return;
    }
    setIssue(null);
    setSaving(true);
    try {
      await adminFetch("/admin/settings", {
        method: "PUT",
        body: { key: "ads", value: { adsenseClientId: value || null } },
      });
      setSavedClientId(value);
      toast.ok(
        value ? "Identificator AdSense salvat." : "Rezerva AdSense a fost oprită.",
      );
      void revalidateSite();
    } catch (caught) {
      const message = errorMessage(caught, "Setarea nu a putut fi salvată.");
      setIssue(message);
      toast.error("Salvarea a eșuat.", message);
    } finally {
      setSaving(false);
    }
  }

  async function saveSlot(zone: AdZoneDto) {
    const value = (slots[zone.id] ?? "").trim();
    if (value && !/^\d{6,20}$/.test(value)) {
      toast.error(
        "Slotul nu este valid.",
        "Identificatorul unui slot AdSense este format doar din cifre.",
      );
      return;
    }
    setBusyZone(zone.id);
    try {
      await adminFetch(`/admin/ads/zones/${zone.id}`, {
        method: "PUT",
        body: {
          key: zone.key,
          name: zone.name,
          width: zone.width,
          height: zone.height,
          priceMonthly: zone.priceMonthly,
          active: zone.active,
          order: zone.order,
          adsenseSlotId: value || null,
        },
      });
      toast.ok(value ? "Slot salvat." : "Slot eliminat.", zone.name);
      void revalidateSite();
      await reload(["zones"]);
    } catch (caught) {
      toast.error("Slotul nu a fost salvat.", errorMessage(caught));
    } finally {
      setBusyZone(null);
    }
  }

  const activeBannerZones = new Set(
    banners.filter((banner) => banner.active).map((banner) => banner.zoneId),
  );
  const dirtyClientId = clientId.trim() !== savedClientId;

  return (
    <>
      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} onRetry={() => void load()} />
        </div>
      ) : null}

      <Panel className="mb-6">
        <PanelHead
          kicker="Rezervă"
          title="Cont AdSense"
          action={
            savedClientId ? (
              <Badge tone="ok">activ</Badge>
            ) : (
              <Badge tone="neutral">oprit</Badge>
            )
          }
        />
        <div className="px-4 py-5 sm:px-5">
          {loading ? (
            <div className="animate-pulse space-y-3" aria-hidden="true">
              <div className="h-3 w-40 bg-coal-2" />
              <div className="h-9 w-full bg-coal-2" />
            </div>
          ) : (
            <Field
              label="Identificator client"
              htmlFor="adsense-client"
              error={issue}
              hint="Gol = niciun cod Google pe site. Îl găsești în contul AdSense, în forma ca-pub-…"
            >
              <TextInput
                id="adsense-client"
                mono
                spellCheck={false}
                autoComplete="off"
                placeholder="ca-pub-0000000000000000"
                value={clientId}
                invalid={Boolean(issue)}
                onChange={(event) => setClientId(event.target.value)}
              />
            </Field>
          )}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-coal-2/40 px-4 py-3 sm:px-5">
          <p className="text-xs leading-relaxed text-mist">
            Codul Google se încarcă o singură dată pe pagină și doar în zonele
            fără banner direct. Dacă scriptul e blocat, spațiul rămâne gol.
          </p>
          <Button
            variant="gold"
            size="sm"
            loading={saving}
            disabled={loading || !dirtyClientId}
            onClick={() => void saveClientId()}
          >
            Salvează
          </Button>
        </footer>
      </Panel>

      {errors.zones ? (
        <div className="mb-4">
          <ErrorNote
            message={errors.zones}
            onRetry={() => void reload(["zones"])}
          />
        </div>
      ) : null}

      <Panel>
        <PanelHead kicker="Pe zone" title="Sloturi" />
        {storeLoading && zones.length === 0 ? (
          <LoadingRows rows={5} />
        ) : zones.length === 0 ? (
          <EmptyState
            title="Nicio zonă"
            message="Definește întâi zonele, apoi le poți lega sloturi AdSense."
          />
        ) : (
          <TableScroll minWidth="min-w-[48rem]">
            <thead>
              <tr className="border-b border-line-2">
                <Th>Zonă</Th>
                <Th align="right">Dimensiune</Th>
                <Th>Slot AdSense</Th>
                <Th align="right">Se afișează</Th>
                <Th align="right">Acțiune</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {zones.map((zone) => {
                const value = slots[zone.id] ?? "";
                const dirty = value.trim() !== (zone.adsenseSlotId ?? "");
                const covered = activeBannerZones.has(zone.id);
                return (
                  <tr
                    key={zone.id}
                    className={cn(
                      "align-middle transition-colors duration-200 hover:bg-coal-2/40",
                      !zone.active && "opacity-65",
                    )}
                  >
                    <td className="px-3 py-3">
                      <p className="text-[0.8125rem] text-ivory">{zone.name}</p>
                      <p className="mt-0.5 font-mono text-[0.6875rem] text-mist">
                        {zone.key}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-[0.75rem] tabular text-fog">
                      {zone.width} × {zone.height}
                    </td>
                    <td className="px-3 py-3">
                      <TextInput
                        mono
                        spellCheck={false}
                        autoComplete="off"
                        placeholder="fără slot"
                        aria-label={`Slot AdSense pentru ${zone.name}`}
                        value={value}
                        disabled={busyZone === zone.id}
                        onChange={(event) =>
                          setSlots((current) => ({
                            ...current,
                            [zone.id]: event.target.value,
                          }))
                        }
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      {!zone.active ? (
                        <Badge tone="neutral">zonă oprită</Badge>
                      ) : covered ? (
                        <Badge tone="gold">banner direct</Badge>
                      ) : savedClientId && zone.adsenseSlotId ? (
                        <Badge tone="ok">AdSense</Badge>
                      ) : (
                        <Badge tone="warn">gol</Badge>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant={dirty ? "gold" : "ghost"}
                          disabled={!dirty}
                          loading={busyZone === zone.id}
                          onClick={() => void saveSlot(zone)}
                        >
                          Salvează
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableScroll>
        )}
      </Panel>
    </>
  );
}
