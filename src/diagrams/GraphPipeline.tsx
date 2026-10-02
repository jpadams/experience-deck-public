import { useRef } from "react";
import { motion } from "./motion";
import { Flow, defineTrack, useFlowFrame } from "../flow";
import "./diagrams.css";

/**
 * "The graph holds memory and is the workbench."
 *
 * Four episodic runs on the left, each a chain of steps. The steps fly onto
 * one graph in the middle; steps that name the same entity land on the same
 * node, so what repeats across runs becomes a visibly heavier path. The
 * graph keeps all of it (that is the memory) and, because it is explicit,
 * several kinds of asset can be worked out of it: a skill, a graph-analytics
 * insight, verified training data — each with provenance back to the nodes
 * (and so to the runs) it came from.
 *
 * Stage is 1400 design units rendered at 1400px — units are px.
 */
const W = 1400;
const H = 560;

type Ent = "task" | "search" | "fail" | "retry" | "filter" | "ok" | "docs" | "guess";
const RUNS: Ent[][] = [
  ["task", "search", "fail", "retry", "filter", "search", "ok"],
  ["task", "guess", "fail", "retry", "filter", "search", "ok"],
  ["task", "docs", "filter", "search", "ok"],
  ["task", "docs", "search", "fail"],
];
const LABEL: Record<Ent, string> = {
  task: "task", search: "search()", fail: "failure", retry: "retry", filter: "filter", ok: "success", docs: "read docs", guess: "guess id",
};
// Laid out so the repeated path (filter → search → success) climbs the right side.
const G: Record<Ent, { x: number; y: number }> = {
  task: { x: 545, y: 300 },
  docs: { x: 640, y: 170 },
  guess: { x: 640, y: 440 },
  fail: { x: 720, y: 395 },
  retry: { x: 830, y: 475 },
  filter: { x: 820, y: 330 },
  search: { x: 900, y: 210 },
  ok: { x: 960, y: 112 },
};
const PATTERN = new Set(["filter>search", "search>ok"]); // the path that repeats in 3 of 4 runs

// Strip geometry (left column)
const SX0 = 96, SDX = 48, ROW_Y = [125, 205, 285, 365];
// Asset cards (right column), each distilled from the graph
const ASSETS = [
  { id: "skill", x: 1190, y: 170, kind: "SKILL", title: "filter, then search", sub: "when: id unknown · avoid: guessing", foot: "seen in runs 1, 2, 3", prov: "filter" as Ent },
  { id: "gds", x: 1190, y: 315, kind: "GDS INSIGHT", title: "search() is the hub", sub: "centrality · path frequency · communities", foot: "computed over all runs", prov: "search" as Ent },
  { id: "data", x: 1190, y: 460, kind: "TRAINING DATA", title: "3 verified trajectories", sub: "SFT pairs · reward labels", foot: "every example points at its run", prov: "ok" as Ent },
];

// Timeline (ms)
const T_APPEAR = 200, T_MERGE = 2500, MOVE = 650, T_EDGES = 4100, T_PATTERN = 5000, T_ASSET = 5800, ASSET_GAP = 450, T_PROV = 6300;
const HOLD = 10200, DURATION = 10900;

const appearAt = (r: number, i: number) => T_APPEAR + r * 320 + i * 70;
const mergeAt = (r: number, i: number) => T_MERGE + r * 260 + i * 70;
const arriveAt = (r: number, i: number) => mergeAt(r, i) + MOVE;

// Edges with multiplicity, and each step's token track (first arrival per entity stays; later ones fold in).
const edgeCount = new Map<string, number>();
const firstArrival = new Map<Ent, number>();
RUNS.forEach((run, r) => {
  run.forEach((e, i) => {
    if (i > 0) { const k = `${run[i - 1]}>${e}`; edgeCount.set(k, (edgeCount.get(k) ?? 0) + 1); }
    const a = arriveAt(r, i);
    if (!firstArrival.has(e) || a < firstArrival.get(e)!) firstArrival.set(e, a);
  });
});
const EDGES = [...edgeCount.entries()].map(([k, n]) => { const [u, v] = k.split(">") as [Ent, Ent]; return { k, u, v, n }; });

const stepTracks = RUNS.flatMap((run, r) =>
  run.map((e, i) => {
    const sx = SX0 + i * SDX, sy = ROW_Y[r];
    const t0 = appearAt(r, i), tm = mergeAt(r, i), ta = arriveAt(r, i);
    const primary = firstArrival.get(e) === ta;
    const gx = G[e].x, gy = G[e].y;
    return {
      e, r, i, primary,
      track: defineTrack(`gw-${r}-${i}`, [
        { t: t0, x: sx, y: sy + 8, opacity: 0, scale: 0.6 },
        { t: t0 + 260, x: sx, y: sy, opacity: 1, scale: 0.78, ease: "out" },
        { t: tm, x: sx, y: sy, ease: "hold" },
        { t: ta, x: gx, y: gy, scale: 1, ease: "inOut" },
        ...(primary
          ? [{ t: HOLD, x: gx, y: gy, ease: "hold" as const }, { t: DURATION, x: gx, y: gy, opacity: 0, ease: "linear" as const }]
          : [{ t: ta + 220, x: gx, y: gy, opacity: 0, scale: 0.7, ease: "out" as const }]),
      ]),
    };
  }),
);

const still = (id: string, x: number, y: number, t0: number) =>
  defineTrack(id, [
    { t: t0, x, y: y + 8, opacity: 0, scale: 0.92 },
    { t: t0 + 380, x, y, opacity: 1, scale: 1, ease: "out" },
    { t: HOLD, x, y, ease: "hold" },
    { t: DURATION, x, y, opacity: 0, ease: "linear" },
  ]);
const assetTracks = ASSETS.map((a, i) => still(`gw-${a.id}`, a.x, a.y, T_ASSET + i * ASSET_GAP));

const ramp = (t: number, from: number, ms: number) => Math.min(Math.max((t - from) / ms, 0), 1);

/** Everything drawn in SVG: strip rails, graph edges + labels, pattern badge, provenance. Opacity is frame-driven. */
const Scenery = () => {
  const edgesRef = useRef<SVGGElement | null>(null);
  const labelsRef = useRef<SVGGElement | null>(null);
  const patternRef = useRef<SVGGElement | null>(null);
  const provRef = useRef<SVGGElement | null>(null);
  const railsRef = useRef<SVGGElement | null>(null);

  useFlowFrame((t) => {
    const decay = t >= HOLD ? Math.max(0, 1 - (t - HOLD) / 400) : 1;
    // strip rails: in with their row, out as the row merges
    railsRef.current && Array.from(railsRef.current.children).forEach((el, r) => {
      const on = ramp(t, appearAt(r, 0) + 100, 300) * (1 - 0.6 * ramp(t, mergeAt(r, 0), 500));
      (el as SVGElement).style.opacity = String(on * decay);
    });
    edgesRef.current && Array.from(edgesRef.current.children).forEach((el, i) => {
      const e = EDGES[i];
      const on = ramp(t, T_EDGES + i * 40, 320);
      const hot = PATTERN.has(e.k) ? ramp(t, T_PATTERN, 400) : 0;
      const g = el as SVGGElement;
      g.style.opacity = String(on * decay);
      g.dataset.hot = hot > 0.5 ? "true" : "false";
    });
    labelsRef.current && Array.from(labelsRef.current.children).forEach((el, i) => {
      const e = Object.keys(G)[i] as Ent;
      (el as SVGElement).style.opacity = String(ramp(t, (firstArrival.get(e) ?? 0) + 80, 300) * decay);
    });
    if (patternRef.current) patternRef.current.style.opacity = String(ramp(t, T_PATTERN + 200, 400) * decay);
    if (provRef.current) provRef.current.style.opacity = String(ramp(t, T_PROV, 500) * decay);
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg gw-svg" style={{ position: "absolute", inset: 0 }}>
      {/* column headers */}
      <text className="label" x={SX0 + 3 * SDX} y={64} textAnchor="middle">trajectories · episodic</text>
      <text className="label" x={745} y={64} textAnchor="middle">graph · the workbench</text>
      <text className="label" x={ASSETS[0].x} y={64} textAnchor="middle">assets · durable</text>
      <rect className="gw-bench" x={470} y={84} width={550} height={440} rx={22} />

      {/* strip rails + run numbers */}
      <g ref={railsRef}>
        {RUNS.map((run, r) => (
          <g key={r} style={{ opacity: 0 }}>
            <line className="gw-rail" x1={SX0} y1={ROW_Y[r]} x2={SX0 + (run.length - 1) * SDX} y2={ROW_Y[r]} />
            <text className="gw-run" x={SX0 - 34} y={ROW_Y[r] + 5}>run {r + 1}</text>
            {run.map((e, i) => (
              <circle key={i} className={`gw-ghost ${e}`} cx={SX0 + i * SDX} cy={ROW_Y[r]} r={7} />
            ))}
          </g>
        ))}
      </g>

      {/* graph edges, weight = how many runs took that step */}
      <g ref={edgesRef}>
        {EDGES.map((e) => {
          const a = G[e.u], b = G[e.v];
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          return (
            <g key={e.k} className="gw-edge" style={{ opacity: 0 }} data-hot="false">
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} style={{ strokeWidth: 1.5 + e.n * 1.6 }} markerEnd="url(#gw-arrow)" />
              {e.n > 1 ? (
                <g>
                  <rect x={mx - 15} y={my - 11} width={30} height={22} rx={11} className="gw-badge-bg" />
                  <text x={mx} y={my + 5} textAnchor="middle" className="gw-badge">×{e.n}</text>
                </g>
              ) : null}
            </g>
          );
        })}
      </g>

      {/* node labels */}
      <g ref={labelsRef}>
        {(Object.keys(G) as Ent[]).map((e) => (
          <text key={e} className="gw-node-label" x={G[e].x} y={G[e].y + 36} textAnchor="middle" style={{ opacity: 0 }}>{LABEL[e]}</text>
        ))}
      </g>

      {/* pattern callout */}
      <g ref={patternRef} style={{ opacity: 0 }}>
        <text className="gw-pattern" x={745} y={550} textAnchor="middle">filter → search → success repeats in 3 of 4 runs</text>
      </g>

      {/* provenance from each asset back into the graph */}
      <g ref={provRef} style={{ opacity: 0 }}>
        {ASSETS.map((a) => (
          <line key={a.id} className="gw-prov" x1={a.x - 140} y1={a.y} x2={G[a.prov].x + 16} y2={G[a.prov].y} />
        ))}
      </g>

      <defs>
        <marker id="gw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>
    </svg>
  );
};

export const GraphPipeline = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={HOLD - 300}
    aria-label="Four episodic runs merge onto one graph that keeps all of them; the path that repeats across runs stands out and is worked into assets — a skill, a graph-analytics insight, verified training data — each keeping provenance back to the runs"
    controls={false}
    {...motion({ holdAt: HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-loop">
      <Scenery />
      {stepTracks.map((s) => (
        <Flow.Token key={s.track.id} track={s.track}>
          <div className={`gw-node ${s.e}`} />
        </Flow.Token>
      ))}
      {ASSETS.map((a, i) => (
        <Flow.Token key={a.id} track={assetTracks[i]}>
          <div className={`gw-asset ${a.id}`}>
            <div className="gw-asset-kicker">{a.kind}</div>
            <div className="gw-asset-title">{a.title}</div>
            <div className="gw-asset-sub">{a.sub}</div>
            <div className="gw-asset-foot">{a.foot} · provenance kept</div>
          </div>
        </Flow.Token>
      ))}
    </Flow.Stage>
  </Flow.Root>
);
