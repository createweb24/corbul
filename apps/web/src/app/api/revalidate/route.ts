import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * `POST /api/revalidate` — golește cache-ul ISR al site-ului după o
 * modificare din panoul de administrare (contract C2).
 *
 * Corp gol; antetul `Authorization: Bearer <JWT admin>` este validat prin
 * `GET /auth/me` pe API — ruta nu are secret propriu, refolosește sesiunea
 * redactorului.
 *
 * Se golesc DOAR etichetele folosite de `_lib/data.ts`. Fiecare pagină
 * publică citește prin cel puțin o etichetă, deci invalidarea etichetelor
 * invalidează și HTML-ul prerandat care depindea de ele — este suficient.
 *
 * NU se apelează `revalidatePath("/", "layout")`: segmentul `[locale]` are
 * `dynamicParams = false` cu `generateStaticParams`, iar invalidarea la
 * nivel de layout scoate rutele din manifestul de prerandare al build-ului
 * de producție. Rezultatul era `NoFallbackError` → `/ro` și `/ru` cădeau cu
 * 404-ul generic Next, iar paginile pur statice (ex. `/ro/despre`) cu 500
 * („Page changed from static to dynamic at runtime, reason: headers").
 */

export const dynamic = "force-dynamic";

const API_BASE = process.env.API_URL ?? "http://localhost:4100/api";
const TAGS = ["settings", "articles", "categories", "authors"] as const;

async function isAdmin(authorization: string | null): Promise<boolean> {
  if (!authorization || !/^Bearer\s+\S+/.test(authorization)) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: authorization, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const authorized = await isAdmin(request.headers.get("authorization"));
  if (!authorized) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  for (const tag of TAGS) revalidateTag(tag);

  return NextResponse.json({ ok: true, revalidated: [...TAGS] });
}
