/**
 * Sesiunea de administrare (SPEC §9).
 *
 * Tokenul JWT emis de `POST /api/auth/login` trăiește în
 * `localStorage['corbul_admin_token']`. Toate cererile spre `/api/admin/*`
 * trec prin `adminFetch`, care îl atașează ca `Authorization: Bearer` și
 * care, la un 401/403, șterge tokenul și trimite utilizatorul la login.
 */

import { ApiError, apiFetch, type ApiFetchOptions } from "@/lib/api";
import type { AdminUserDto, LoginResponseDto } from "@/lib/types";

export const ADMIN_TOKEN_KEY = "corbul_admin_token";
export const LOGIN_PATH = "/admin";
export const HOME_PATH = "/admin/panou";

/** Motivul întoarcerii la ecranul de autentificare (`?motiv=`). */
export type LogoutReason = "lipsa" | "expirat" | "iesire";

/* ------------------------------------------------------------------ */
/* Depozitul de token                                                  */
/* ------------------------------------------------------------------ */

export function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    return value && value.trim() ? value : null;
  } catch {
    // Safari în navigare privată aruncă la accesarea localStorage.
    return null;
  }
}

export function writeToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    /* fără persistență: sesiunea rămâne validă doar pe pagina curentă */
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* nimic de curățat */
  }
}

/* ------------------------------------------------------------------ */
/* Ieșirea forțată                                                     */
/* ------------------------------------------------------------------ */

let redirecting = false;

/**
 * Șterge sesiunea și duce la ecranul de autentificare.
 * Navigarea e „hard" intenționat: golește orice stare rămasă în memorie.
 */
export function forceLogin(reason: LogoutReason = "expirat"): void {
  clearToken();
  if (typeof window === "undefined" || redirecting) return;
  redirecting = true;
  window.location.replace(`${LOGIN_PATH}?motiv=${reason}`);
}

/* ------------------------------------------------------------------ */
/* Cereri                                                              */
/* ------------------------------------------------------------------ */

export type AdminFetchOptions = Omit<ApiFetchOptions, "token" | "readerToken">;

/** Cerere autentificată. Aruncă `ApiError`; la 401/403 face și logout. */
export async function adminFetch<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<T> {
  const token = readToken();
  if (!token) {
    forceLogin("lipsa");
    throw new ApiError(401, "Sesiunea a expirat. Autentifică-te din nou.");
  }

  try {
    return await apiFetch<T>(path, { ...opts, token, noStore: true });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      forceLogin("expirat");
    }
    throw error;
  }
}

/** Cerere publică (health, categorii) — fără token, fără logout automat. */
export async function publicFetch<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<T> {
  return apiFetch<T>(path, { ...opts, noStore: true });
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponseDto> {
  const result = await apiFetch<LoginResponseDto>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  writeToken(result.token);
  return result;
}

/** Validează tokenul curent. Întoarce utilizatorul sau aruncă. */
export async function fetchMe(): Promise<AdminUserDto> {
  const token = readToken();
  if (!token) throw new ApiError(401, "Sesiune inexistentă");
  return apiFetch<AdminUserDto>("/auth/me", { token, noStore: true });
}

/* ------------------------------------------------------------------ */
/* Revalidarea site-ului public                                        */
/* ------------------------------------------------------------------ */

/**
 * Cere serverului Next (aceeași origine) să invalideze cache-ul ISR după o
 * mutație reușită, ca schimbările din panou să apară imediat pe site, nu
 * după 5–15 minute. `POST /api/revalidate` verifică tokenul cu `/auth/me`.
 * Niciodată nu aruncă și nu blochează interfața: o revalidare ratată
 * înseamnă doar că site-ul se actualizează la următorul ciclu ISR.
 */
export async function revalidateSite(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/revalidate", {
      method: "POST",
      headers: { Authorization: `Bearer ${readToken() ?? ""}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`Revalidarea site-ului a eșuat (${res.status}).`);
    }
  } catch (error) {
    console.warn("Revalidarea site-ului a eșuat.", error);
  }
}

/* ------------------------------------------------------------------ */
/* Erori                                                               */
/* ------------------------------------------------------------------ */

/** Mesaj lizibil în română pentru orice eroare venită din API. */
export function errorMessage(
  error: unknown,
  fallback = "Ceva nu a mers. Încearcă din nou.",
): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return "API-ul nu răspunde. Verifică dacă serverul de pe portul 4100 rulează.";
    }
    if (error.status === 401) return "Sesiunea a expirat. Autentifică-te din nou.";
    if (error.status === 403) return "Nu ai dreptul să faci această operațiune.";
    if (error.status === 404) return "Resursa nu a fost găsită.";
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export { ApiError };
