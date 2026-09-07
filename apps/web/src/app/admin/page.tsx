"use client";

/**
 * `/admin` — autentificarea redacției (SPEC §9).
 * Card centrat pe obsidian, marca corbului, e-mail + parolă; tokenul JWT
 * ajunge în `localStorage['corbul_admin_token']`, apoi navigăm spre panou.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { RavenMark } from "@/components/ui/RavenMark";
import { Button, Field, TextInput } from "./_components/ui";
import { useToast } from "./_components/toast";
import {
  errorMessage,
  fetchMe,
  HOME_PATH,
  login,
  readToken,
  type LogoutReason,
} from "./_lib/session";

const REASONS: Record<LogoutReason, string> = {
  lipsa: "Autentifică-te pentru a intra în panou.",
  expirat: "Sesiunea a expirat. Intră din nou în cont.",
  iesire: "Ai ieșit din panou. Pe curând.",
};

export default function AdminLoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("admin@corbul.md");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [probing, setProbing] = useState(true);
  const passwordRef = useRef<HTMLInputElement>(null);

  /* Motivul întoarcerii la login se citește din URL fără `useSearchParams`,
     ca pagina să rămână prerandabilă fără graniță de Suspense. */
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("motiv");
    if (reason && reason in REASONS) {
      setNotice(REASONS[reason as LogoutReason]);
    }
  }, []);

  /* Cine are deja o sesiune validă nu mai vede formularul. */
  useEffect(() => {
    let alive = true;
    if (!readToken()) {
      setProbing(false);
      return;
    }
    fetchMe()
      .then(() => {
        if (alive) router.replace(HOME_PATH);
      })
      .catch(() => {
        if (alive) setProbing(false);
      });
    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!probing) passwordRef.current?.focus();
  }, [probing]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Introdu o adresă de e-mail validă.");
      return;
    }
    if (password.length < 6) {
      setError("Parola are minimum 6 caractere.");
      return;
    }

    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await login(trimmed, password);
      toast.ok(`Bun venit, ${result.user.name}.`);
      router.replace(HOME_PATH);
    } catch (caught) {
      setError(errorMessage(caught, "Autentificare eșuată."));
      setPassword("");
      passwordRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-5 py-14">
      <main className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <RavenMark size={54} className="mx-auto text-gold" title="Corbul.md" />
          <h1 className="headline mt-5 text-3xl text-ivory">
            Corbul<span className="text-gold">.md</span>
          </h1>
          <p className="mt-2 font-sans text-[0.6875rem] uppercase tracking-[0.24em] text-mist">
            Panou editorial
          </p>
        </div>

        <div className="relative border border-line bg-coal px-6 py-7 shadow-panel">
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent"
          />

          {probing ? (
            <p className="py-10 text-center text-xs uppercase tracking-[0.2em] text-mist">
              Verific sesiunea…
            </p>
          ) : (
            <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
              {notice ? (
                <p className="border border-line-2 bg-coal-2 px-3 py-2 text-xs leading-relaxed text-fog">
                  {notice}
                </p>
              ) : null}

              <Field label="E-mail" htmlFor="admin-email" required>
                <TextInput
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  spellCheck={false}
                  value={email}
                  invalid={Boolean(error)}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="redactia@corbul.md"
                />
              </Field>

              <Field label="Parolă" htmlFor="admin-password" required>
                <TextInput
                  ref={passwordRef}
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  invalid={Boolean(error)}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              {error ? (
                <p role="alert" className="text-xs leading-relaxed text-ember">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="gold"
                loading={pending}
                className="mt-1 w-full"
              >
                Intră în panou
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link
            href="/ro"
            className="font-sans text-[0.6875rem] uppercase tracking-[0.18em] text-mist transition-colors hover:text-gold"
          >
            ← Înapoi la site
          </Link>
        </p>
      </main>
    </div>
  );
}
