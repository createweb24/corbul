/**
 * Client HTTP unic pentru API-ul Corbul (SPEC §4).
 *
 * Două căi separate, ca în orice monorepo Next + Nest:
 *   • componentele server folosesc `API_URL`            (rețea internă)
 *   • componentele client și adminul folosesc `NEXT_PUBLIC_API_URL`
 *
 * `apiFetch` aruncă `ApiError` (cu status) — potrivit pentru admin, unde
 * eroarea trebuie arătată. `safeFetch` înghite orice eroare și întoarce
 * `null` — paginile publice trebuie să se randeze și cu API-ul oprit.
 */

const SERVER_BASE = process.env.API_URL ?? "http://localhost:4100/api";
const CLIENT_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100/api";

export function apiBaseUrl(): string {
  return typeof window === "undefined" ? SERVER_BASE : CLIENT_BASE;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type QueryValue = string | number | boolean | null | undefined;

/** `qs({ locale: 'ro', page: 2 })` → `?locale=ro&page=2` (goale ignorate). */
export function qs(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** serializat automat ca JSON dacă nu e string */
  body?: unknown;
  /** JWT de administrator → header `Authorization: Bearer …` */
  token?: string | null;
  /** token opac de cititor abonat → header `X-Reader-Token` */
  readerToken?: string | null;
  /** ISR: secunde de revalidare (implicit 60 pentru GET) */
  revalidate?: number | false;
  /** forțează `cache: 'no-store'` */
  noStore?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** etichete de cache Next (opțional) */
  tags?: string[];
}

function buildRequest(
  path: string,
  opts: ApiFetchOptions,
): { url: string; init: RequestInit } {
  const base = apiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const method = opts.method ?? "GET";

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...opts.headers,
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.readerToken) headers["X-Reader-Token"] = opts.readerToken;

  let body: string | undefined;
  if (opts.body !== undefined && method !== "GET") {
    body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
  }

  const init: RequestInit & {
    next?: { revalidate?: number | false; tags?: string[] };
  } = { method, headers, body, signal: opts.signal };

  const mutating = method !== "GET";
  if (opts.noStore || mutating || opts.revalidate === false) {
    init.cache = "no-store";
  } else {
    init.next = { revalidate: opts.revalidate ?? 60, tags: opts.tags };
  }

  return { url, init };
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (typeof body === "string" && body) return body;
  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return fallback;
}

/**
 * Cerere tipizată. Aruncă `ApiError` la orice răspuns non-2xx
 * sau la indisponibilitatea rețelei.
 */
export async function apiFetch<T>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T> {
  const { url, init } = buildRequest(path, opts);

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (error) {
    throw new ApiError(
      0,
      error instanceof Error ? error.message : "API indisponibil",
    );
  }

  const body = await readBody(res);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      messageFrom(body, `${res.status} ${res.statusText}`),
      body,
    );
  }
  return body as T;
}

/**
 * Variantă tolerantă: întoarce `null` la orice eroare (rețea, 404, 500).
 * Toate call-site-urile publice folosesc `?? []` sau `if (!x) notFound()`.
 */
export async function safeFetch<T>(
  path: string,
  opts: ApiFetchOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, opts);
  } catch {
    return null;
  }
}
