import { motion } from "./motion";
import { Flow, defineTrack } from "../flow";
import "./diagrams.css";

/**
 * Trace ≠ Memory ≠ Knowledge. Raw experience accumulates in the left column;
 * a labelled "distillation" arrow compresses it into fewer, durable items in
 * the right column.
 *
 * Geometry: the stage is 1300 design units wide and renders at 1300px, so
 * units are px. Flow.Token centres each token on (x, y), so column x values
 * are column centres and every chip must fit within its column's half-width.
 */
const W = 1300;
const H = 400;
const DURATION = 7200;
const HOLD = DURATION - 700;

const COL_L = 300;  // experience column centre (chips ≤ 440px wide → 80..520)
const COL_R = 1000; // knowledge column centre  (chips ≤ 420px wide → 790..1210)
const ARROW_X = (COL_L + COL_R) / 2; // 650, arrow is 180 wide → 560..740
const LABEL_Y = 22;
const ROW0 = 94;    // first chip centre — clear of the column label
const ROW = 84;

const RAW = [
  "tool call: search_tools(q)",
  "observation: 4 results, none matched",
  "failure: wrong tool chosen",
  "correction: retried with a filter",
];
const KNOWN = [
  "entity: query → tool mapping",
  "relationship: retry follows failure",
  "procedure: filter before you search",
];
const rawY = (i: number) => ROW0 + i * ROW;                 // 94 178 262 346
const knownY = (i: number) => ROW0 + ROW / 2 + i * ROW;     // 136 220 304
const ARROW_Y = knownY(1);                                  // 220 — mid-column

const fade = (id: string, x: number, y: number, t0: number) =>
  defineTrack(id, [
    { t: t0, x, y: y + 6, opacity: 0 },
    { t: t0 + 280, x, y, opacity: 1, ease: "out" },
    { t: HOLD, x, y, ease: "hold" },
    { t: DURATION, x, y, opacity: 0, ease: "linear" },
  ]);

const rawTracks = RAW.map((_, i) => fade(`raw-${i}`, COL_L, rawY(i), 260 + i * 620));
const arrowTrack = fade("arrow", ARROW_X, ARROW_Y, 3000);
const knownTracks = KNOWN.map((_, i) => fade(`known-${i}`, COL_R, knownY(i), 3400 + i * 560));

export const Distillation = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={Math.round(DURATION * 0.75)}
    aria-label="Raw experience on the left compresses through distillation into durable knowledge on the right"
    controls={false}
    {...motion({ holdAt: HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-distill">
      <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg xk-svg" style={{ position: "absolute", inset: 0 }}>
        <text className="label" x={COL_L} y={LABEL_Y} textAnchor="middle">experience</text>
        <text className="label" x={COL_R} y={LABEL_Y} textAnchor="middle">knowledge</text>
        {/* faint column rails so the two piles read as columns even mid-animation */}
        <line className="xk-rail" x1={COL_L} y1={LABEL_Y + 22} x2={COL_L} y2={H - 10} />
        <line className="xk-rail" x1={COL_R} y1={LABEL_Y + 22} x2={COL_R} y2={H - 10} />
      </svg>
      {rawTracks.map((t, i) => (
        <Flow.Token key={t.id} track={t}>
          <div className="xk-chip raw">{RAW[i]}</div>
        </Flow.Token>
      ))}
      <Flow.Token track={arrowTrack}>
        <div className="xk-arrow">
          <span className="xk-arrow-label">distillation</span>
          <svg width="180" height="26" viewBox="0 0 180 26" aria-hidden="true">
            <line x1="2" y1="13" x2="160" y2="13" />
            <path d="M158 4 L176 13 L158 22 Z" />
          </svg>
        </div>
      </Flow.Token>
      {knownTracks.map((t, i) => (
        <Flow.Token key={t.id} track={t}>
          <div className="xk-chip known">{KNOWN[i]}</div>
        </Flow.Token>
      ))}
    </Flow.Stage>
  </Flow.Root>
);
