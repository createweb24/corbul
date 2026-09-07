import { ImageResponse } from "next/og";

/**
 * `/apple-icon` — pictograma de 180×180 pentru ecranul de start iOS:
 * același corb auriu pe obsidian ca `icon.svg`, randat ca PNG (Safari nu
 * acceptă SVG pentru apple-touch-icon).
 */

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BODY =
  "M2 35 C7 31 13 25 22 19 C30 9 43 9 48 21 C56 27 64 33 70 43 " +
  "C78 53 84 62 86 73 C96 79 108 88 118 97 L112 108 C100 103 87 94 78 85 " +
  "C72 90 61 88 52 83 C44 78 37 70 36 59 C35 51 32 45 26 41 " +
  "C18 40 9 38 2 35 Z " +
  "M34 26 A3 3 0 1 1 28 26 A3 3 0 1 1 34 26 Z " +
  "M45 27 C62 37 76 54 80 77 C76 77 74 75 73 72 C67 51 58 39 42 31 Z";
const LEGS_PERCH =
  "M52 81 L56.5 81 L56.5 100 L52 100 Z M63 85 L67.5 85 L67.5 100 L63 100 Z " +
  "M6 100 L114 100 L114 102.5 L6 102.5 Z";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0d12",
        }}
      >
        <svg viewBox="0 0 120 120" width="128" height="128" fill="#d4af37">
          <g transform="translate(1 9)">
            <path fillRule="evenodd" d={BODY} />
            <path d={LEGS_PERCH} />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
