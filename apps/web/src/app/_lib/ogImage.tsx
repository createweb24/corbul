import { ImageResponse } from "next/og";
import { coverSvg, DARK_COVER_PALETTE } from "@/lib/cover";

/**
 * Imaginea OpenGraph a site-ului: coperta generată de `lib/cover.ts`
 * (aceeași semnătură vizuală ca a articolelor) peste care se așază
 * logotipul și linia aurie.
 *
 * Randarea este partajată de cele două rute-convenție care o expun:
 *   • `src/app/opengraph-image.tsx`          → /opengraph-image
 *   • `src/app/[locale]/opengraph-image.tsx` → /ro/opengraph-image, /ru/…
 * A doua există pentru că middleware-ul i18n redirecționează orice cale
 * fără prefix de limbă și fără extensie — inclusiv `/opengraph-image`.
 */

export const OG_ALT = "Corbul.md — investigație și analiză din Republica Moldova";
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const KICKER: Record<string, string> = {
  ro: "Investigație · Analiză · Republica Moldova",
  ru: "Расследования · Аналитика · Республика Молдова",
};

export function renderOgImage(locale = "ro"): ImageResponse {
  const svg = coverSvg(42, 42, {
    w: OG_SIZE.width,
    h: OG_SIZE.height,
    title: "Corbul.md",
    // imaginea socială rămâne în registrul întunecat al mărcii
    palette: DARK_COVER_PALETTE,
  });
  const background = `data:image/svg+xml;base64,${Buffer.from(svg, "utf-8").toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0b0d12",
        }}
      >
        {/* Satori, nu DOM: `next/image` nu are ce optimiza aici. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={background}
          alt=""
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "72px 80px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: 6,
              color: "#d4af37",
              textTransform: "uppercase",
            }}
          >
            {KICKER[locale] ?? KICKER.ro}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 132,
              fontWeight: 700,
              color: "#f3f0e7",
              letterSpacing: -4,
            }}
          >
            CORBUL
            <span style={{ color: "#d4af37" }}>.md</span>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 34,
              width: 180,
              height: 3,
              backgroundColor: "#d4af37",
            }}
          />
        </div>
      </div>
    ),
    OG_SIZE,
  );
}

/* ------------------------------------------------------------------ */
/* Imaginea OG a unui articol                                          */
/* ------------------------------------------------------------------ */

export interface ArticleOgInput {
  locale: string;
  title: string;
  category: string;
  author: string;
  date: string;
  coverSeed: number;
  hue: number;
  premium?: boolean;
}

const PREMIUM_LABEL: Record<string, string> = { ro: "Premium", ru: "Premium" };

/** Mărimea titlului scade cu lungimea, ca să încapă în cel mult trei rânduri. */
function titleSize(title: string): number {
  if (title.length <= 50) return 72;
  if (title.length <= 80) return 60;
  if (title.length <= 110) return 52;
  return 44;
}

/**
 * Coperta articolului (aceeași ca pe pagină: `coverSvg(coverSeed, hue)`)
 * peste care se așază rubrica, titlul, autorul, data și logotipul —
 * imaginea pe care o vede cititorul când materialul e distribuit pe
 * Facebook, Telegram, X sau LinkedIn.
 */
export function renderArticleOgImage(input: ArticleOgInput): ImageResponse {
  const svg = coverSvg(input.coverSeed, input.hue, {
    w: OG_SIZE.width,
    h: OG_SIZE.height,
    title: input.title,
    palette: DARK_COVER_PALETTE,
  });
  const background = `data:image/svg+xml;base64,${Buffer.from(svg, "utf-8").toString("base64")}`;
  const accent = `hsl(${input.hue} 70% 62%)`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0b0d12",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={background}
          alt=""
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        {/* voal întunecat spre bază, ca textul să rămână lizibil pe orice pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage:
              "linear-gradient(180deg, rgba(11,13,18,0.25) 0%, rgba(11,13,18,0.72) 55%, rgba(11,13,18,0.94) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 72px 60px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontSize: 22,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: accent,
            }}
          >
            <div style={{ display: "flex", width: 10, height: 10, backgroundColor: accent }} />
            <div style={{ display: "flex" }}>{input.category}</div>
            {input.premium ? (
              <div
                style={{
                  display: "flex",
                  marginLeft: 8,
                  padding: "4px 12px",
                  border: "1px solid #d4af37",
                  color: "#d4af37",
                  fontSize: 18,
                  letterSpacing: 4,
                }}
              >
                {PREMIUM_LABEL[input.locale] ?? PREMIUM_LABEL.ro}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: titleSize(input.title),
                fontWeight: 700,
                lineHeight: 1.12,
                letterSpacing: -1.5,
                color: "#f3f0e7",
                maxWidth: 1000,
              }}
            >
              {input.title}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 30,
                width: 140,
                height: 3,
                backgroundColor: "#d4af37",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: 26,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  fontSize: 24,
                  color: "#9aa2b5",
                }}
              >
                <div style={{ display: "flex", color: "#f3f0e7" }}>{input.author}</div>
                <div style={{ display: "flex", color: "#d4af37" }}>·</div>
                <div style={{ display: "flex" }}>{input.date}</div>
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 40,
                  fontWeight: 700,
                  letterSpacing: -1,
                  color: "#f3f0e7",
                }}
              >
                CORBUL
                <span style={{ color: "#d4af37" }}>.md</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
