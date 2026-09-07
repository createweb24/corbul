/**
 * Corbul.md — paywall pentru articolele `premium` (SPEC §4).
 *
 * Extragerea paragrafelor se face pe string, fără parser DOM: conținutul
 * editorial din baza de date e HTML curat, generat de redacție, iar API-ul
 * nu trebuie să depindă de o bibliotecă de parsare.
 */

/** Numărul de paragrafe vizibile pentru un cititor fără abonament activ. */
export const PAYWALL_PARAGRAPHS = 2;

/** Lungimea maximă a variantei de rezervă, când HTML-ul nu are deloc `<p>`. */
const FALLBACK_CHARS = 600;

const PARAGRAPH_RE = /<p\b[^>]*>([\s\S]*?)<\/p\s*>/gi;
const OPEN_PARAGRAPH_RE = /<p\b[^>]*>([\s\S]*)$/i;
const TAG_RE = /<[^>]*>/g;
const ENTITY_SPACE_RE = /&nbsp;|&#160;|&#xa0;/gi;

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Textul dintr-un fragment HTML — folosit doar pentru a decide dacă e gol. */
function textOf(html: string): string {
  return html.replace(TAG_RE, ' ').replace(ENTITY_SPACE_RE, ' ').trim();
}

/**
 * Primele `count` paragrafe `<p>…</p>` dintr-un fragment HTML.
 * Paragrafele goale (doar spații sau `&nbsp;`) sunt sărite.
 */
export function extractParagraphs(
  html: string,
  count: number = PAYWALL_PARAGRAPHS,
): string[] {
  if (!html || count <= 0) return [];

  const found: string[] = [];
  const re = new RegExp(PARAGRAPH_RE.source, 'gi');
  let consumed = 0;
  let match: RegExpExecArray | null = re.exec(html);

  while (match !== null && found.length < count) {
    if (textOf(match[1]).length > 0) found.push(match[0]);
    consumed = re.lastIndex;
    match = re.exec(html);
  }

  // Ultimul paragraf poate fi neînchis (HTML tolerat de browser).
  if (found.length < count) {
    const open = OPEN_PARAGRAPH_RE.exec(html.slice(consumed));
    if (open && textOf(open[1]).length > 0) {
      found.push(`<p>${open[1].trim()}</p>`);
    }
  }

  return found;
}

/**
 * Varianta trunchiată a conținutului: primele `count` paragrafe.
 * Dacă HTML-ul nu conține niciun `<p>`, cade elegant pe textul brut,
 * escapat și împachetat în paragrafe — nu întoarce niciodată gol dacă
 * articolul are conținut.
 */
export function truncateContent(
  html: string,
  count: number = PAYWALL_PARAGRAPHS,
): string {
  const paragraphs = extractParagraphs(html, count);
  if (paragraphs.length > 0) return paragraphs.join('\n');

  const text = textOf(html).replace(/\s+/g, ' ');
  if (!text) return '';

  const clipped =
    text.length > FALLBACK_CHARS
      ? `${text.slice(0, FALLBACK_CHARS).replace(/\s+\S*$/, '')}…`
      : text;

  return `<p>${escapeHtml(clipped)}</p>`;
}

const COOKIE_NAME = 'corbul_reader';

/** Antetul de cititor abonat, permis explicit în CORS de `main.ts`. */
const HEADER_NAME = 'x-reader-token';

interface HeaderCarrier {
  headers?: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string | undefined>;
}

function firstHeader(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return null;
}

/** Citește cookie-ul `corbul_reader` fără dependența `cookie-parser`. */
export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

/**
 * Token-ul opac de cititor: antetul `X-Reader-Token` are prioritate,
 * apoi cookie-ul `corbul_reader`.
 */
export function extractReaderToken(req: HeaderCarrier): string | null {
  const fromCookieParser = req.cookies?.[COOKIE_NAME];
  const headers = req.headers ?? {};

  return (
    firstHeader(headers[HEADER_NAME]) ??
    (typeof fromCookieParser === 'string' && fromCookieParser.trim()
      ? fromCookieParser.trim()
      : null) ??
    readCookie(firstHeader(headers['cookie']), COOKIE_NAME)
  );
}
