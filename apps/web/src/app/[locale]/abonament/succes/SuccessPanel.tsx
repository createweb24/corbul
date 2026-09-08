"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { PaymentSessionDto } from "@/lib/types";

/**
 * Confirmarea plății.
 *
 * Cookie-ul de cititor se scrie din browser (`document.cookie`): în Next 15 o
 * componentă de server nu are voie să scrie cookie-uri în afara unei acțiuni
 * de server. Serverul îl citește apoi la fiecare cerere de articol premium și
 * îl trimite mai departe către API ca antet `X-Reader-Token`.
 */

const READER_COOKIE = "corbul_reader";
const MAX_AGE_DAYS = 180;
const RETRIES = 4;
const RETRY_MS = 2500;

type State = "loading" | "active" | "pending" | "failed";

function persistReaderToken(token: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${READER_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${
    MAX_AGE_DAYS * 24 * 60 * 60
  }; SameSite=Lax${secure}`;
}

export default function SuccessPanel({ sessionId }: { sessionId: string | null }) {
  const t = useTranslations();

  const [state, setState] = useState<State>(sessionId ? "loading" : "failed");
  const [email, setEmail] = useState<string | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      try {
        const session = await apiFetch<PaymentSessionDto>(
          `/payments/session/${encodeURIComponent(sessionId ?? "")}`,
        );
        if (cancelled) return;
        setEmail(session.email ?? null);

        if (session.accessToken) {
          persistReaderToken(session.accessToken);
          setState("active");
          return;
        }
        if (["complete", "paid", "active"].includes(session.status)) {
          setState("active");
          return;
        }
        // sesiune necunoscută, expirată sau anulată: nu are rost să reîncercăm
        if (["unknown", "expired", "canceled"].includes(session.status)) {
          setState("failed");
          return;
        }

        // plata încă se procesează (webhook-ul nu a ajuns): câteva reîncercări,
        // apoi starea de eșec cu legătura spre redacție — nu un „se încarcă" etern
        attempts.current += 1;
        if (attempts.current < RETRIES) {
          setState("pending");
          timer = setTimeout(check, RETRY_MS);
        } else {
          setState("failed");
        }
      } catch {
        if (!cancelled) setState("failed");
      }
    }

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  const titles: Record<State, string> = {
    loading: t("subscribe.success.pending"),
    active: t("subscribe.success.title"),
    pending: t("subscribe.success.pending"),
    failed: t("subscribe.success.failed"),
  };
  const texts: Record<State, string> = {
    loading: t("common.loading"),
    active: t("subscribe.success.text"),
    pending: t("common.loading"),
    failed: t("errors.tryAgain"),
  };

  return (
    <div className="double-frame mx-auto max-w-2xl px-6 py-14 text-center md:px-14">
      <div className="flex justify-center">
      </div>

      <p className="kicker mt-8">{t("subscribe.success.kicker")}</p>

      <h1
        aria-live="polite"
        className="headline mt-4 text-4xl text-ivory md:text-5xl"
      >
        {titles[state]}
      </h1>

      <div className="rule-gold-center mx-auto mt-6 w-20" />

      <p className="mx-auto mt-6 max-w-lg font-serif text-lg leading-relaxed text-fog">
        {texts[state]}
      </p>

      {state === "active" ? (
        <>
          {email ? (
            <p className="meta mt-5">
              <span className="text-ivory">{email}</span>
            </p>
          ) : null}
          <p className="mx-auto mt-5 max-w-md font-sans text-xs leading-relaxed text-mist">
            {t("subscribe.success.note")}
          </p>
        </>
      ) : null}

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button variant="gold" href="/">
          {t("subscribe.success.cta")}
        </Button>
        {state === "failed" ? (
          <Button variant="ghost" href="/contact">
            {t("contact.kicker")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
