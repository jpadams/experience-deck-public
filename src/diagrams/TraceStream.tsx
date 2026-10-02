import { useRef } from "react";
import { motion } from "./motion";
import { Flow, createSeededRandom, useFlowFrame } from "../flow";
import "./diagrams.css";

/**
 * Ambient "abundance" visual: four lanes of chips (conversations, tool calls,
 * code/commits, failures & corrections) streaming past in a dense, randomized scatter —
 * every trace an agent leaves behind.
 *
 * Every chip is continuously in flight (position = a function of t, never a
 * bounded [start,end] window), so nothing pops in or out at the loop seam —
 * each chip's own sub-period evenly divides PASS, and PASS divides DURATION, so its motion at
 * t=DURATION matches its motion at t=0 exactly. It reads as one endless
 * stream rather than a clip that restarts.
 */
// Stage is 1400 design units rendered at 1400px — units are px.
const W = 1400;
const H = 400;
// PASS sets chip speed (one lap across the stage takes PASS / laps ms).
// DURATION sets how long the stream runs before it parks. Keep DURATION a
// multiple of PASS so the loop seam stays invisible when ?loop=1.
const PASS = 12000;
const DURATION = PASS * 2;
const PER_LANE = 21; // 3x the original density
const Y_JITTER = 20;
const X_MIN = -200;
const X_MAX = 1600;
const FADE = 0.09; // fraction of a pass spent fading in/out at each end
// Over the last ROT ms the whole stream drains to a midtone gray: data that's
// just going to rot. Drives --ts-rot (0 → 1) on the layer below.
const ROT = 3000;

const LANES: { y: number; label: string; cls: string; chips: string[] }[] = [
  {
    y: 56,
    label: "conversations",
    cls: "chat",
    chips: ["human: I want a refund", "ai: absolutely!", "human: why did that fail?", "ai: let me check the logs", "human: book it for Tuesday", "ai: done — confirmation sent", "human: no, the other one"],
  },
  {
    y: 152,
    label: "tool calls",
    cls: "tool",
    chips: ["search_flights()", "createIssue()", "listInvoices()", "post(#eng)", "createTicket()", "refund()", "addLabels()"],
  },
  {
    y: 248,
    label: "code & workflows",
    cls: "code",
    chips: ["commit 4a1f9", "PR #812 opened", "patch applied", "workflow saved", "diff +14 -3", "branch merged", "script run"],
  },
  {
    y: 344,
    label: "failures & corrections",
    cls: "fail",
    chips: ["test failed", "retry (2/3)", "human override", "denied: approval", "rolled back", "timeout", "re-planned"],
  },
];

const LAPS = [1, 1, 2, 2, 3]; // weighted so most chips drift, a few move faster

interface Chip {
  laneIndex: number;
  chipIndex: number;
  phase: number;
  laps: number;
  y: number;
}

const buildChips = (): Chip[] =>
  LANES.flatMap((_lane, li) => {
    const rand = createSeededRandom(`trace-lane-${li}`);
    return Array.from({ length: PER_LANE }, (_, i) => ({
      laneIndex: li,
      chipIndex: i,
      phase: rand() * DURATION,
      laps: LAPS[Math.floor(rand() * LAPS.length)],
      y: LANES[li].y + (rand() * 2 - 1) * Y_JITTER,
    }));
  });

const smoothstep = (p: number) => p * p * (3 - 2 * p);

/** progress in [0,1) along one pass, and its continuous fade-in/out opacity. */
const sample = (t: number, chip: Chip) => {
  const period = PASS / chip.laps;
  const local = (((t + chip.phase) % period) + period) % period;
  const progress = local / period;
  const fadeIn = smoothstep(Math.min(progress / FADE, 1));
  const fadeOut = smoothstep(Math.min((1 - progress) / FADE, 1));
  return { x: X_MIN + progress * (X_MAX - X_MIN), opacity: Math.min(fadeIn, fadeOut) };
};

const CHIPS = buildChips();
const POSTER_T = Math.round(DURATION * 0.4);

const TsChips = () => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const layerRef = useRef<HTMLDivElement | null>(null);

  useFlowFrame((t) => {
    const rot = smoothstep(Math.min(Math.max((t - (DURATION - ROT)) / ROT, 0), 1));
    layerRef.current?.style.setProperty("--ts-rot", String(rot));
    CHIPS.forEach((chip, i) => {
      const el = refs.current[i];
      if (!el) return;
      const s = sample(t, chip);
      el.style.transform = `translate(calc(var(--flow-u) * ${s.x}), calc(var(--flow-u) * ${chip.y})) translate(-50%, -50%)`;
      el.style.opacity = String(s.opacity);
    });
  });

  return (
    <div ref={layerRef} className="ts-layer">
      <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg" style={{ position: "absolute", inset: 0 }}>
        {LANES.map((lane) => (
          <text key={lane.label} className="ts-caption" x={0} y={lane.y - 26}>
            {lane.label}
          </text>
        ))}
      </svg>
      {CHIPS.map((chip, i) => {
        const lane = LANES[chip.laneIndex];
        const init = sample(POSTER_T, chip);
        return (
          <div
            key={`${chip.laneIndex}-${chip.chipIndex}`}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="ts-wrap"
            style={{
              transform: `translate(calc(var(--flow-u) * ${init.x}), calc(var(--flow-u) * ${chip.y})) translate(-50%, -50%)`,
              opacity: init.opacity,
            }}
          >
            <div className={`ts-chip ${lane.cls}`}>{lane.chips[chip.chipIndex % lane.chips.length]}</div>
          </div>
        );
      })}
    </div>
  );
};

export const TraceStream = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={POSTER_T}
    aria-label="An unbroken stream of conversations, tool calls, code changes, and corrections — the raw experience an agent leaves behind"
    controls={false}
    {...motion({ holdAt: DURATION })}
  >
    <Flow.Stage width={W} height={H} className="dg-loop">
      <TsChips />
    </Flow.Stage>
  </Flow.Root>
);
