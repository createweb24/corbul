"use client";

/**
 * Carcasa panoului (SPEC §9): verifică sesiunea, apoi montează navigația.
 *
 * `/admin` (autentificarea) își desenează propriul ecran, deci carcasa se
 * dă la o parte acolo. Pentru orice altă rută: dacă tokenul lipsește sau
 * `GET /api/auth/me` îl refuză, utilizatorul e trimis la login; dacă API-ul
 * pur și simplu nu răspunde, sesiunea NU se pierde — se oferă reîncercarea.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { RavenMark } from "@/components/ui/RavenMark";
import { cn } from "@/components/ui/cn";
import type { AdminUserDto } from "@/lib/types";
import {
  ApiError,
  clearToken,
  errorMessage,
  fetchMe,
  LOGIN_PATH,
  readToken,
} from "../_lib/session";
import { Button, Spinner } from "./ui";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

/* ------------------------------------------------------------------ */
/* Contextul utilizatorului                                            */
/* ------------------------------------------------------------------ */

const AdminUserContext = createContext<AdminUserDto | null>(null);

export function useAdminUser(): AdminUserDto | null {
  return useContext(AdminUserContext);
}

/* ------------------------------------------------------------------ */
/* Navigația                                                           */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NAV: NavItem[] = [
  {
    href: "/admin/panou",
    label: "Panou",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
        <path {...stroke} d="M3 3h6v6H3zM11 3h6v4h-6zM11 9h6v8h-6zM3 11h6v6H3z" />
      </svg>
    ),
  },
  {
    href: "/admin/articole",
    label: "Articole",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
        <path {...stroke} d="M4.5 2.5h11v15h-11zM7 6h6M7 9.5h6M7 13h4" />
      </svg>
    ),
  },
  {
    href: "/admin/autori",
    label: "Autori",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
        <circle {...stroke} cx="10" cy="7" r="3.2" />
        <path {...stroke} d="M3.8 17c.6-3.4 3.1-5 6.2-5s5.6 1.6 6.2 5" />
      </svg>
    ),
  },
  {
    href: "/admin/abonati",
    label: "Abonați",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
        <path {...stroke} d="M2.5 5.5h15v9h-15zM2.5 8.5h15M5 12h3" />
      </svg>
    ),
  },
  {
    href: "/admin/publicitate",
    label: "Publicitate",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
        <path {...stroke} d="M2.5 6.5h9v7h-9zM14 5.5v9M17 3.5v13" />
      </svg>
    ),
  },
  {
    href: "/admin/mesaje",
    label: "Mesaje",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
        <path {...stroke} d="M2.5 4.5h15v11h-15zM2.5 5l7.5 6 7.5-6" />
      </svg>
    ),
  },
  {
    href: "/admin/setari",
    label: "Setări",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
        <circle {...stroke} cx="10" cy="10" r="2.6" />
        <path
          {...stroke}
          d="M10 2.6v2M10 15.4v2M17.4 10h-2M4.6 10h-2M15.2 4.8l-1.4 1.4M6.2 13.8l-1.4 1.4M15.2 15.2l-1.4-1.4M6.2 6.2 4.8 4.8"
        />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/* Ecrane intermediare                                                 */
/* ------------------------------------------------------------------ */

function Curtain({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carcasa                                                             */
/* ------------------------------------------------------------------ */

type GateState = "checking" | "ready" | "offline";

function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<GateState>("checking");
  const [user, setUser] = useState<AdminUserDto | null>(null);
  const [problem, setProblem] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);

  const verify = useCallback(async () => {
    setState("checking");
    if (!readToken()) {
      router.replace(`${LOGIN_PATH}?motiv=lipsa`);
      return;
    }
    try {
      const me = await fetchMe();
      setUser(me);
      setState("ready");
    } catch (error) {
      if (error instanceof ApiError && error.status !== 0) {
        clearToken();
        router.replace(`${LOGIN_PATH}?motiv=expirat`);
        return;
      }
      setProblem(errorMessage(error));
      setState("offline");
    }
  }, [router]);

  useEffect(() => {
    void verify();
  }, [verify]);

  // Meniul mobil se închide la fiecare navigare.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const signOut = useCallback(() => {
    clearToken();
    router.replace(`${LOGIN_PATH}?motiv=iesire`);
  }, [router]);

  if (state === "checking") {
    return (
      <Curtain>
        <RavenMark size={44} className="mx-auto text-gold" />
        <p className="mt-5 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-mist">
          <Spinner className="size-3.5" />
          Verific sesiunea
        </p>
      </Curtain>
    );
  }

  if (state === "offline") {
    return (
      <Curtain>
        <RavenMark size={44} className="mx-auto text-gold" />
        <h1 className="headline mt-5 text-2xl text-ivory">API indisponibil</h1>
        <p className="mt-3 text-sm leading-relaxed text-fog">{problem}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="gold" onClick={() => void verify()}>
            Reîncearcă
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Ieși
          </Button>
        </div>
      </Curtain>
    );
  }

  return (
    <AdminUserContext.Provider value={user}>
      <div className="relative z-10 min-h-dvh lg:flex">
        {/* bara mobilă */}
        <div className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-obsidian/95 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/admin/panou" className="flex items-center gap-2.5">
            <RavenMark size={22} className="text-gold" perch={false} />
            <span className="font-display text-base tracking-tight text-ivory">
              Corbul<span className="text-gold">.md</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
            className="border border-line-2 p-2 text-fog transition-colors hover:border-gold/60 hover:text-gold"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
              {menuOpen ? (
                <path {...stroke} d="M5 5l10 10M15 5L5 15" />
              ) : (
                <path {...stroke} d="M3 6h14M3 10h14M3 14h14" />
              )}
            </svg>
          </button>
        </div>

        {/* navigația laterală */}
        <aside
          className={cn(
            "z-30 shrink-0 border-line bg-coal lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-64 lg:border-r",
            menuOpen ? "block border-b" : "hidden",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="hidden border-b border-line px-5 py-6 lg:block">
              <Link href="/admin/panou" className="flex items-center gap-3">
                <RavenMark size={30} className="text-gold" />
                <span className="min-w-0">
                  <span className="block font-display text-xl leading-none tracking-tight text-ivory">
                    Corbul<span className="text-gold">.md</span>
                  </span>
                  <span className="mt-1.5 block font-sans text-[0.625rem] uppercase tracking-[0.2em] text-mist">
                    Panou editorial
                  </span>
                </span>
              </Link>
            </div>

            <nav aria-label="Secțiunile panoului" className="flex-1 px-3 py-4">
              <ul className="flex flex-col gap-0.5">
                {NAV.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-2.5 font-sans text-[0.8125rem] font-medium tracking-[0.04em] transition-colors duration-200",
                          active
                            ? "bg-coal-2 text-gold"
                            : "text-fog hover:bg-coal-2/60 hover:text-ivory",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute inset-y-0 left-0 w-px transition-colors duration-200",
                            active ? "bg-gold" : "bg-transparent",
                          )}
                        />
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-line px-5 py-4">
              {user ? (
                <div className="mb-3">
                  <p className="truncate text-sm font-semibold text-ivory">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-mist">{user.email}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/ro"
                  className="press inline-flex h-8 items-center border border-line-2 px-3 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-fog transition-colors hover:border-gold/60 hover:text-gold"
                >
                  Vezi site-ul
                </Link>
                <Button size="sm" variant="quiet" onClick={signOut}>
                  Ieși
                </Button>
                <ThemeToggle
                  labelToLight="Comută pe tema luminoasă"
                  labelToDark="Comută pe tema întunecată"
                  className="ml-auto self-center"
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </AdminUserContext.Provider>
  );
}

export function AdminChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin" || pathname === "/admin/";
  if (isLogin) return <>{children}</>;
  return <AuthGate>{children}</AuthGate>;
}
