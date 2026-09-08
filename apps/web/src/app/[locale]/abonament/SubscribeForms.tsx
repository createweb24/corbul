"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Field, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import type {
  CheckoutResponseDto,
  Locale,
  PartnerTier,
  Plan,
} from "@/lib/types";

/**
 * Cele două fluxuri de plată (SPEC §7 · §4).
 *
 * Amândouă tratează explicit „modul demonstrativ" (`url: null`, `demo: true`),
 * în care API-ul nu are chei Stripe: în loc de o eroare, cititorul primește o
 * notă elegantă și site-ul rămâne funcțional.
 */

type Status = "idle" | "sending" | "demo" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MONTH_OPTIONS = [1, 3, 6, 12];

function Notice({
  tone,
  title,
  text,
  action,
}: {
  tone: "gold" | "error";
  title: string;
  text: string;
  /** buton opțional — în modul demonstrativ duce fluxul până la capăt */
  action?: { href: string; label: string };
}) {
  const isGold = tone === "gold";
  return (
    <div
      role={isGold ? "status" : "alert"}
      className={`mt-6 border-l-2 px-5 py-4 ${
        isGold ? "border-gold bg-gold/10" : "border-ember bg-ember/10"
      }`}
    >
      <p className={`kicker ${isGold ? "" : "text-ember"}`}>{title}</p>
      <p className="mt-2 font-serif text-sm leading-relaxed text-fog">{text}</p>
      {action ? (
        <a
          href={action.href}
          className="press mt-4 inline-flex items-center border border-gold-solid bg-gold-solid px-5 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-on-gold transition-colors hover:border-gold-solid-2 hover:bg-gold-solid-2"
        >
          {action.label}
        </a>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Abonamentul Premium                                                 */
/* ------------------------------------------------------------------ */

export function PremiumPlans({
  monthly,
  annual,
  currency,
}: {
  monthly: number;
  annual: number;
  currency: string;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { error: toastError } = useToast();

  const [plan, setPlan] = useState<Plan>("annual");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  // în modul demonstrativ serverul întoarce calea care activează accesul
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | undefined>();


  const plans: {
    id: Plan;
    label: string;
    price: number;
    period: string;
    note: string;
  }[] = [
    {
      id: "monthly",
      label: t("subscribe.plans.monthly.name"),
      price: monthly,
      period: t("subscribe.plans.monthly.period"),
      note: t("subscribe.plans.monthly.note"),
    },
    {
      id: "annual",
      label: t("subscribe.plans.annual.name"),
      price: annual,
      period: t("subscribe.plans.annual.period"),
      note: t("subscribe.plans.annual.note"),
    },
  ];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError(t("errors.form.email"));
      return;
    }
    setEmailError(undefined);
    setStatus("sending");
    try {
      const response = await apiFetch<CheckoutResponseDto>(
        "/payments/premium/checkout",
        { method: "POST", body: { email: email.trim(), plan, locale } },
      );
      if (response.url) {
        window.location.href = response.url;
        return;
      }
      setMessage(response.message ?? t("subscribe.demo.text"));
      setDemoUrl(response.successUrl ?? null);
      setStatus("demo");
    } catch {
      setStatus("error");
      toastError(t("subscribe.form.error"));
    }
  }

  return (
    <div>
      <div className="grid gap-px bg-line sm:grid-cols-2">
        {plans.map((item) => {
          const active = plan === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => setPlan(item.id)}
              className={`press relative px-6 py-8 text-left transition-colors ${
                active ? "bg-coal-2" : "bg-coal hover:bg-coal-2"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-px ${
                  active ? "bg-gold" : "bg-transparent"
                }`}
              />
              <span className="flex items-center justify-between gap-3">
                <span className="kicker">{item.label}</span>
                <span className="border border-gold/60 px-2 py-0.5 font-sans text-[0.65rem] uppercase tracking-[0.16em] text-gold">
                  {t("subscribe.plans.free")}
                </span>
              </span>

              <span className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {/* prețul de listă rămâne vizibil, dar tăiat — accesul este
                    deocamdată deschis tuturor */}
                <span className="headline text-2xl text-mist line-through decoration-mist/70">
                  {formatNumber(item.price, locale)}{" "}
                  <span className="font-sans text-sm font-medium">
                    {currency} {item.period}
                  </span>
                </span>
                <span className="headline text-4xl tracking-[0.02em] text-gold">
                  GRATIS
                </span>
              </span>

              <span className="meta mt-4 block leading-relaxed">{item.note}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8">
        <Field
          label={t("subscribe.form.emailLabel")}
          name="email"
          type="email"
          required
          value={email}
          error={emailError}
          placeholder={t("subscribe.form.emailPlaceholder")}
          autoComplete="email"
          hint={t("subscribe.form.note")}
          onValueChange={setEmail}
        />

        <div className="mt-6">
          <Button
            variant="gold"
            size="lg"
            type="submit"
            loading={status === "sending"}
            disabled={status === "sending"}
          >
            {status === "sending"
              ? t("subscribe.form.loading")
              : t("subscribe.form.cta")}
          </Button>
        </div>
      </form>

      {status === "demo" ? (
        <Notice
          tone="gold"
          title={t("subscribe.demo.title")}
          text={message || t("subscribe.demo.text")}
          action={
            demoUrl
              ? { href: demoUrl, label: t("subscribe.demo.continue") }
              : undefined
          }
        />
      ) : null}
      {status === "error" ? (
        <Notice
          tone="error"
          title={t("errors.generic")}
          text={t("subscribe.form.error")}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Parteneriate B2B                                                    */
/* ------------------------------------------------------------------ */

const TIERS: PartnerTier[] = ["bronze", "silver", "gold"];
const TIER_FEATURES: Record<PartnerTier, string[]> = {
  bronze: ["f1", "f2", "f3"],
  silver: ["f1", "f2", "f3", "f4"],
  gold: ["f1", "f2", "f3", "f4"],
};

export function PartnerForm({
  tiers,
  currency,
}: {
  tiers: Record<PartnerTier, number>;
  currency: string;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const { error: toastError } = useToast();

  const [tier, setTier] = useState<PartnerTier>("silver");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [months, setMonths] = useState("3");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  // în modul demonstrativ serverul întoarce calea care activează accesul
  const [demoUrl, setDemoUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ company?: string; email?: string }>({});

  const monthCount = Math.min(36, Math.max(1, Number.parseInt(months, 10) || 1));
  const total = tiers[tier] * monthCount;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: { company?: string; email?: string } = {};
    if (company.trim().length < 2) next.company = t("errors.form.required");
    if (!EMAIL_RE.test(email.trim())) next.email = t("errors.form.email");
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus("sending");
    try {
      const response = await apiFetch<CheckoutResponseDto>(
        "/payments/partner/checkout",
        {
          method: "POST",
          body: {
            company: company.trim(),
            contactName: contactName.trim(),
            email: email.trim(),
            tier,
            months: monthCount,
            websiteUrl: websiteUrl.trim() || undefined,
            locale,
          },
        },
      );
      if (response.url) {
        window.location.href = response.url;
        return;
      }
      setMessage(response.message ?? t("subscribe.demo.text"));
      setDemoUrl(response.successUrl ?? null);
      setStatus("demo");
    } catch {
      setStatus("error");
      toastError(t("subscribe.partners.form.error"));
    }
  }

  return (
    <div>
      <div className="grid gap-px bg-line md:grid-cols-3">
        {TIERS.map((id) => {
          const active = tier === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setTier(id)}
              className={`press relative px-6 py-8 text-left transition-colors ${
                active ? "bg-coal-2" : "bg-coal hover:bg-coal-2"
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-px ${
                  active ? "bg-gold" : "bg-transparent"
                }`}
              />
              <span className="kicker">
                {t(`subscribe.partners.tiers.${id}.name`)}
              </span>

              <span className="headline mt-5 block text-3xl text-ivory">
                {formatNumber(tiers[id], locale)}{" "}
                <span className="font-sans text-xs font-medium text-fog">
                  {currency} {t("subscribe.partners.perMonth")}
                </span>
              </span>

              <span className="mt-4 block font-serif text-sm leading-relaxed text-fog">
                {t(`subscribe.partners.tiers.${id}.desc`)}
              </span>

              <span className="mt-5 block space-y-2">
                {TIER_FEATURES[id].map((feature) => (
                  <span key={feature} className="flex gap-2 font-sans text-xs text-mist">
                    <span aria-hidden="true" className="text-gold">
                      ◆
                    </span>
                    <span>{t(`subscribe.partners.tiers.${id}.${feature}`)}</span>
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-10 space-y-5">
        <h3 className="kicker kicker-muted">
          {t("subscribe.partners.form.title")}
        </h3>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label={t("subscribe.partners.form.company")}
            name="company"
            required
            value={company}
            error={errors.company}
            placeholder={t("subscribe.partners.form.companyPlaceholder")}
            autoComplete="organization"
            onValueChange={setCompany}
          />
          <Field
            label={t("subscribe.partners.form.contactName")}
            name="contactName"
            value={contactName}
            placeholder={t("subscribe.partners.form.contactPlaceholder")}
            autoComplete="name"
            onValueChange={setContactName}
          />
          <Field
            label={t("subscribe.partners.form.email")}
            name="email"
            type="email"
            required
            value={email}
            error={errors.email}
            autoComplete="email"
            onValueChange={setEmail}
          />
          <Field
            label={t("subscribe.partners.form.website")}
            name="websiteUrl"
            type="url"
            value={websiteUrl}
            placeholder={t("subscribe.partners.form.websitePlaceholder")}
            onValueChange={setWebsiteUrl}
          />
          <Field
            as="select"
            label={t("subscribe.partners.form.months")}
            name="months"
            value={months}
            onValueChange={setMonths}
            options={MONTH_OPTIONS.map((value) => ({
              value: String(value),
              label: t("subscribe.partners.months", { count: value }),
            }))}
          />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6">
          <p className="font-sans text-sm text-mist">
            <span className="uppercase tracking-[0.16em]">{t("common.total")}</span>
            <span className="headline ml-3 text-3xl text-gold">
              {formatNumber(total, locale)}{" "}
              <span className="font-sans text-sm font-medium text-fog">
                {currency}
              </span>
            </span>
          </p>
          <Button
            variant="gold"
            size="lg"
            type="submit"
            loading={status === "sending"}
            disabled={status === "sending"}
          >
            {status === "sending"
              ? t("subscribe.partners.form.loading")
              : t("subscribe.partners.form.cta")}
          </Button>
        </div>

        <p className="font-sans text-xs leading-relaxed text-mist">
          {t("subscribe.partners.note")}
        </p>
      </form>

      {status === "demo" ? (
        <Notice
          tone="gold"
          title={t("subscribe.demo.title")}
          text={message || t("subscribe.demo.text")}
          action={
            demoUrl
              ? { href: demoUrl, label: t("subscribe.demo.continue") }
              : undefined
          }
        />
      ) : null}
      {status === "error" ? (
        <Notice
          tone="error"
          title={t("errors.generic")}
          text={t("subscribe.partners.form.error")}
        />
      ) : null}
    </div>
  );
}
