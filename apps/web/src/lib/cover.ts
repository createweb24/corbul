/**
 * Coperți generate — SPEC §5.
 *
 * `coverSvg(seed, hue)` întoarce un SVG determinist (același seed → același
 * desen), fără text și fără imagini binare: fundal obsidian în gradient,
 * un pattern geometric ales din `seed % 6`, accente în nuanța categoriei și
 * în auriul de brand, plus silueta discretă a corbului la opacitate 0,12.
 *
 * Se randează cu `dangerouslySetInnerHTML` în `Cover.tsx` și se folosește
 * ca imagine OpenGraph.
 */

export interface CoverOptions {
  w?: number;
  h?: number;
  /** doar pentru accesibilitate (<title>), nu se desenează niciun text */
  title?: string;
  /**
   * Culori explicite, pentru contextele în care SVG-ul nu stă în pagină și
   * `var(--color-*)` nu se poate rezolva: imaginile OpenGraph (documente SVG
   * de sine stătătoare, randate de Satori). În pagină se omite.
   */
  palette?: CoverPalette;
}

export interface CoverPalette {
  gold: string;
  obsidian: string;
  coal: string;
  coal2: string;
}

/** Paleta temei întunecate, în valori literale (OpenGraph). */
export const DARK_COVER_PALETTE: CoverPalette = {
  gold: "#d4af37",
  obsidian: "#0b0d12",
  coal: "#12151d",
  coal2: "#191d28",
};

export const COVER_PATTERNS = [
  "diagonals",
  "circles",
  "bars",
  "waves",
  "grid",
  "rays",
] as const;

export type CoverPattern = (typeof COVER_PATTERNS)[number];

/**
 * Culorile de bază trimit la tokenii temei, nu la valori fixe: coperta este
 * SVG inline în pagină, deci `var(--color-*)` se rezolvă în contextul ei și
 * ilustrația urmează singură tema luminoasă sau întunecată.
 * (Imaginile OpenGraph se generează separat, în `_lib/ogImage.tsx`, unde
 * variabilele CSS nu există — acolo culorile rămân scrise explicit.)
 */
const GOLD = "var(--color-gold)";
const OBSIDIAN = "var(--cover-3)";
const COAL = "var(--cover-2)";
const COAL_2 = "var(--cover-1)";

/** Generator pseudo-aleator determinist (mulberry32). */
function rng(seed: number): () => number {
  let a = (Math.abs(Math.floor(seed)) || 1) + 0x6d2b79f5;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function n(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function accent(hue: number, light = 58, sat = 52, alpha = 1): string {
  const h = ((Math.round(hue) % 360) + 360) % 360;
  return alpha >= 1
    ? `hsl(${h} ${sat}% ${light}%)`
    : `hsl(${h} ${sat}% ${light}% / ${alpha})`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function coverPatternFor(seed: number): CoverPattern {
  const index = ((Math.floor(seed) % COVER_PATTERNS.length) +
    COVER_PATTERNS.length) %
    COVER_PATTERNS.length;
  return COVER_PATTERNS[index];
}

/* ------------------------------------------------------------------ */
/* Pattern-uri                                                         */
/* ------------------------------------------------------------------ */

function diagonals(w: number, h: number, hue: number, rand: () => number) {
  const step = w / 22;
  const lines: string[] = [];
  for (let i = -12; i < 34; i += 1) {
    const x = i * step;
    const thick = rand() > 0.86;
    const gold = rand() > 0.9;
    lines.push(
      `<line x1="${n(x)}" y1="${n(-h * 0.1)}" x2="${n(x + h * 1.2)}" y2="${n(h * 1.1)}" stroke="${
        gold ? GOLD : accent(hue, 60)
      }" stroke-opacity="${gold ? 0.5 : thick ? 0.34 : 0.16}" stroke-width="${
        thick ? n(step * 0.28) : 1
      }"/>`,
    );
  }
  return lines.join("");
}

function circles(w: number, h: number, hue: number, rand: () => number) {
  const cx = w * (0.28 + rand() * 0.16);
  const cy = h * (0.42 + rand() * 0.2);
  const rings: string[] = [];
  const count = 14;
  for (let i = count; i > 0; i -= 1) {
    const r = (i / count) * h * 0.92;
    const gold = i % 5 === 0;
    rings.push(
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${
        gold ? GOLD : accent(hue, 62)
      }" stroke-opacity="${gold ? 0.42 : 0.14}" stroke-width="${gold ? 1.4 : 1}"/>`,
    );
  }
  return rings.join("");
}

function bars(w: number, h: number, hue: number, rand: () => number) {
  const count = 26;
  const gap = w / count;
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const barHeight = h * (0.12 + rand() * 0.82);
    const gold = rand() > 0.88;
    out.push(
      `<rect x="${n(i * gap + gap * 0.18)}" y="${n(h - barHeight)}" width="${n(
        gap * 0.5,
      )}" height="${n(barHeight)}" fill="${gold ? GOLD : accent(hue, 58)}" fill-opacity="${
        gold ? 0.36 : 0.14
      }"/>`,
    );
  }
  return out.join("");
}

function waves(w: number, h: number, hue: number, rand: () => number) {
  const out: string[] = [];
  const count = 11;
  for (let i = 0; i < count; i += 1) {
    const y = h * (0.14 + (i / count) * 0.86);
    const amp = h * (0.03 + rand() * 0.07);
    const gold = i % 4 === 0;
    const segments = 6;
    let d = `M${n(-w * 0.05)} ${n(y)}`;
    for (let s = 0; s < segments; s += 1) {
      const x1 = (-w * 0.05 + (w * 1.1 * (s + 0.5)) / segments).toFixed(2);
      const x2 = (-w * 0.05 + (w * 1.1 * (s + 1)) / segments).toFixed(2);
      const dir = s % 2 === 0 ? -1 : 1;
      d += ` Q${x1} ${n(y + amp * dir)} ${x2} ${n(y)}`;
    }
    out.push(
      `<path d="${d}" fill="none" stroke="${gold ? GOLD : accent(hue, 60)}" stroke-opacity="${
        gold ? 0.4 : 0.16
      }" stroke-width="${gold ? 1.5 : 1}"/>`,
    );
  }
  return out.join("");
}

function grid(w: number, h: number, hue: number, rand: () => number) {
  const cols = 16;
  const rows = 9;
  const out: string[] = [];
  for (let c = 0; c <= cols; c += 1) {
    const x = (c / cols) * w;
    out.push(
      `<line x1="${n(x)}" y1="0" x2="${n(x)}" y2="${n(h)}" stroke="${accent(hue, 60)}" stroke-opacity="0.12" stroke-width="1"/>`,
    );
  }
  for (let r = 0; r <= rows; r += 1) {
    const y = (r / rows) * h;
    out.push(
      `<line x1="0" y1="${n(y)}" x2="${n(w)}" y2="${n(y)}" stroke="${accent(hue, 60)}" stroke-opacity="0.12" stroke-width="1"/>`,
    );
  }
  // câteva celule pline, ca niște date evidențiate într-un tabel
  for (let i = 0; i < 9; i += 1) {
    const c = Math.floor(rand() * cols);
    const r = Math.floor(rand() * rows);
    const gold = rand() > 0.6;
    out.push(
      `<rect x="${n((c / cols) * w)}" y="${n((r / rows) * h)}" width="${n(w / cols)}" height="${n(
        h / rows,
      )}" fill="${gold ? GOLD : accent(hue, 58)}" fill-opacity="${gold ? 0.22 : 0.12}"/>`,
    );
  }
  return out.join("");
}

function rays(w: number, h: number, hue: number, rand: () => number) {
  const ox = w * 0.12;
  const oy = h * 1.05;
  const out: string[] = [];
  const count = 20;
  for (let i = 0; i < count; i += 1) {
    const angle = (-Math.PI / 2) * (0.06 + (i / count) * 0.92) - 0.12;
    const length = h * (1.5 + rand() * 0.8);
    const x = ox + Math.cos(angle) * length * -1;
    const y = oy + Math.sin(angle) * length;
    const gold = i % 6 === 0;
    out.push(
      `<line x1="${n(ox)}" y1="${n(oy)}" x2="${n(Math.abs(x))}" y2="${n(y)}" stroke="${
        gold ? GOLD : accent(hue, 60)
      }" stroke-opacity="${gold ? 0.34 : 0.13}" stroke-width="${gold ? 1.6 : 1}"/>`,
    );
  }
  return out.join("");
}

/* ------------------------------------------------------------------ */
/* Silueta corbului (element de brand, opacitate 0,12)                 */
/* ------------------------------------------------------------------ */

/** Corb cocoțat, în profil (privind spre stânga), într-un sistem 120×120. */
const RAVEN_PARTS = [
  // cioc — pană lungă, ascuțită
  "M31 23 L2 30 L31 37 Z",
  // gât
  "M35 35 C39 46 49 49 55 44 L50 29 Z",
  // corp
  "M50 37 C66 37 78 53 80 71 C82 88 72 100 58 100 C46 100 39 90 38 76 C37 60 42 43 50 37 Z",
  // aripă pliată
  "M53 47 C67 51 75 65 73 82 C67 88 56 84 51 71 Z",
  // coadă lungă, în evantai strâns
  "M71 80 C85 89 100 99 117 105 L111 113 C93 108 76 99 64 91 Z",
  // picioare
  "M55 97 L58 97 L58 111 L55 111 Z",
  "M64 96 L67 96 L67 109 L64 109 Z",
] as const;

function raven(w: number, h: number): string {
  // discret: aproximativ două treimi din înălțime, ancorat jos-dreapta
  const scale = (h * 0.72) / 116;
  const x = w - 120 * scale - w * 0.06;
  const y = h - 116 * scale - h * 0.07;
  const parts = RAVEN_PARTS.map((d) => `<path d="${d}"/>`).join("");
  return (
    `<g opacity="0.12" fill="${GOLD}" transform="translate(${n(x)} ${n(y)}) scale(${n(scale)})">` +
    `<ellipse cx="42" cy="27" rx="12.5" ry="11"/>` +
    parts +
    `</g>`
  );
}

/* ------------------------------------------------------------------ */

export function coverSvg(
  seed: number,
  hue: number,
  opts: CoverOptions = {},
): string {
  const w = opts.w ?? 1200;
  const h = opts.h ?? 675;
  const pattern = coverPatternFor(seed);
  const rand = rng(seed * 2654435761);
  const id = `c${Math.abs(Math.floor(seed))}`;

  const body =
    pattern === "diagonals"
      ? diagonals(w, h, hue, rand)
      : pattern === "circles"
        ? circles(w, h, hue, rand)
        : pattern === "bars"
          ? bars(w, h, hue, rand)
          : pattern === "waves"
            ? waves(w, h, hue, rand)
            : pattern === "grid"
              ? grid(w, h, hue, rand)
              : rays(w, h, hue, rand);

  const title = opts.title
    ? `<title>${escapeXml(opts.title)}</title>`
    : "<title>Corbul.md</title>";

  const markup = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}" width="${n(w)}" height="${n(h)}" role="img" preserveAspectRatio="xMidYMid slice">`,
    title,
    "<defs>",
    `<linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${COAL_2}"/>`,
    `<stop offset="0.55" stop-color="${COAL}"/>`,
    `<stop offset="1" stop-color="${OBSIDIAN}"/>`,
    "</linearGradient>",
    `<radialGradient id="${id}glow" cx="0.22" cy="0.18" r="0.9">`,
    `<stop offset="0" stop-color="${accent(hue, 55, 60)}" stop-opacity="0.34"/>`,
    `<stop offset="0.55" stop-color="${accent(hue, 40, 50)}" stop-opacity="0.10"/>`,
    `<stop offset="1" stop-color="${OBSIDIAN}" stop-opacity="0"/>`,
    "</radialGradient>",
    `<linearGradient id="${id}veil" x1="0" y1="0" x2="0" y2="1">`,
    `<stop offset="0" stop-color="${OBSIDIAN}" stop-opacity="0"/>`,
    `<stop offset="1" stop-color="${OBSIDIAN}" stop-opacity="0.72"/>`,
    "</linearGradient>",
    `<clipPath id="${id}clip"><rect width="${n(w)}" height="${n(h)}"/></clipPath>`,
    "</defs>",
    `<g clip-path="url(#${id}clip)">`,
    `<rect width="${n(w)}" height="${n(h)}" fill="url(#${id}bg)"/>`,
    `<rect width="${n(w)}" height="${n(h)}" fill="url(#${id}glow)"/>`,
    body,
    raven(w, h),
    `<rect width="${n(w)}" height="${n(h)}" fill="url(#${id}veil)"/>`,
    // liniile fine aurii — semnătura vizuală a brandului
    `<rect x="0" y="0" width="${n(w)}" height="2" fill="${GOLD}" fill-opacity="0.55"/>`,
    `<rect x="0" y="${n(h - 1)}" width="${n(w)}" height="1" fill="${GOLD}" fill-opacity="0.28"/>`,
    `<rect x="${n(w * 0.06)}" y="${n(h * 0.12)}" width="1" height="${n(h * 0.76)}" fill="${GOLD}" fill-opacity="0.22"/>`,
    "</g>",
    "</svg>",
  ].join("");

  if (!opts.palette) return markup;

  // Substituție finală pentru contextele fără variabile CSS: șirurile sunt
  // fixe și nu apar în altă parte a marcajului.
  return markup
    .split(GOLD)
    .join(opts.palette.gold)
    .split(COAL_2)
    .join(opts.palette.coal2)
    .split(COAL)
    .join(opts.palette.coal)
    .split(OBSIDIAN)
    .join(opts.palette.obsidian);
}

/** Varianta `data:` — utilă pentru `<img src>` sau imaginea OpenGraph. */
export function coverDataUri(
  seed: number,
  hue: number,
  opts: CoverOptions = {},
): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(coverSvg(seed, hue, opts))}`;
}
