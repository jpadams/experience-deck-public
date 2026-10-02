/**
 * Neo4j "A Template for All Nodes" brand decoration and logos.
 *
 * The blob/wave geometry is lifted verbatim from the template's slide
 * layouts (see ./shapes.ts), so each tone below reproduces one layout:
 *
 *   navy    → TITLE            (accent1 bg, accent2 blob top-right, accent4 wave bottom-left)
 *   light   → TITLE_AND_BODY_1_2 (white bg, two accent2 blobs)
 *   teal    → TITLE_AND_BODY_1_2_1 (accent2 bg, two accent4 blobs)
 *   cream   → TITLE_1          (dk2 bg, accent3 blob top-left, lt2 blob right)
 *   closing → TITLE_1_1_1_1    (accent2 bg, accent1 wave top, accent3 wave bottom)
 *
 * Logos are the official white RGB PNGs from assets/, applied as CSS masks
 * so they can take any colour (navy on white slides, white on dark ones).
 */
import type { CSSProperties } from "react";
import {
  CLOSING_WAVE_BOTTOM,
  CLOSING_WAVE_TOP,
  CONTENT_BLOB_BL,
  CONTENT_BLOB_TR,
  SECTION_BLOB_R,
  SECTION_BLOB_TL,
  TITLE_BLOB_TR,
  TITLE_WAVE_BL,
} from "./shapes";
import logoUrl from "./neo4j-logo-white.png";
import markUrl from "./neo4j-mark-white.png";

export type Tone = "light" | "navy" | "teal" | "cream" | "closing";

const LAYERS: Record<Tone, { d: string; fill: string; transform?: string }[]> = {
  navy: [
    { d: TITLE_BLOB_TR[0], fill: "var(--teal)" },
    { d: TITLE_WAVE_BL[0], fill: "var(--cyan)" },
  ],
  light: [
    { d: CONTENT_BLOB_TR[0], fill: "var(--teal)" },
    { d: CONTENT_BLOB_BL[0], fill: "var(--teal)" },
  ],
  teal: [
    { d: CONTENT_BLOB_TR[0], fill: "var(--cyan)" },
    { d: CONTENT_BLOB_BL[0], fill: "var(--cyan)" },
  ],
  cream: [
    // Both shapes lifted 75px off the template positions so the top-left
    // blob's lowest node clears a statement block at y≈333 by ~40px.
    { d: SECTION_BLOB_TL[0], fill: "var(--teal2)", transform: "translate(0 -75)" },
    { d: SECTION_BLOB_R[0], fill: "var(--paper)", transform: "translate(0 -75)" },
  ],
  closing: [
    { d: CLOSING_WAVE_TOP[0], fill: "var(--navy)" },
    { d: CLOSING_WAVE_BOTTOM[0], fill: "var(--teal2)" },
  ],
};

export const Blobs = ({ tone = "light" }: { tone?: Tone }) => (
  <svg
    className="brand-blobs"
    viewBox="0 0 1600 900"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    {LAYERS[tone].map((l, i) => (
      <path key={i} d={l.d} fill={l.fill} transform={l.transform} />
    ))}
  </svg>
);

/** Official Neo4j logo (wordmark by default, `mark` for the icon alone). Inherits `color`. */
export const Logo = ({
  height = 28,
  mark = false,
  className,
  style,
}: {
  height?: number;
  mark?: boolean;
  className?: string;
  style?: CSSProperties;
}) => {
  const url = mark ? markUrl : logoUrl;
  // Intrinsic PNG ratios: wordmark 7121x2371, mark 2100x2000.
  const ratio = mark ? 2100 / 2000 : 7121 / 2371;
  return (
    <span
      role="img"
      aria-label="Neo4j"
      className={`logo ${className ?? ""}`}
      style={{
        height,
        width: Math.round(height * ratio),
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        ...style,
      }}
    />
  );
};
