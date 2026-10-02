import { useRef } from "react";
import { motion } from "./motion";
import { Flow, defineTrack, useFlowFrame } from "../flow";
import "./diagrams.css";

/**
 * Learning is search, then pruning. One task fans out into many attempts;
 * most fail and are pruned in place (they stay visible as ghosts — the
 * failures are the raw material), the survivors converge into one recipe.
 */
// Stage is 1400 design units rendered at 1400px — units are px.
const W = 1400;
const H = 470;
const DURATION = 9600;
const HOLD = DURATION - 700;

const TASK = { x: 110, y: 235 };
const RECIPE = { x: 1268, y: 235 };
const X_FAN = 330;
const X_END = 1000;
const SPEED = 0.2; // design units per ms along a lane
const FAN_MS = 500;

interface Attempt {
  y: number;
  label: string;
  ok: boolean;
  failAt: number;
  reason: string;
  t0: number;
}

const ATTEMPTS: Attempt[] = [
  { y: 55, label: "search(q)", ok: false, failAt: 584, reason: "wrong tool", t0: 300 },
  { y: 115, label: "list_all() → scan", ok: false, failAt: 792, reason: "timeout", t0: 420 },
  { y: 175, label: "filter → search(q)", ok: true, failAt: 0, reason: "", t0: 540 },
  { y: 235, label: "guess the id", ok: false, failAt: 492, reason: "hallucinated id", t0: 660 },
  { y: 295, label: "read docs → search", ok: true, failAt: 0, reason: "", t0: 780 },
  { y: 355, label: "brute-force ids", ok: false, failAt: 861, reason: "too many steps", t0: 900 },
  { y: 415, label: "ask for approval", ok: false, failAt: 677, reason: "denied", t0: 1020 },
];

const laneEnd = (a: Attempt) => (a.ok ? X_END : a.failAt);
const arriveAt = (a: Attempt) => a.t0 + FAN_MS + (laneEnd(a) - X_FAN) / SPEED;

const T_CONVERGE = Math.max(...ATTEMPTS.filter((a) => a.ok).map(arriveAt)) + 600;
const T_RECIPE = T_CONVERGE + 450;

const attemptTracks = ATTEMPTS.map((a, i) => {
  const tArrive = arriveAt(a);
  const end = laneEnd(a);
  if (!a.ok) {
    return defineTrack(`sp-att-${i}`, [
      { t: a.t0, x: TASK.x + 40, y: TASK.y, opacity: 0, scale: 0.8, state: "run" },
      { t: a.t0 + FAN_MS, x: X_FAN, y: a.y, opacity: 1, scale: 1, ease: "out" },
      { t: tArrive, x: end, y: a.y, state: "fail", ease: "linear" },
      { t: tArrive + 520, x: end, y: a.y, opacity: 1, scale: 0.94, ease: "out" },
      { t: HOLD, x: end, y: a.y, ease: "hold" },
      { t: DURATION, x: end, y: a.y, opacity: 0, ease: "linear" },
    ]);
  }
  return defineTrack(`sp-att-${i}`, [
    { t: a.t0, x: TASK.x + 40, y: TASK.y, opacity: 0, scale: 0.8, state: "run" },
    { t: a.t0 + FAN_MS, x: X_FAN, y: a.y, opacity: 1, scale: 1, ease: "out" },
    { t: tArrive, x: end, y: a.y, state: "ok", ease: "linear" },
    { t: T_CONVERGE, x: end, y: a.y, ease: "hold" },
    { t: T_CONVERGE + 600, x: RECIPE.x - 120, y: RECIPE.y, opacity: 0, scale: 0.7, ease: "in" },
  ]);
});

const still = (id: string, x: number, y: number, t0: number) =>
  defineTrack(id, [
    { t: t0, x, y: y + 6, opacity: 0, scale: 0.88 },
    { t: t0 + 360, x, y, opacity: 1, scale: 1, ease: "out" },
    { t: HOLD, x, y, ease: "hold" },
    { t: DURATION, x, y, opacity: 0, ease: "linear" },
  ]);

const taskTrack = still("sp-task", TASK.x, TASK.y, 0);
const recipeTrack = still("sp-recipe", RECIPE.x, RECIPE.y, T_RECIPE);
const tallyTrack = still("sp-tally", RECIPE.x, RECIPE.y + 78, T_RECIPE + 300);

const ramp = (t: number, from: number, ms: number) => Math.min(Math.max((t - from) / ms, 0), 1);

const Lanes = () => {
  const litRef = useRef<SVGGElement | null>(null);
  const convRef = useRef<SVGGElement | null>(null);

  useFlowFrame((t) => {
    const decay = t >= HOLD ? Math.max(0, 1 - (t - HOLD) / 400) : 1;
    const lit = litRef.current;
    if (lit) {
      ATTEMPTS.forEach((a, i) => {
        const el = lit.children[i] as SVGPathElement | undefined;
        if (!el) return;
        const tArrive = arriveAt(a);
        const on = ramp(t, a.t0 + 150, 300);
        if (a.ok) {
          el.style.stroke = t >= tArrive ? "var(--lime-ink)" : "var(--teal)";
          el.style.opacity = String(on * decay);
        } else {
          const pruned = ramp(t, tArrive, 520);
          el.style.stroke = t >= tArrive ? "var(--coral)" : "var(--teal)";
          el.style.opacity = String(on * (1 - 0.8 * pruned) * decay);
        }
      });
    }
    const conv = convRef.current;
    if (conv) {
      const p = ramp(t, T_CONVERGE, 500) * decay;
      for (const el of Array.from(conv.children)) (el as SVGPathElement).style.opacity = String(p);
    }
  });

  const laneD = (a: Attempt) =>
    `M ${TASK.x + 50} ${TASK.y} C ${X_FAN - 80} ${TASK.y}, ${X_FAN - 100} ${a.y}, ${X_FAN} ${a.y} L ${laneEnd(a)} ${a.y}`;
  const convD = (a: Attempt) =>
    `M ${X_END} ${a.y} C ${X_END + 100} ${a.y}, ${RECIPE.x - 210} ${RECIPE.y}, ${RECIPE.x - 150} ${RECIPE.y}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg sp-svg" style={{ position: "absolute", inset: 0 }}>
      <text className="label" x={TASK.x} y={TASK.y - 44} textAnchor="middle">task</text>
      <text className="label" x={X_FAN} y={22}>attempts</text>
      <text className="label" x={RECIPE.x} y={RECIPE.y - 64} textAnchor="middle">recipe</text>
      {ATTEMPTS.map((a, i) => (
        <path key={`w-${i}`} className="wire" d={laneD(a)} />
      ))}
      <g ref={litRef}>
        {ATTEMPTS.map((a, i) => (
          <path key={`l-${i}`} className="sp-lit" style={{ opacity: 0 }} d={laneD(a)} />
        ))}
      </g>
      <g ref={convRef}>
        {ATTEMPTS.filter((a) => a.ok).map((a) => (
          <path key={`c-${a.y}`} className="sp-lit ok" style={{ opacity: 0 }} d={convD(a)} markerEnd="url(#sp-arrow)" />
        ))}
      </g>
      <defs>
        <marker id="sp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--lime-ink)" />
        </marker>
      </defs>
    </svg>
  );
};

export const SearchPrune = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={T_RECIPE + 800}
    aria-label="One task fans out into seven attempts; five fail and are pruned in place, two succeed and converge into a single distilled recipe"
    controls={false}
    {...motion({ holdAt: HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-loop">
      <Lanes />
      <Flow.Token track={taskTrack}>
        <div className="sp-node task">TASK</div>
      </Flow.Token>
      {attemptTracks.map((t, i) => (
        <Flow.Token key={t.id} track={t}>
          <div className="sp-chip">
            <span className="sp-label">{ATTEMPTS[i].label}</span>
            {ATTEMPTS[i].reason ? <span className="sp-reason">✕ {ATTEMPTS[i].reason}</span> : null}
          </div>
        </Flow.Token>
      ))}
      <Flow.Token track={recipeTrack}>
        <div className="sp-node recipe">
          <div className="sp-recipe-title">filter, then search</div>
          <div className="sp-recipe-sub">when: id unknown</div>
          <div className="sp-recipe-sub">avoid: guessing</div>
        </div>
      </Flow.Token>
      <Flow.Token track={tallyTrack}>
        <div className="sp-tally">7 attempts · 2 survived · 1 recipe</div>
      </Flow.Token>
    </Flow.Stage>
  </Flow.Root>
);
