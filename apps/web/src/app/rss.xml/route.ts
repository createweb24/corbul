import { NextResponse } from "next/server";
import { feedPath } from "../_lib/rss";
import { DEFAULT_LOCALE } from "../_lib/site";

/**
 * `GET /rss.xml` — adresa „clasică" a fluxului; căile cu extensie ocolesc
 * middleware-ul i18n, așa că redirecționăm noi spre fluxul limbii implicite.
 * Rămâne dinamică (răspuns gol de 308 — nu are ce pune în cache-ul de
 * prerandare).
 */
export function GET() {
  return NextResponse.redirect(feedPath(DEFAULT_LOCALE), 308);
}
