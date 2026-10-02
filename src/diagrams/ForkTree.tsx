import { useRef } from "react";
import { motion } from "./motion";
import { Flow, defineTrack, useFlowFrame } from "../flow";
import "./diagrams.css";

/**
 * Many sessions, one well-worn path. The same kind of task is attempted over
 * and over; every session forks somewhere. Overlaid, the forks pile up into a
 * tree: segments many sessions walked get thick, dead ends stay thin. At the
 * end the dead ends are pruned, the dominant route is ranked first and the two
 * runners-up are kept smaller as fallbacks.
 *
 * Stage is 1400 design units rendered at 1400px — units are px.
 */
const W = 1400;
const H = 400;

const N: Record<string, { x: number; y: number }> = {
  root: { x: 90, y: 200 },
  c1a: { x: 300, y: 112 },
  c1b: { x: 300, y: 200 },
  c1c: { x: 300, y: 288 },
  c2a: { x: 510, y: 82 },
  c2b: { x: 510, y: 204 },
  c2c: { x: 510, y: 306 },
  c3a: { x: 720, y: 112 },
  c3b: { x: 720, y: 198 },
  c3c: { x: 720, y: 286 },
  c4a: { x: 930, y: 148 },
  c4b: { x: 930, y: 202 },
  c4c: { x: 930, y: 258 },
  c5a: { x: 1060, y: 170 },
  c5c: { x: 1060, y: 234 },
  goal: { x: 1162, y: 200 },
  d1: { x: 510, y: 30 },
  d2: { x: 720, y: 48 },
  d3: { x: 930, y: 96 },
  d4: { x: 720, y: 362 },
  d5: { x: 1060, y: 316 },
};
// Edges and session dots leave from the right edge of the TASK box, not its centre.
const ORIGIN = { x: 136, y: 200 };
const P = (id: string) => (id === "root" ? ORIGIN : N[id]);

type Route = "best" | "a" | "b" | "dead";
const PATHS: Record<string, { nodes: string[]; route: Route }> = {
  best: { nodes: ["root", "c1b", "c2b", "c3b", "c4b", "goal"], route: "best" },
  a: { nodes: ["root", "c1a", "c2a", "c3a", "c4a", "c5a", "goal"], route: "a" },
  b: { nodes: ["root", "c1c", "c2c", "c3c", "c4c", "c5c", "goal"], route: "b" },
  d1: { nodes: ["root", "c1a", "d1"], route: "dead" },
  d2: { nodes: ["root", "c1a", "c2a", "d2"], route: "dead" },
  d3: { nodes: ["root", "c1b", "c2b", "c3b", "d3"], route: "dead" },
  d4: { nodes: ["root", "c1c", "c2c", "d4"], route: "dead" },
  d5: { nodes: ["root", "c1c", "c2c", "c3c", "c4c", "d5"], route: "dead" },
};

// Session order: the aggregate only becomes legible after enough of them.
const SESSIONS = ["best", "d1", "a", "best", "d4", "b", "best", "d3", "a", "best", "d2", "b", "best", "d5", "a", "best"];
const STAGGER = 330;
const SPEED = 0.6; // px per ms along an edge

const edgeKey = (a: string, b: string) => `${a}>${b}`;
const dist = (a: string, b: string) => Math.hypot(P(b).x - P(a).x, P(b).y - P(a).y);
const edgeD = (a: string, b: string) => {
  const p = P(a), q = P(b);
  const mx = p.x + (q.x - p.x) * 0.5;
  return `M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${q.y}, ${q.x} ${q.y}`;
};
// Point on the same cubic (for token keyframes, so dots ride the curve).
const bez = (a: string, b: string, u: number) => {
  const p = P(a), q = P(b);
  const mx = p.x + (q.x - p.x) * 0.5;
  const c1 = { x: mx, y: p.y }, c2 = { x: mx, y: q.y };
  const v = 1 - u;
  return {
    x: v * v * v * p.x + 3 * v * v * u * c1.x + 3 * v * u * u * c2.x + u * u * u * q.x,
    y: v * v * v * p.y + 3 * v * v * u * c1.y + 3 * v * u * u * c2.y + u * u * u * q.y,
  };
};

// Every distinct edge, which route owns it, and the times sessions finish crossing it.
interface Edge { a: string; b: string; route: Route; passes: number[] }
const EDGES = new Map<string, Edge>();
const ROUTE_RANK: Record<Route, number> = { best: 3, a: 2, b: 2, dead: 0 };

interface Session { id: string; path: string[]; route: Route; t0: number; times: number[] }
const sessions: Session[] = SESSIONS.map((pid, i) => {
  const { nodes, route } = PATHS[pid];
  const t0 = 250 + i * STAGGER;
  const times = [t0];
  for (let k = 1; k < nodes.length; k++) {
    const t = times[k - 1] + dist(nodes[k - 1], nodes[k]) / SPEED;
    times.push(t);
    const key = edgeKey(nodes[k - 1], nodes[k]);
    const e = EDGES.get(key) ?? { a: nodes[k - 1], b: nodes[k], route, passes: [] };
    // An edge shared by a live route and a dead end belongs to the live route.
    if (ROUTE_RANK[route] > ROUTE_RANK[e.route]) e.route = route;
    e.passes.push(t);
    EDGES.set(key, e);
  }
  return { id: `${pid}-${i}`, path: nodes, route, t0, times };
});
const EDGE_LIST = Array.from(EDGES.values());

const T_GROWN = Math.max(...sessions.map((s) => s.times[s.times.length - 1])) + 500;
const T_PRUNE = T_GROWN + 300;
const T_RANK = T_PRUNE + 900;
const HOLD = T_RANK + 5200;
const DURATION = HOLD + 700;

const sessionTracks = sessions.map((s) => {
  const dead = s.route === "dead";
  const kf: Parameters<typeof defineTrack>[1] = [
    { t: s.t0 - 200, x: ORIGIN.x - 10, y: ORIGIN.y, opacity: 0, scale: 0.6, state: "run" },
    { t: s.t0, x: ORIGIN.x, y: ORIGIN.y, opacity: 1, scale: 1, ease: "out" },
  ];
  for (let k = 1; k < s.path.length; k++) {
    const a = s.path[k - 1], b = s.path[k];
    const ta = s.times[k - 1], tb = s.times[k];
    for (let j = 1; j <= 4; j++) {
      const u = j / 4;
      const p = bez(a, b, u);
      kf.push({ t: ta + (tb - ta) * u, x: p.x, y: p.y, ease: "linear" });
    }
  }
  const end = P(s.path[s.path.length - 1]);
  const tEnd = s.times[s.times.length - 1];
  if (dead) {
    kf.push({ t: tEnd + 1, x: end.x, y: end.y, state: "fail", ease: "linear" });
    kf.push({ t: T_PRUNE, x: end.x, y: end.y, ease: "hold" });
    kf.push({ t: T_PRUNE + 600, x: end.x, y: end.y, opacity: 0.35, scale: 0.8, ease: "out" });
    kf.push({ t: HOLD, x: end.x, y: end.y, ease: "hold" });
    kf.push({ t: DURATION, x: end.x, y: end.y, opacity: 0, ease: "linear" });
  } else {
    kf.push({ t: tEnd + 1, x: end.x, y: end.y, state: "ok", ease: "linear" });
    kf.push({ t: tEnd + 420, x: end.x, y: end.y, opacity: 0, scale: 0.5, ease: "in" });
  }
  return defineTrack(`ft-s-${s.id}`, kf);
});

const still = (id: string, x: number, y: number, t0: number) =>
  defineTrack(id, [
    { t: t0, x, y: y + 6, opacity: 0, scale: 0.9 },
    { t: t0 + 380, x, y, opacity: 1, scale: 1, ease: "out" },
    { t: HOLD, x, y, ease: "hold" },
    { t: DURATION, x, y, opacity: 0, ease: "linear" },
  ]);

const taskTrack = still("ft-task", N.root.x, N.root.y, 0);
const goalTrack = still("ft-goal", N.goal.x, N.goal.y, 0);
const LABEL_X = 1300;
const rankBest = still("ft-r1", LABEL_X, N.goal.y, T_RANK);
const rankA = still("ft-r2", LABEL_X, N.goal.y - 84, T_RANK + 250);
const rankB = still("ft-r3", LABEL_X, N.goal.y + 84, T_RANK + 400);
const tallyTrack = still("ft-tally", 640, 386, T_RANK + 600);

const ramp = (t: number, from: number, ms: number) => Math.min(Math.max((t - from) / ms, 0), 1);

const Tree = () => {
  const gRef = useRef<SVGGElement | null>(null);
  useFlowFrame((t) => {
    const g = gRef.current;
    if (!g) return;
    const decay = t >= HOLD ? Math.max(0, 1 - (t - HOLD) / 500) : 1;
    const pruned = ramp(t, T_PRUNE, 600);
    const ranked = ramp(t, T_RANK, 500);
    EDGE_LIST.forEach((e, i) => {
      const el = g.children[i] as SVGPathElement | undefined;
      if (!el) return;
      let seen = 0;
      for (const p of e.passes) if (t >= p) seen++;
      const first = e.passes[0];
      const on = ramp(t, first - 260, 300);
      let width = 1.6 + seen * 1.15;
      let stroke = "var(--teal)";
      let alpha = on * (0.55 + 0.45 * Math.min(seen, 3) / 3);
      if (e.route === "dead") {
        stroke = pruned > 0 ? "var(--coral)" : stroke;
        alpha *= 1 - 0.78 * pruned;
        width *= 1 - 0.4 * pruned;
      } else if (ranked > 0) {
        if (e.route === "best") {
          stroke = "var(--green-ink)";
          width += 2.5 * ranked;
        } else {
          stroke = "var(--teal2)";
          alpha *= 1 - 0.25 * ranked;
        }
      }
      el.style.stroke = stroke;
      el.style.strokeWidth = String(width);
      el.style.opacity = String(alpha * decay);
    });
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg ft-svg" style={{ position: "absolute", inset: 0 }}>
      <text className="label" x={N.root.x} y={N.root.y - 44} textAnchor="middle">task</text>
      <text className="label" x={N.goal.x} y={N.goal.y - 48} textAnchor="middle">outcome</text>
      <text className="label" x={LABEL_X} y={22} textAnchor="middle">ranked routes</text>
      <g ref={gRef}>
        {EDGE_LIST.map((e) => (
          <path key={edgeKey(e.a, e.b)} className="ft-edge" style={{ opacity: 0 }} d={edgeD(e.a, e.b)} />
        ))}
      </g>
    </svg>
  );
};

export const ForkTree = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={T_RANK + 1200}
    aria-label="Sixteen sessions attempt the same task and fork; overlaid they form a tree whose shared segments thicken. Five dead ends are pruned, one dominant route is ranked first, two runners-up are kept as fallbacks"
    controls={false}
    {...motion({ holdAt: HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-loop">
      <Tree />
      <Flow.Token track={taskTrack}>
        <div className="sp-node task">TASK</div>
      </Flow.Token>
      <Flow.Token track={goalTrack}>
        <div className="ft-goal">✓</div>
      </Flow.Token>
      {sessionTracks.map((tr) => (
        <Flow.Token key={tr.id} track={tr}>
          <div className="ft-dot" />
        </Flow.Token>
      ))}
      <Flow.Token track={rankBest}>
        <div className="ft-rank best">
          <div className="ft-rank-title">the skill</div>
          <div className="ft-rank-sub">5 steps · 7 / 16 runs</div>
        </div>
      </Flow.Token>
      <Flow.Token track={rankA}>
        <div className="ft-rank runner">
          <div className="ft-rank-title">fallback</div>
          <div className="ft-rank-sub">6 steps · slower</div>
        </div>
      </Flow.Token>
      <Flow.Token track={rankB}>
        <div className="ft-rank runner">
          <div className="ft-rank-title">fallback</div>
          <div className="ft-rank-sub">6 steps · costlier</div>
        </div>
      </Flow.Token>
      <Flow.Token track={tallyTrack}>
        <div className="sp-tally">16 sessions · 5 dead ends pruned · 3 routes · 1 skill</div>
      </Flow.Token>
    </Flow.Stage>
  </Flow.Root>
);

/**
 * Inset: the same idea as a fitness landscape. The runners-up sit on local
 * maxima; only the aggregate across sessions reveals which peak is global.
 */
export const Landscape = () => {
  const w = 380, h = 150;
  // Smooth terrain: two modest bumps and one tall peak in the middle.
  const d =
    `M 0 ${h - 18} C 40 ${h - 30}, 60 ${h - 84}, 92 ${h - 82} ` +
    `S 130 ${h - 26}, 160 ${h - 34} S 190 ${h - 118}, 214 ${h - 118} ` +
    `S 246 ${h - 40}, 276 ${h - 44} S 308 ${h - 92}, 326 ${h - 90} ` +
    `S 362 ${h - 24}, ${w} ${h - 30}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="ft-land" aria-hidden>
      <path className="ft-land-fill" d={`${d} L ${w} ${h} L 0 ${h} Z`} />
      <path className="ft-land-line" d={d} />
      <line className="ft-land-drop" x1={92} y1={h - 82} x2={92} y2={h} />
      <line className="ft-land-drop" x1={214} y1={h - 118} x2={214} y2={h} />
      <line className="ft-land-drop" x1={326} y1={h - 90} x2={326} y2={h} />
      <circle className="ft-land-dot runner" cx={92} cy={h - 82} r={6} />
      <circle className="ft-land-dot best" cx={214} cy={h - 118} r={7.5} />
      <circle className="ft-land-dot runner" cx={326} cy={h - 90} r={6} />
      <text className="ft-land-txt" x={92} y={h - 94} textAnchor="middle">local</text>
      <text className="ft-land-txt best" x={214} y={h - 132} textAnchor="middle">global</text>
      <text className="ft-land-txt" x={326} y={h - 102} textAnchor="middle">local</text>
    </svg>
  );
};
