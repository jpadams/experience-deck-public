import { useRef } from "react";
import { motion } from "./motion";
import { Flow, defineTrack, useFlowFrame, type FlowKeyframe } from "../flow";
import "./diagrams.css";

/**
 * The learning loop: a run emits trajectories, distillation prunes most of
 * them, what survives lands in a knowledge store, and that knowledge is
 * injected into the next run. Three laps; each lap the run gets shorter and
 * succeeds more often, and the store grows. Metrics are illustrative.
 *
 * Geometry is 1400 design units rendered at 1400px (units are px), sized so
 * the run meters and the knowledge cells are legible from the back row.
 */
const W = 1400;
const H = 520;
const LAP = 3000;
const LAPS = 3;
const HOLD = LAP * LAPS + 200;
const DURATION = HOLD + 700;
/** This piece reads best slow: half speed on top of the deck-wide SPEED (see ./motion.ts). */
const SPEED_MULT = 0.8;

const N = {
  run: { x: 300, y: 150 },
  traj: { x: 700, y: 150 },
  distill: { x: 1100, y: 150 },
  know: { x: 700, y: 410 },
};
const HALF_W = 150; // .ll-node width 300u
const HALF_H = 70;  // .ll-node min-height 140u

const METRICS = [
  { run: 1, steps: 100, success: 48, recipes: 0 },
  { run: 2, steps: 76, success: 61, recipes: 2 },
  { run: 3, steps: 62, success: 70, recipes: 4 },
  { run: 4, steps: 54, success: 78, recipes: 6 },
];

const DOTS = 5;
const KEEP = new Set([1, 3]);

const lapTracks = Array.from({ length: LAPS }, (_, l) => {
  const base = l * LAP;
  const dots = Array.from({ length: DOTS }, (_, i) => {
    const t0 = base + i * 90;
    const yj = (i - 2) * 13;
    const head: FlowKeyframe[] = [
      { t: t0, x: N.run.x + HALF_W, y: N.run.y + yj, opacity: 0, scale: 0.7, state: "run" },
      { t: t0 + 120, x: N.run.x + HALF_W + 40, y: N.run.y + yj, opacity: 1, scale: 1, ease: "out" },
      { t: t0 + 600, x: N.traj.x - HALF_W, y: N.traj.y + yj, ease: "linear" },
      { t: base + 900 + i * 90, x: N.traj.x + HALF_W, y: N.traj.y + yj, ease: "hold" },
      { t: base + 1500 + i * 90, x: N.distill.x - HALF_W, y: N.distill.y + yj, ease: "linear" },
    ];
    const tAt = base + 1500 + i * 90;
    if (!KEEP.has(i)) {
      return defineTrack(`ll-${l}-d${i}`, [
        ...head,
        { t: tAt + 40, x: N.distill.x - HALF_W + 14, y: N.distill.y + yj, state: "prune", ease: "linear" },
        { t: tAt + 560, x: N.distill.x - HALF_W + 14 + (i - 2) * 11, y: N.distill.y + HALF_H + 70, opacity: 0, scale: 0.6, ease: "in" },
      ]);
    }
    return defineTrack(`ll-${l}-d${i}`, [
      ...head,
      { t: tAt + 40, x: N.distill.x, y: N.distill.y + HALF_H, state: "keep", ease: "out" },
      { t: tAt + 300, x: N.distill.x, y: N.distill.y + HALF_H + 80, ease: "out" },
      { t: tAt + 560, x: N.distill.x - 120, y: N.know.y - 30, ease: "linear" },
      { t: tAt + 800, x: N.know.x + HALF_W + 14, y: N.know.y, ease: "in" },
      { t: tAt + 900, x: N.know.x + HALF_W - 25, y: N.know.y, opacity: 0, scale: 0.6, ease: "linear" },
    ]);
  });
  const p0 = base + 2250;
  const packet = defineTrack(`ll-${l}-packet`, [
    { t: p0, x: N.know.x - HALF_W + 14, y: N.know.y, opacity: 0, scale: 0.8, state: "packet" },
    { t: p0 + 120, x: N.know.x - HALF_W - 28, y: N.know.y, opacity: 1, scale: 1, ease: "out" },
    { t: p0 + 380, x: N.run.x + 50, y: N.know.y - 14, ease: "linear" },
    { t: p0 + 520, x: N.run.x, y: N.run.y + HALF_H + 70, ease: "out" },
    { t: p0 + 650, x: N.run.x, y: N.run.y + HALF_H + 6, ease: "in" },
    { t: p0 + 740, x: N.run.x, y: N.run.y + HALF_H - 14, opacity: 0, scale: 0.7, ease: "linear" },
  ]);
  return { dots, packet };
});

const still = (id: string, x: number, y: number, t0: number) =>
  defineTrack(id, [
    { t: t0, x, y: y + 6, opacity: 0, scale: 0.9 },
    { t: t0 + 340, x, y, opacity: 1, scale: 1, ease: "out" },
    { t: HOLD, x, y, ease: "hold" },
    { t: DURATION, x, y, opacity: 0, ease: "linear" },
  ]);

const NODE_TRACKS = {
  run: still("ll-run", N.run.x, N.run.y, 0),
  traj: still("ll-traj", N.traj.x, N.traj.y, 120),
  distill: still("ll-distill", N.distill.x, N.distill.y, 240),
  know: still("ll-know", N.know.x, N.know.y, 360),
};

const completedLaps = (t: number) => Math.min(Math.max(Math.floor((t + 120) / LAP), 0), LAPS);

const RunNode = () => {
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const stepsRef = useRef<HTMLDivElement | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);
  const stepsNRef = useRef<HTMLSpanElement | null>(null);
  const successNRef = useRef<HTMLSpanElement | null>(null);

  useFlowFrame((t) => {
    const m = METRICS[completedLaps(t)];
    if (labelRef.current) labelRef.current.textContent = `RUN ${m.run}`;
    if (stepsRef.current) stepsRef.current.style.width = `${m.steps}%`;
    if (successRef.current) successRef.current.style.width = `${m.success}%`;
    if (stepsNRef.current) stepsNRef.current.textContent = m.steps === 100 ? "baseline" : `−${100 - m.steps}%`;
    if (successNRef.current) successNRef.current.textContent = `${m.success}%`;
  });

  const m = METRICS[0];
  return (
    <div className="ll-node run">
      <div className="ll-title"><span ref={labelRef}>RUN {m.run}</span></div>
      <div className="ll-meter">
        <span className="ll-k">steps</span>
        <div className="ll-bar"><div ref={stepsRef} className="ll-fill steps" style={{ width: `${m.steps}%` }} /></div>
        <span ref={stepsNRef} className="ll-v">baseline</span>
      </div>
      <div className="ll-meter">
        <span className="ll-k">success</span>
        <div className="ll-bar"><div ref={successRef} className="ll-fill success" style={{ width: `${m.success}%` }} /></div>
        <span ref={successNRef} className="ll-v">{m.success}%</span>
      </div>
    </div>
  );
};

const KnowNode = () => {
  const countRef = useRef<HTMLSpanElement | null>(null);
  const cellsRef = useRef<HTMLDivElement | null>(null);

  useFlowFrame((t) => {
    const m = METRICS[completedLaps(t)];
    if (countRef.current) countRef.current.textContent = m.recipes === 0 ? "empty" : `${m.recipes} recipes`;
    const cells = cellsRef.current;
    if (cells) {
      Array.from(cells.children).forEach((c, i) => {
        (c as HTMLElement).dataset.on = i < m.recipes ? "true" : "false";
      });
    }
  });

  return (
    <div className="ll-node know">
      <div className="ll-title">KNOWLEDGE</div>
      <div className="ll-sub">recipes · skills · graph</div>
      <div ref={cellsRef} className="ll-cells">
        {Array.from({ length: METRICS[LAPS].recipes }, (_, i) => (
          <span key={i} className="ll-cell" data-on="false" />
        ))}
      </div>
      <div className="ll-count"><span ref={countRef}>empty</span></div>
    </div>
  );
};

const Edges = () => (
  <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg ll-svg" style={{ position: "absolute", inset: 0 }}>
    <path className="ll-edge" d={`M ${N.run.x + HALF_W} ${N.run.y} L ${N.traj.x - HALF_W - 8} ${N.traj.y}`} markerEnd="url(#ll-arrow)" />
    <path className="ll-edge" d={`M ${N.traj.x + HALF_W} ${N.traj.y} L ${N.distill.x - HALF_W - 8} ${N.distill.y}`} markerEnd="url(#ll-arrow)" />
    <path
      className="ll-edge"
      d={`M ${N.distill.x} ${N.distill.y + HALF_H} C ${N.distill.x} ${N.know.y}, ${N.distill.x - 160} ${N.know.y}, ${N.know.x + HALF_W + 8} ${N.know.y}`}
      markerEnd="url(#ll-arrow)"
    />
    <path
      className="ll-edge back"
      d={`M ${N.know.x - HALF_W} ${N.know.y} C ${N.run.x + 80} ${N.know.y}, ${N.run.x} ${N.know.y - 30}, ${N.run.x} ${N.run.y + HALF_H + 8}`}
      markerEnd="url(#ll-arrow-back)"
    />
    <text className="label" x={(N.run.x + N.traj.x) / 2} y={N.run.y - 16} textAnchor="middle">emits</text>
    <text className="label" x={(N.traj.x + N.distill.x) / 2} y={N.traj.y - 16} textAnchor="middle">feeds</text>
    <text className="label" x={N.know.x - HALF_W - 170} y={N.know.y + 60} textAnchor="middle" style={{ fill: "var(--green-ink)" }}>
      injected into the next run
    </text>
    <defs>
      <marker id="ll-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--fg-tertiary)" />
      </marker>
      <marker id="ll-arrow-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--green-ink)" />
      </marker>
    </defs>
  </svg>
);

export const LearningLoop = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={LAP * 2 + 1900}
    aria-label="A run emits trajectories, distillation prunes most of them, survivors land in a knowledge store, and that knowledge is injected into the next run — which gets shorter and succeeds more often each lap"
    controls={false}
    {...motion({ holdAt: HOLD, speed: SPEED_MULT })}
  >
    <Flow.Stage width={W} height={H} className="dg-loop">
      <Edges />
      <Flow.Token track={NODE_TRACKS.run}><RunNode /></Flow.Token>
      <Flow.Token track={NODE_TRACKS.traj}>
        <div className="ll-node traj">
          <div className="ll-title">TRAJECTORIES</div>
          <div className="ll-sub">what happened</div>
        </div>
      </Flow.Token>
      <Flow.Token track={NODE_TRACKS.distill}>
        <div className="ll-node distill">
          <div className="ll-title">DISTILL</div>
          <div className="ll-sub">prune · abstract · verify</div>
        </div>
      </Flow.Token>
      <Flow.Token track={NODE_TRACKS.know}><KnowNode /></Flow.Token>
      {lapTracks.flatMap(({ dots, packet }) => [
        ...dots.map((t) => (
          <Flow.Token key={t.id} track={t}>
            <div className="ll-dot" />
          </Flow.Token>
        )),
        <Flow.Token key={packet.id} track={packet}>
          <div className="ll-packet">recipe</div>
        </Flow.Token>,
      ])}
    </Flow.Stage>
  </Flow.Root>
);
