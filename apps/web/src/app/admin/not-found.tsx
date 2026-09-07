import type { Metadata } from "next";
import Link from "next/link";
import { RavenMark } from "@/components/ui/RavenMark";

/**
 * 404 în interiorul panoului — aceeași identitate ca pagina publică
 * (corb, Playfair, linie aurie), dar în română și fără shell-ul public.
 * Rutele necunoscute de sub `/admin` ajung aici prin `[...rest]/page.tsx`.
 */

export const metadata: Metadata = {
  title: "Pagina nu există",
  robots: { index: false, follow: false },
};

const LINK =
  "press inline-flex h-10 items-center border px-4 font-sans text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-200";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <RavenMark size={56} className="mx-auto text-gold opacity-80" title="Corbul.md" />
        <p className="kicker mt-8">Eroare 404</p>
        <h1 className="headline headline-tight mt-4 text-4xl text-ivory md:text-5xl">
          Pagina nu există
        </h1>
        <div className="rule-gold-center mx-auto mt-7 w-20" />
        <p className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-fog">
          Adresa cerută nu face parte din panoul editorial. Poate a fost mutată
          sau ai urmat un link greșit.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/admin/panou"
            className={`${LINK} border-gold-solid bg-gold-solid text-on-gold hover:border-gold-solid-2 hover:bg-gold-solid-2`}
          >
            Înapoi la panou
          </Link>
          <Link
            href="/ro"
            className={`${LINK} border-line-2 text-ivory hover:border-gold/60 hover:bg-coal-2 hover:text-gold`}
          >
            Vezi site-ul
          </Link>
        </div>
      </div>
    </div>
  );
}
