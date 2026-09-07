"use client";

/**
 * `/admin/setari` — cheile de configurare seed-uite (SPEC §3): `tagline`,
 * `ticker`, `pricing`, `contact`, plus `social` (profilurile publice, sursa
 * lui `sameAs` din datele structurate). Fiecare secțiune se salvează separat
 * prin `PUT /api/admin/settings {key, value}`, apoi se cere revalidarea
 * site-ului ca schimbarea să fie vizibilă imediat.
 */

import { useCallback, useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";
import type { SettingsDto, SocialSettings } from "@/lib/types";
import { useToast } from "../_components/toast";
import {
  Button,
  ErrorNote,
  Field,
  PageHead,
  Panel,
  PanelHead,
  TextArea,
  TextInput,
} from "../_components/ui";
import { adminFetch, errorMessage, revalidateSite } from "../_lib/session";

type SectionKey = "tagline" | "ticker" | "pricing" | "contact" | "social";

type SocialKey = keyof SocialSettings;

const SOCIAL_FIELDS: { key: SocialKey; label: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/corbul.md" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/corbulmd" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/corbulmd" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/company/corbul-md" },
];

interface Draft {
  taglineRo: string;
  taglineRu: string;
  tickerRo: string;
  tickerRu: string;
  premiumMonthly: string;
  premiumAnnual: string;
  currency: string;
  bronze: string;
  silver: string;
  gold: string;
  contactEmail: string;
  contactPhone: string;
  addressRo: string;
  addressRu: string;
  social: SocialSettings;
}

function draftFrom(settings: SettingsDto): Draft {
  // `social` poate lipsi dintr-un răspuns mai vechi al API-ului — nu blocăm
  // pagina pentru asta, câmpurile pornesc goale.
  const social: Partial<SocialSettings> = settings.social ?? {};
  return {
    social: {
      facebook: social.facebook ?? "",
      telegram: social.telegram ?? "",
      x: social.x ?? "",
      linkedin: social.linkedin ?? "",
    },
    taglineRo: settings.tagline.ro,
    taglineRu: settings.tagline.ru,
    tickerRo: settings.ticker.ro.join("\n"),
    tickerRu: settings.ticker.ru.join("\n"),
    premiumMonthly: String(settings.pricing.premiumMonthly),
    premiumAnnual: String(settings.pricing.premiumAnnual),
    currency: settings.pricing.currency,
    bronze: String(settings.pricing.tiers.bronze),
    silver: String(settings.pricing.tiers.silver),
    gold: String(settings.pricing.tiers.gold),
    contactEmail: settings.contact.email,
    contactPhone: settings.contact.phone,
    addressRo: settings.contact.address_ro,
    addressRu: settings.contact.address_ru,
  };
}

function lines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Întreg strict pozitiv (API-ul refuză 0: „prețurile trebuie să fie > 0”). */
function positiveInt(value: string): number | null {
  const parsed = Number(value.replace(/\s+/g, ""));
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

/** Gol sau adresă absolută `https://…` (aceeași regulă ca în API). */
function isSocialUrl(value: string): boolean {
  if (!value) return true;
  if (!/^https:\/\/\S+$/i.test(value)) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export default function SetariPage() {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<SectionKey | null>(null);
  const [issues, setIssues] = useState<Partial<Record<string, string>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await adminFetch<SettingsDto>("/admin/settings");
      setDraft(draftFrom(settings));
    } catch (caught) {
      setError(errorMessage(caught, "Setările nu au putut fi încărcate."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch(changes: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...changes } : current));
  }

  function patchSocial(key: SocialKey, value: string) {
    setDraft((current) =>
      current ? { ...current, social: { ...current.social, [key]: value } } : current,
    );
  }

  async function persist(key: SectionKey, value: unknown, label: string) {
    setSaving(key);
    try {
      await adminFetch("/admin/settings", {
        method: "PUT",
        body: { key, value },
      });
      toast.ok(`${label} — salvat.`);
      // Site-ul public citește setările din cache ISR: îl invalidăm acum.
      void revalidateSite();
    } catch (caught) {
      toast.error("Salvarea a eșuat.", errorMessage(caught));
    } finally {
      setSaving(null);
    }
  }

  async function saveTagline() {
    if (!draft) return;
    const ro = draft.taglineRo.trim();
    const ru = draft.taglineRu.trim();
    if (!ro || !ru) {
      setIssues({ tagline: "Ambele variante sunt obligatorii." });
      toast.error("Completează taglinele în ambele limbi.");
      return;
    }
    setIssues({});
    await persist("tagline", { ro, ru }, "Tagline");
  }

  async function saveTicker() {
    if (!draft) return;
    setIssues({});
    await persist(
      "ticker",
      { ro: lines(draft.tickerRo), ru: lines(draft.tickerRu) },
      "Banda de ultimă oră",
    );
  }

  async function savePricing() {
    if (!draft) return;
    const premiumMonthly = positiveInt(draft.premiumMonthly);
    const premiumAnnual = positiveInt(draft.premiumAnnual);
    const bronze = positiveInt(draft.bronze);
    const silver = positiveInt(draft.silver);
    const gold = positiveInt(draft.gold);
    const currency = draft.currency.trim().toUpperCase();

    if (
      premiumMonthly === null ||
      premiumAnnual === null ||
      bronze === null ||
      silver === null ||
      gold === null
    ) {
      setIssues({ pricing: "Toate prețurile trebuie să fie numere întregi pozitive." });
      toast.error("Prețurile nu sunt valide.");
      return;
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      setIssues({ pricing: "Codul valutei are exact trei litere (ex.: MDL)." });
      toast.error("Codul valutei nu este valid.");
      return;
    }

    setIssues({});
    await persist(
      "pricing",
      {
        premiumMonthly,
        premiumAnnual,
        currency,
        tiers: { bronze, silver, gold },
      },
      "Prețuri",
    );
  }

  async function saveContact() {
    if (!draft) return;
    const email = draft.contactEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setIssues({ contact: "Adresa de e-mail nu pare validă." });
      toast.error("Adresa de e-mail nu este validă.");
      return;
    }
    setIssues({});
    await persist(
      "contact",
      {
        email,
        phone: draft.contactPhone.trim(),
        address_ro: draft.addressRo.trim(),
        address_ru: draft.addressRu.trim(),
      },
      "Date de contact",
    );
  }

  async function saveSocial() {
    if (!draft) return;
    const value: SocialSettings = {
      facebook: draft.social.facebook.trim(),
      telegram: draft.social.telegram.trim(),
      x: draft.social.x.trim(),
      linkedin: draft.social.linkedin.trim(),
    };
    const invalid = SOCIAL_FIELDS.filter((field) => !isSocialUrl(value[field.key]));
    if (invalid.length > 0) {
      setIssues({
        social: `Adresele trebuie să înceapă cu https:// (${invalid
          .map((field) => field.label)
          .join(", ")}) sau să rămână goale.`,
      });
      toast.error("Profilurile sociale nu sunt valide.");
      return;
    }
    setIssues({});
    patch({ social: value });
    await persist("social", value, "Profiluri sociale");
  }

  if (loading && !draft) {
    return (
      <>
        <PageHead kicker="Configurare" title="Setări" />
        <Panel>
          <div className="animate-pulse space-y-3 p-6">
            <div className="h-4 w-40 bg-coal-2" />
            <div className="h-9 w-full bg-coal-2" />
            <div className="h-9 w-full bg-coal-2" />
          </div>
        </Panel>
      </>
    );
  }

  if (!draft) {
    return (
      <>
        <PageHead kicker="Configurare" title="Setări" />
        <ErrorNote
          message={error ?? "Setările nu au putut fi încărcate."}
          onRetry={() => void load()}
        />
      </>
    );
  }

  const monthly = positiveInt(draft.premiumMonthly);
  const annual = positiveInt(draft.premiumAnnual);
  const savedPerYear =
    monthly !== null && annual !== null ? monthly * 12 - annual : null;

  return (
    <>
      <PageHead
        kicker="Configurare"
        title="Setări"
        description="Valorile citite de site din baza de date: identitatea editorială, banda de ultimă oră, prețurile, datele de contact și profilurile sociale."
      />

      {error ? (
        <div className="mb-4">
          <ErrorNote message={error} onRetry={() => void load()} />
        </div>
      ) : null}

      <div className="flex flex-col gap-6">
        {/* ---------------------------------------------------------- */}
        <Panel>
          <PanelHead kicker="Identitate" title="Tagline" />
          <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-2">
            <Field label="Română" htmlFor="tagline-ro" required>
              <TextArea
                id="tagline-ro"
                rows={2}
                value={draft.taglineRo}
                onChange={(event) => patch({ taglineRo: event.target.value })}
              />
            </Field>
            <Field label="Русский" htmlFor="tagline-ru" required>
              <TextArea
                id="tagline-ru"
                rows={2}
                value={draft.taglineRu}
                onChange={(event) => patch({ taglineRu: event.target.value })}
              />
            </Field>
          </div>
          <SectionFooter
            note="Apare sub logotip, în masthead."
            issue={issues.tagline}
            saving={saving === "tagline"}
            onSave={() => void saveTagline()}
          />
        </Panel>

        {/* ---------------------------------------------------------- */}
        <Panel>
          <PanelHead kicker="Ultima oră" title="Banda rulantă" />
          <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-2">
            <Field
              label="Română"
              htmlFor="ticker-ro"
              hint={`Un titlu pe linie. Acum: ${lines(draft.tickerRo).length}.`}
            >
              <TextArea
                id="ticker-ro"
                rows={7}
                value={draft.tickerRo}
                onChange={(event) => patch({ tickerRo: event.target.value })}
              />
            </Field>
            <Field
              label="Русский"
              htmlFor="ticker-ru"
              hint={`Câte un titlu pe linie. Acum: ${lines(draft.tickerRu).length}.`}
            >
              <TextArea
                id="ticker-ru"
                rows={7}
                value={draft.tickerRu}
                onChange={(event) => patch({ tickerRu: event.target.value })}
              />
            </Field>
          </div>
          <SectionFooter
            note="Titlurile marcate „breaking” se adaugă automat peste aceste rânduri."
            issue={issues.ticker}
            saving={saving === "ticker"}
            onSave={() => void saveTicker()}
          />
        </Panel>

        {/* ---------------------------------------------------------- */}
        <Panel>
          <PanelHead kicker="Venituri" title="Prețuri" />
          <div className="px-4 py-5 sm:px-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Premium lunar" htmlFor="price-monthly" required>
                <TextInput
                  id="price-monthly"
                  inputMode="numeric"
                  value={draft.premiumMonthly}
                  onChange={(event) => patch({ premiumMonthly: event.target.value })}
                />
              </Field>
              <Field label="Premium anual" htmlFor="price-annual" required>
                <TextInput
                  id="price-annual"
                  inputMode="numeric"
                  value={draft.premiumAnnual}
                  onChange={(event) => patch({ premiumAnnual: event.target.value })}
                />
              </Field>
              <Field label="Valută" htmlFor="price-currency" required hint="Cod ISO din 3 litere.">
                <TextInput
                  id="price-currency"
                  maxLength={3}
                  value={draft.currency}
                  onChange={(event) => patch({ currency: event.target.value })}
                />
              </Field>
            </div>

            {savedPerYear !== null && savedPerYear > 0 ? (
              <p className="mt-3 text-xs text-mist">
                Abonamentul anual economisește{" "}
                <span className="text-gold">
                  {formatMoney(savedPerYear, "ro", draft.currency.trim().toUpperCase() || "MDL")}
                </span>{" "}
                față de 12 luni plătite separat.
              </p>
            ) : null}

            <p className="kicker mt-6 mb-3">Pachete de parteneriat</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Bronz" htmlFor="tier-bronze" required>
                <TextInput
                  id="tier-bronze"
                  inputMode="numeric"
                  value={draft.bronze}
                  onChange={(event) => patch({ bronze: event.target.value })}
                />
              </Field>
              <Field label="Argint" htmlFor="tier-silver" required>
                <TextInput
                  id="tier-silver"
                  inputMode="numeric"
                  value={draft.silver}
                  onChange={(event) => patch({ silver: event.target.value })}
                />
              </Field>
              <Field label="Aur" htmlFor="tier-gold" required>
                <TextInput
                  id="tier-gold"
                  inputMode="numeric"
                  value={draft.gold}
                  onChange={(event) => patch({ gold: event.target.value })}
                />
              </Field>
            </div>
          </div>
          <SectionFooter
            note="Sumele sunt în unități întregi de valută, așa cum le trimite Stripe Checkout."
            issue={issues.pricing}
            saving={saving === "pricing"}
            onSave={() => void savePricing()}
          />
        </Panel>

        {/* ---------------------------------------------------------- */}
        <Panel>
          <PanelHead kicker="Redacție" title="Date de contact" />
          <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-2">
            <Field label="E-mail" htmlFor="contact-email" required>
              <TextInput
                id="contact-email"
                type="email"
                spellCheck={false}
                value={draft.contactEmail}
                onChange={(event) => patch({ contactEmail: event.target.value })}
              />
            </Field>
            <Field label="Telefon" htmlFor="contact-phone">
              <TextInput
                id="contact-phone"
                value={draft.contactPhone}
                onChange={(event) => patch({ contactPhone: event.target.value })}
              />
            </Field>
            <Field label="Adresă (RO)" htmlFor="contact-address-ro">
              <TextInput
                id="contact-address-ro"
                value={draft.addressRo}
                onChange={(event) => patch({ addressRo: event.target.value })}
              />
            </Field>
            <Field label="Адрес (RU)" htmlFor="contact-address-ru">
              <TextInput
                id="contact-address-ru"
                value={draft.addressRu}
                onChange={(event) => patch({ addressRu: event.target.value })}
              />
            </Field>
          </div>
          <SectionFooter
            note="Folosite în subsol, pe pagina de contact și în datele structurate."
            issue={issues.contact}
            saving={saving === "contact"}
            onSave={() => void saveContact()}
          />
        </Panel>

        {/* ---------------------------------------------------------- */}
        <Panel>
          <PanelHead kicker="Prezență publică" title="Profiluri sociale" />
          <div className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-2">
            {SOCIAL_FIELDS.map((field) => {
              const value = draft.social[field.key];
              const invalid = Boolean(issues.social) && !isSocialUrl(value.trim());
              return (
                <Field
                  key={field.key}
                  label={field.label}
                  htmlFor={`social-${field.key}`}
                  hint="Gol = profilul nu este afișat."
                >
                  <TextInput
                    id={`social-${field.key}`}
                    type="url"
                    inputMode="url"
                    spellCheck={false}
                    autoComplete="off"
                    value={value}
                    invalid={invalid}
                    placeholder={field.placeholder}
                    onChange={(event) => patchSocial(field.key, event.target.value)}
                  />
                </Field>
              );
            })}
          </div>
          <SectionFooter
            note="Adrese complete (https://). Intră în JSON-LD ca „sameAs” al organizației — semnal de autoritate pentru motoarele de căutare."
            issue={issues.social}
            saving={saving === "social"}
            onSave={() => void saveSocial()}
          />
        </Panel>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function SectionFooter({
  note,
  issue,
  saving,
  onSave,
}: {
  note: string;
  issue?: string;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-coal-2/40 px-4 py-3 sm:px-5">
      <p className="text-xs leading-relaxed text-mist">
        {issue ? <span className="text-ember">{issue}</span> : note}
      </p>
      <Button variant="gold" size="sm" loading={saving} onClick={onSave}>
        Salvează
      </Button>
    </footer>
  );
}
