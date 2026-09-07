/**
 * Taie HTML-ul unui articol după al N-lea paragraf de nivel superior,
 * ca reclama din corpul textului (`article_inline`) să stea între paragrafe,
 * nu în mijlocul unui citat, al unei liste sau al unui tabel.
 *
 * Nu este un parser HTML complet și nici nu are nevoie să fie: numărăm doar
 * adâncimea etichetelor și acceptăm un `</p>` doar când suntem înapoi la
 * rădăcină. Orice conținut care nu se pretează (mai puține paragrafe decât
 * cerem, marcaj neașteptat) întoarce `null`, iar apelantul randează articolul
 * întreg — reclama nu are voie să strice textul.
 */

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g;

export interface SplitContent {
  head: string;
  tail: string;
}

export function splitAfterParagraph(
  html: string | null | undefined,
  count: number,
): SplitContent | null {
  if (!html || count < 1) return null;

  const re = new RegExp(TAG_RE.source, "g");
  let depth = 0;
  let closed = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    const raw = match[0];
    const name = match[1].toLowerCase();
    if (VOID_TAGS.has(name) || raw.endsWith("/>")) continue;

    if (raw.startsWith("</")) {
      depth -= 1;
      // marcaj dezechilibrat (etichete închise fără pereche): renunțăm
      if (depth < 0) return null;
      if (name === "p" && depth === 0) {
        closed += 1;
        if (closed === count) {
          const at = match.index + raw.length;
          const head = html.slice(0, at);
          const tail = html.slice(at);
          // nu tăiem la ultimul paragraf: reclama ar ajunge oricum la final
          if (tail.trim().length === 0) return null;
          return { head, tail };
        }
      }
    } else {
      depth += 1;
    }
  }

  return null;
}
