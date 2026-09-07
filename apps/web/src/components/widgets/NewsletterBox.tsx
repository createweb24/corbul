"use client";

import { useId, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api";
import type { OkDto } from "@/lib/types";

/**
 * Înscriere la buletinul editorial — `POST /api/newsletter`.
 * Două variante vizuale: card de sidebar și bandă compactă de subsol.
 * Starea se anunță și asistiv (`role="status"`, `aria-live="polite"`);
 * sub câmp stă trimiterea la politica de confidențialitate.
 */

export type NewsletterVariant = "sidebar" | "footer";

export interface NewsletterBoxProps {
  variant?: NewsletterVariant;
  className?: string;
  /** ancoră opțională (subsolul o folosește pentru legătura „Buletin") */
  id?: string;
}

type Status = "idle" | "loading" | "success" | "error" | "invalid";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterBox({
  variant = "sidebar",
  className,
  id,
}: NewsletterBoxProps) {
  const t = useTranslations("widgets.newsletter");
  const tFooter = useTranslations("footer.newsletter");
  const tc = useTranslations("common");
  const locale = useLocale();
  const fieldId = useId();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const compact = variant === "footer";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("invalid");
      return;
    }
    setStatus("loading");
    try {
      await apiFetch<OkDto>("/newsletter", {
        method: "POST",
        body: { email: value, locale },
      });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  const message =
    status === "success"
      ? t("success")
      : status === "error"
        ? t("error")
        : status === "invalid"
          ? t("invalid")
          : null;

  const messageTone =
    status === "success"
      ? "text-sage"
      : status === "idle" || status === "loading"
        ? "text-mist"
        : "text-ember";

  const form = (
    <form onSubmit={onSubmit} noValidate className="mt-3">
      <label htmlFor={fieldId} className="sr-only">
        {t("title")}
      </label>
      <div
        className={
          compact
            ? "flex flex-col gap-2 sm:flex-row"
            : "flex flex-col gap-2"
        }
      >
        <input
          id={fieldId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("placeholder")}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status !== "idle" && status !== "loading") setStatus("idle");
          }}
          aria-invalid={status === "invalid" || status === "error"}
          className="min-w-0 flex-1 rounded-[var(--radius)] border border-line bg-obsidian px-3 py-2 text-[13px] text-ivory placeholder:text-mist outline-none transition-colors duration-200 focus:border-gold focus:ring-1 focus:ring-gold/40"
        />
        <Button
          type="submit"
          variant="gold"
          size="sm"
          loading={status === "loading"}
          className="shrink-0"
          fullWidth={!compact}
        >
          {status === "loading" ? t("sending") : t("cta")}
        </Button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`mt-2 text-[11px] leading-snug ${messageTone}`}
      >
        {message ?? t("privacy")}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-mist">
        {tc.rich("privacyConsent", {
          link: (chunks) => (
            <Link
              href="/confidentialitate"
              className="underline decoration-line-2 underline-offset-2 transition-colors duration-200 hover:text-gold"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );

  if (compact) {
    // În subsol textul e mai scurt decât în sidebar: aceeași pagină nu repetă
    // de două ori aceleași fraze.
    return (
      <div id={id} className={className}>
        <h3 className="font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-tight text-ivory">
          {tFooter("title")}
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-fog">
          {tFooter("text")}
        </p>
        {form}
      </div>
    );
  }

  return (
    <section
      id={id}
      className={`border border-line bg-coal px-4 py-4 ${className ?? ""}`}
      aria-labelledby={`${fieldId}-title`}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
        {t("kicker")}
      </p>
      <h2
        id={`${fieldId}-title`}
        className="mt-1 font-[family-name:var(--font-display)] text-[17px] font-semibold tracking-tight text-ivory"
      >
        {t("title")}
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-fog">{t("text")}</p>
      {form}
    </section>
  );
}

export default NewsletterBox;
