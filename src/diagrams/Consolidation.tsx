import { useRef } from "react";
import { motion } from "./motion";
import { Flow, defineTrack, useFlowFrame } from "../flow";
import "./diagrams.css";

/**
 * Consolidate while nobody's asking. Events stream in on the left as squares,
 * triangles and circles. Once the same kind (circle) has recurred five times,
 * a background pass merges them into one consolidated memory, off the request
 * path. Requests on the right are for squares, until one asks for a circle and
 * is served from the consolidated memory. Repetition is the signal (RecMem);
 * the work happens between requests (sleep-time compute).
 */
// Stage is 1456 design units rendered at 1456px — units are px.
const W = 1456;
const H = 330;
const DURATION = 11600;
const HOLD = DURATION - 700;

type Kind = "sq" | "tri" | "circ";
const EVENTS: Kind[] = ["sq", "tri", "circ", "sq", "circ", "sq", "tri", "circ", "sq", "sq", "tri", "circ", "sq", "tri", "sq", "circ"];
const EV_T0 = 300;
const EV_STEP = 330;
const evT = (i: number) => EV_T0 + i * EV_STEP;

const LEFT = { x: 0, y: 44, w: 500, h: 270 };
const COLS = 8;
const cellX = (i: number) => LEFT.x + 50 + (i % COLS) * 57;
const cellY = (i: number) => LEFT.y + 58 + Math.floor(i / COLS) * 66;
const CIRCLES = EVENTS.map((k, i) => (k === "circ" ? i : -1)).filter((i) => i >= 0);
const METER_Y = LEFT.y + 222;
const meterX = (n: number) => LEFT.x + 230 + n * 44;

const MID = { x: 560, y: 44, w: 336, h: 270 };
const MEM = { x: MID.x + MID.w / 2, y: MID.y + 118 };

const RIGHT = { x: 956, y: 44, w: 500, h: 270 };
const REQ_Y = [RIGHT.y + 56, RIGHT.y + 112, RIGHT.y + 168, RIGHT.y + 224];
const REQ_X = RIGHT.x + 28;

const T = {
  trigger: evT(EVENTS.length - 1) + 500,
  fly: 0, // set below
  merged: 0,
  ask: 0,
  link: 0,
  served: 0,
};
T.fly = T.trigger + 300;
T.merged = T.fly + 900;
T.ask = T.merged + 900;
T.link = T.ask + 600;
T.served = T.link + 500;
const REQS: { kind: Kind; t: number }[] = [
  { kind: "sq", t: 1100 },
  { kind: "sq", t: 2900 },
  { kind: "sq", t: 4700 },
  { kind: "circ", t: T.ask },
];

const Shape = ({ kind, x, y, s = 30, className = "" }: { kind: Kind; x: number; y: number; s?: number; className?: string }) => {
  const h = s / 2;
  if (kind === "sq") return <rect className={`cs-shape sq ${className}`} x={x - h * 0.85} y={y - h * 0.85} width={s * 0.85} height={s * 0.85} rx={3} />;
  if (kind === "tri") return <path className={`cs-shape tri ${className}`} d={`M ${x} ${y - h} L ${x + h} ${y + h * 0.8} L ${x - h} ${y + h * 0.8} Z`} />;
  return <circle className={`cs-shape circ ${className}`} cx={x} cy={y} r={h * 0.9} />;
};

const fade = (t0: number) => ({ "data-t": t0, style: { opacity: 0 } });

const Lines = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  useFlowFrame((t) => {
    const svg = svgRef.current;
    if (!svg) return;
    const decay = t >= HOLD ? Math.max(0, 1 - (t - HOLD) / 400) : 1;
    svg.querySelectorAll<SVGElement>("[data-t]").forEach((el) => {
      const until = el.dataset.until ? Number(el.dataset.until) : Infinity;
      const inP = Math.min(Math.max((t - Number(el.dataset.t)) / 260, 0), 1);
      const outP = Math.min(Math.max((t - until) / 260, 0), 1);
      el.style.opacity = String(inP * (1 - outP) * decay);
    });
    svg.querySelectorAll<SVGElement>("[data-hot]").forEach((el) => {
      el.dataset.on = t >= Number(el.dataset.hot) ? "true" : "false";
    });
  });

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="dg-svg cs-svg" style={{ position: "absolute", inset: 0 }}>
      {/* Left: events */}
      <rect className="cs-box" x={LEFT.x} y={LEFT.y} width={LEFT.w} height={LEFT.h} rx={16} />
      <text className="label" x={LEFT.x + 4} y={LEFT.y - 14}>Events · as they happen</text>
      {EVENTS.map((k, i) => (
        <g key={i} {...fade(evT(i))}>
          <Shape kind={k} x={cellX(i)} y={cellY(i)} />
          {k === "circ" ? <circle className="cs-ring" data-hot={T.trigger} cx={cellX(i)} cy={cellY(i)} r={22} /> : null}
        </g>
      ))}
      <text className="cs-meter-label" x={LEFT.x + 26} y={METER_Y + 5}>Same kind seen</text>
      {CIRCLES.map((ev, n) => (
        <circle key={ev} className="cs-meter" data-hot={evT(ev)} cx={meterX(n)} cy={METER_Y} r={12} />
      ))}

      {/* Left → middle, once the threshold trips */}
      <g {...fade(T.trigger)}>
        <path className="pl-arrow on" d={`M ${LEFT.x + LEFT.w + 10} ${MEM.y} L ${MID.x - 12} ${MEM.y}`} markerEnd="url(#cs-arrow)" />
        <text className="label cs-teal" x={(LEFT.x + LEFT.w + MID.x) / 2} y={MEM.y - 14} textAnchor="middle">5×</text>
      </g>

      {/* Middle: background consolidation */}
      <rect className="cs-box bg" x={MID.x} y={MID.y} width={MID.w} height={MID.h} rx={16} />
      <text className="label" x={MID.x + 4} y={MID.y - 14}>Background consolidation</text>
      <text className="cs-state" x={MEM.x} y={MEM.y + 6} textAnchor="middle" data-t={0} data-until={T.trigger} style={{ opacity: 0 }}>idle</text>
      <text className="cs-state teal" x={MEM.x} y={MID.y + 222} textAnchor="middle" data-t={T.fly} data-until={T.merged} style={{ opacity: 0 }}>consolidating…</text>
      <g {...fade(T.merged)}>
        <circle className="cs-mem-halo" cx={MEM.x} cy={MEM.y} r={46} />
        <circle className="cs-shape circ mem" cx={MEM.x} cy={MEM.y} r={30} />
        <text className="cs-state teal" x={MEM.x} y={MID.y + 212} textAnchor="middle">1 consolidated memory</text>
        <text className="cs-sub" x={MEM.x} y={MID.y + 238} textAnchor="middle">built between requests</text>
      </g>

      {/* Right: requests */}
      <rect className="cs-box" x={RIGHT.x} y={RIGHT.y} width={RIGHT.w} height={RIGHT.h} rx={16} />
      <text className="label" x={RIGHT.x + 4} y={RIGHT.y - 14}>Requests · on the hot path</text>
      {REQS.map((r, i) => (
        <g key={i} {...fade(r.t)}>
          <rect className={`cs-req ${r.kind === "circ" ? "circ" : ""}`} x={REQ_X} y={REQ_Y[i] - 21} width={150} height={42} rx={21} />
          <text className="cs-req-label" x={REQ_X + 24} y={REQ_Y[i] + 6}>asks for</text>
          <Shape kind={r.kind} x={REQ_X + 122} y={REQ_Y[i]} s={24} />
          {r.kind === "circ" ? (
            <text className="cs-served teal" x={REQ_X + 172} y={REQ_Y[i] + 6} {...fade(T.served)}>✓ from consolidated memory</text>
          ) : (
            <text className="cs-served" x={REQ_X + 172} y={REQ_Y[i] + 6} {...fade(r.t + 450)}>✓ served</text>
          )}
        </g>
      ))}

      {/* Consolidated memory → the circle request */}
      <path
        className="cs-link"
        {...fade(T.link)}
        d={`M ${MEM.x + 34} ${MEM.y + 12} C ${MID.x + MID.w + 60} ${MEM.y + 40}, ${REQ_X - 80} ${REQ_Y[3]}, ${REQ_X - 8} ${REQ_Y[3]}`}
        markerEnd="url(#cs-arrow)"
      />

      <defs>
        <marker id="cs-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--teal)" />
        </marker>
      </defs>
    </svg>
  );
};

// Copies of the five circles fly into the middle and merge.
const FLY_TRACKS = CIRCLES.map((ev, n) =>
  defineTrack(`cs-fly-${n}`, [
    { t: T.fly + n * 90, x: cellX(ev), y: cellY(ev), opacity: 0, scale: 1 },
    { t: T.fly + n * 90 + 80, x: cellX(ev), y: cellY(ev), opacity: 1, ease: "linear" },
    { t: T.merged - 150, x: MEM.x, y: MEM.y, scale: 0.8, ease: "inOut" },
    { t: T.merged + 150, x: MEM.x, y: MEM.y, opacity: 0, ease: "linear" },
  ]),
);

export const Consolidation = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={HOLD - 200}
    aria-label="Events stream in on the left as squares, triangles and circles. When the fifth circle arrives, a same-kind meter fills and the five circles move into a background consolidation box, where they merge into one consolidated memory. Meanwhile requests on the right ask for squares and are served; then a request asks for a circle and is served from the consolidated memory."
    controls={false}
    {...motion({ holdAt: HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-prov">
      <Lines />
      {FLY_TRACKS.map((tr) => (
        <Flow.Token key={tr.id} track={tr}>
          <div className="cs-fly" />
        </Flow.Token>
      ))}
    </Flow.Stage>
  </Flow.Root>
);
