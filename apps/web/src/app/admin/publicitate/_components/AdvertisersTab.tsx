"use client";

/**
 * Fila „Clienți" — agenții și companiile care cumpără spațiu. Un client are
 * campanii, iar ștergerea lui le duce cu el (cascadă în Prisma), deci
 * confirmarea o spune limpede.
 */

import { useMemo, useState } from "react";
import { formatDateShort } from "@/lib/format";
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
  TextInput,
} from "../../_components/ui";
import { adminFetch, errorMessage, revalidateSite } from "../../_lib/session";
import { isEmail, isHttpUrl } from "../_lib/labels";
import type { AdvertiserDto, AdvertiserPayload } from "../_lib/types";
import type { AdsStore } from "../_lib/store";
import { FormIssue, RowActions, TableScroll, Th } from "./bits";

interface Draft {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
}

const EMPTY: Draft = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  website: "",
};

export function AdvertisersTab({ store }: { store: AdsStore }) {
  const toast = useToast();
  const { advertisers, campaigns, loading, errors, reload } = store;

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdvertiserDto | null | undefined>(
    undefined,
  );
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [issues, setIssues] = useState<Partial<Record<keyof Draft, string>>>({});
  const [formIssue, setFormIssue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdvertiserDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<number, { total: number; active: number }>();
    for (const campaign of campaigns) {
      const entry = map.get(campaign.advertiserId) ?? { total: 0, active: 0 };
      entry.total += 1;
      if (campaign.status === "ACTIVE") entry.active += 1;
      map.set(campaign.advertiserId, entry);
    }
    return map;
  }, [campaigns]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return advertisers;
    return advertisers.filter((advertiser) =>
      [
        advertiser.companyName,
        advertiser.contactName,
        advertiser.email,
        advertiser.website ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [advertisers, query]);

  function open(advertiser: AdvertiserDto | null) {
    setEditing(advertiser);
    setDraft(
      advertiser
        ? {
            companyName: advertiser.companyName,
            contactName: advertiser.contactName,
            email: advertiser.email,
            phone: advertiser.phone ?? "",
            website: advertiser.website ?? "",
          }
        : EMPTY,
    );
    setIssues({});
    setFormIssue(null);
  }

  function patch(changes: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function validate(): AdvertiserPayload | null {
    const next: Partial<Record<keyof Draft, string>> = {};
    const companyName = draft.companyName.trim();
    const contactName = draft.contactName.trim();
    const email = draft.email.trim().toLowerCase();
    const website = draft.website.trim();

    if (!companyName) next.companyName = "Numele companiei este obligatoriu.";
    if (!contactName) next.contactName = "Persoana de contact este obligatorie.";
    if (!isEmail(email)) next.email = "Adresa de e-mail nu pare validă.";
    if (website && !isHttpUrl(website)) {
      next.website = "Adresă completă, cu http:// sau https://.";
    }
    if (
      advertisers.some(
        (item) => item.email.toLowerCase() === email && item.id !== editing?.id,
      )
    ) {
      next.email = "Există deja un client cu această adresă.";
    }

    setIssues(next);
    if (Object.keys(next).length > 0) {
      setFormIssue("Corectează câmpurile marcate.");
      return null;
    }
    setFormIssue(null);
    return {
      companyName,
      contactName,
      email,
      phone: draft.phone.trim() || null,
      website: website || null,
    };
  }

  async function save() {
    const payload = validate();
    if (!payload || saving) return;
    setSaving(true);
    try {
      if (editing) {
        await adminFetch(`/admin/ads/advertisers/${editing.id}`, {
          method: "PUT",
          body: payload,
        });
        toast.ok("Client actualizat.", payload.companyName);
      } else {
        await adminFetch("/admin/ads/advertisers", {
          method: "POST",
          body: payload,
        });
        toast.ok("Client adăugat.", payload.companyName);
      }
      setEditing(undefined);
      void revalidateSite();
      await reload(["advertisers", "campaigns", "overview"]);
    } catch (caught) {
      const message = errorMessage(caught, "Clientul nu a putut fi salvat.");
      setFormIssue(message);
      toast.error("Salvarea a eșuat.", message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    try {
      await adminFetch(`/admin/ads/advertisers/${pendingDelete.id}`, {
        method: "DELETE",
      });
      toast.ok("Client șters.", pendingDelete.companyName);
      setPendingDelete(null);
      void revalidateSite();
      await reload(["advertisers", "campaigns", "banners", "overview"]);
    } catch (caught) {
      toast.error("Ștergerea a eșuat.", errorMessage(caught));
    } finally {
      setDeleting(false);
    }
  }

  const pendingCount = pendingDelete
    ? (counts.get(pendingDelete.id)?.total ?? 0)
    : 0;

  return (
    <>
      {errors.advertisers ? (
        <div className="mb-4">
          <ErrorNote
            message={errors.advertisers}
            onRetry={() => void reload(["advertisers"])}
          />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după companie, contact sau e-mail…"
            aria-label="Caută clienți"
          />
        </div>
        {query ? (
          <Button variant="quiet" onClick={() => setQuery("")}>
            Golește căutarea
          </Button>
        ) : null}
      </div>

      <Panel>
        <PanelHead
          kicker="Portofoliu"
          title="Clienți"
          action={
            <Button variant="gold" size="sm" onClick={() => open(null)}>
              + Client nou
            </Button>
          }
        />

        {loading && advertisers.length === 0 ? (
          <LoadingRows rows={4} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={query ? "Niciun client găsit" : "Niciun client"}
            message={
              query
                ? "Încearcă alt termen de căutare."
                : "Adaugă prima companie care cumpără spațiu publicitar."
            }
            action={
              query ? undefined : (
                <Button variant="gold" onClick={() => open(null)}>
                  + Client nou
                </Button>
              )
            }
          />
        ) : (
          <TableScroll minWidth="min-w-[54rem]">
            <thead>
              <tr className="border-b border-line-2">
                <Th>Companie</Th>
                <Th>Contact</Th>
                <Th>Site</Th>
                <Th align="right">Campanii</Th>
                <Th align="right">Adăugat</Th>
                <Th align="right">Acțiuni</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((advertiser) => {
                const count = counts.get(advertiser.id);
                return (
                  <tr
                    key={advertiser.id}
                    className="align-top transition-colors duration-200 hover:bg-coal-2/50"
                  >
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => open(advertiser)}
                        className="text-left font-display text-[0.9375rem] leading-snug text-ivory transition-colors hover:text-gold"
                      >
                        {advertiser.companyName}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[0.8125rem] text-fog">
                        {advertiser.contactName || "—"}
                      </p>
                      <a
                        href={`mailto:${advertiser.email}`}
                        className="link-gold mt-0.5 block truncate text-[0.75rem]"
                      >
                        {advertiser.email}
                      </a>
                      {advertiser.phone ? (
                        <p className="mt-0.5 text-[0.75rem] tabular text-mist">
                          {advertiser.phone}
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-56 px-3 py-3">
                      {advertiser.website ? (
                        <a
                          href={advertiser.website}
                          target="_blank"
                          rel="noreferrer nofollow"
                          className="link-gold block truncate text-[0.75rem]"
                        >
                          {advertiser.website}
                        </a>
                      ) : (
                        <span className="text-[0.75rem] text-mist">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      {count && count.total > 0 ? (
                        <span className="inline-flex items-center gap-2">
                          {count.active > 0 ? (
                            <Badge tone="ok">{count.active} active</Badge>
                          ) : null}
                          <span className="text-[0.8125rem] tabular text-fog">
                            {count.total}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[0.8125rem] text-mist">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-[0.75rem] tabular text-mist">
                      {advertiser.createdAt
                        ? formatDateShort(advertiser.createdAt, "ro")
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <RowActions>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => open(advertiser)}
                        >
                          Editează
                        </Button>
                        <Button
                          size="sm"
                          variant="quiet"
                          className="px-2.5 text-mist hover:text-ember"
                          onClick={() => setPendingDelete(advertiser)}
                          aria-label={`Șterge clientul ${advertiser.companyName}`}
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

      <Modal
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        busy={saving}
        kicker={editing ? "Modificare" : "Client nou"}
        title={editing ? editing.companyName : "Adaugă un client"}
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
            label="Companie"
            htmlFor="adv-company"
            required
            error={issues.companyName}
            className="sm:col-span-2"
          >
            <TextInput
              id="adv-company"
              value={draft.companyName}
              invalid={Boolean(issues.companyName)}
              onChange={(event) => patch({ companyName: event.target.value })}
            />
          </Field>
          <Field
            label="Persoană de contact"
            htmlFor="adv-contact"
            required
            error={issues.contactName}
          >
            <TextInput
              id="adv-contact"
              value={draft.contactName}
              invalid={Boolean(issues.contactName)}
              onChange={(event) => patch({ contactName: event.target.value })}
            />
          </Field>
          <Field label="E-mail" htmlFor="adv-email" required error={issues.email}>
            <TextInput
              id="adv-email"
              type="email"
              spellCheck={false}
              autoComplete="off"
              value={draft.email}
              invalid={Boolean(issues.email)}
              onChange={(event) => patch({ email: event.target.value })}
            />
          </Field>
          <Field label="Telefon" htmlFor="adv-phone">
            <TextInput
              id="adv-phone"
              inputMode="tel"
              value={draft.phone}
              onChange={(event) => patch({ phone: event.target.value })}
            />
          </Field>
          <Field
            label="Site"
            htmlFor="adv-website"
            error={issues.website}
            hint="Adresă completă, cu https://."
          >
            <TextInput
              id="adv-website"
              type="url"
              inputMode="url"
              spellCheck={false}
              autoComplete="off"
              placeholder="https://exemplu.md"
              value={draft.website}
              invalid={Boolean(issues.website)}
              onChange={(event) => patch({ website: event.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        kicker="Operațiune ireversibilă"
        title="Ștergi clientul?"
        message={
          <>
            <strong className="text-ivory">{pendingDelete?.companyName}</strong>{" "}
            va fi eliminat definitiv
            {pendingCount > 0
              ? `, împreună cu ${pendingCount} ${
                  pendingCount === 1 ? "campanie" : "campanii"
                } și cu bannerele lor.`
              : "."}
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
