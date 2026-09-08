"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button, Container } from "@/components/ui";

/**
 * Limita de eroare a segmentului public. Nu expune niciodată mesajul brut al
 * excepției — doar `digest`, util pentru corelarea cu jurnalele serverului.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    console.error("[corbul] eroare de randare:", error);
  }, [error]);

  return (
    <Container size="narrow" className="py-24 lg:py-36">
      <div className="mx-auto max-w-2xl text-center">
        <div className="flex justify-center opacity-70">
        </div>

        <p className="kicker mt-10 text-ember">{t("errors.serverError.kicker")}</p>

        <h1 className="headline headline-tight mt-4 text-4xl text-ivory md:text-5xl">
          {t("errors.serverError.title")}
        </h1>

        <div className="rule-gold-center mx-auto mt-7 w-20" />

        <p className="mx-auto mt-7 max-w-lg font-serif text-lg leading-relaxed text-fog">
          {t("errors.serverError.text")}
        </p>

        {error.digest ? (
          <p className="meta mt-6 uppercase tracking-[0.16em]">
            <span className="text-fog">{error.digest}</span>
          </p>
        ) : null}

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button variant="gold" onClick={reset}>
            {t("errors.serverError.cta")}
          </Button>
          <Button variant="ghost" href="/">
            {t("errors.serverError.home")}
          </Button>
        </div>
      </div>
    </Container>
  );
}
