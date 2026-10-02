import { useRef } from "react";
import { motion } from "./motion";
import { Flow, defineTrack, useFlowFrame } from "../flow";
import "./diagrams.css";

/**
 * A context graph: three memories in one graph. Builds progressively —
 *   1. short-term: the conversation and its messages
 *   2. long-term:  entities the messages mention
 *   3. reasoning:  a message triggers a reasoning trace → steps → tool call →
 *                  tool, and the tool call retrieves a long-term entity
 * The cross-memory relationships (TRIGGERED, MENTIONED_IN, RETRIEVED) are the
 * point: one graph, so the three can be traversed together.
 *
 * Stage is 1400 design units rendered at 1400px — units are px.
 */
const W = 1400;
const H = 430;
const NODE_H = 46;

type Mem = "st" | "rs" | "lt";
interface Node { id: string; label: string; mem: Mem; x: number; y: number; w: number; t: number }
const T1 = 200, T2 = 2700, T3 = 4400; // phase starts: short-term, long-term, reasoning
const T_COMPLETE = T3 + 2500 + 380; // last cross-memory edge fully drawn
const HOLD = T_COMPLETE + 5000;      // hold the finished graph for 5s before the loop fades and redraws
const DURATION = HOLD + 700;

const NODES: Node[] = [
  // short-term row
  { id: "conv", label: "Conversation", mem: "st", x: 140, y: 110, w: 156, t: T1 },
  { id: "m1", label: "Message", mem: "st", x: 400, y: 110, w: 112, t: T1 + 500 },
  { id: "m2", label: "Message", mem: "st", x: 640, y: 110, w: 112, t: T1 + 1000 },
  { id: "m3", label: "Message", mem: "st", x: 880, y: 110, w: 112, t: T1 + 1500 },
  // reasoning row
  { id: "trace", label: "ReasoningTrace", mem: "rs", x: 330, y: 340, w: 178, t: T3 + 500 },
  { id: "step", label: "ReasoningStep", mem: "rs", x: 610, y: 340, w: 168, t: T3 + 1000 },
  { id: "call", label: "ToolCall", mem: "rs", x: 860, y: 340, w: 112, t: T3 + 1500 },
  { id: "tool", label: "Tool", mem: "rs", x: 1090, y: 380, w: 84, t: T3 + 2000 },
  // long-term
  { id: "person", label: "Entity:Person", mem: "lt", x: 1130, y: 74, w: 160, t: T2 },
  { id: "org", label: "Entity:Organization", mem: "lt", x: 1250, y: 222, w: 212, t: T2 + 500 },
];
const byId = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, Node>;

interface Edge { from: string; to: string; label: string; t: number; style?: "solid" | "dashed" | "dotted"; mem: Mem | "x" }
const EDGES: Edge[] = [
  { from: "conv", to: "m1", label: "FIRST_MESSAGE", t: T1 + 350, mem: "st" },
  { from: "m1", to: "m2", label: "NEXT_MESSAGE", t: T1 + 850, mem: "st" },
  { from: "m2", to: "m3", label: "NEXT_MESSAGE", t: T1 + 1350, mem: "st" },
  { from: "person", to: "org", label: "WORKS_AT", t: T2 + 400, mem: "lt", style: "dotted" },
  { from: "person", to: "m3", label: "MENTIONED_IN", t: T2 + 900, mem: "x", style: "dashed" },
  { from: "m1", to: "trace", label: "TRIGGERED", t: T3, mem: "x", style: "solid" },
  { from: "trace", to: "step", label: "HAS_STEP", t: T3 + 850, mem: "rs" },
  { from: "step", to: "call", label: "USED_TOOL", t: T3 + 1350, mem: "rs" },
  { from: "call", to: "tool", label: "CALL_OF", t: T3 + 1850, mem: "rs" },
  { from: "call", to: "org", label: "RETRIEVED", t: T3 + 2500, mem: "x", style: "dashed" },
];

/** Trim a segment so it starts/ends at the pill boundary (ellipse approximation) plus a small gap. */
const trim = (a: Node, b: Node, gap = 8) => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const r = (n: Node) => 1 / Math.sqrt((ux / (n.w / 2)) ** 2 + (uy / (NODE_H / 2)) ** 2) + gap;
  const ra = r(a), rb = r(b);
  return { x1: a.x + ux * ra, y1: a.y + uy * ra, x2: b.x - ux * rb, y2: b.y - uy * rb, ux, uy };
};

const still = (id: string, x: number, y: number, t0: number) =>
  defineTrack(id, [
    { t: t0, x, y: y + 8, opacity: 0, scale: 0.9 },
    { t: t0 + 340, x, y, opacity: 1, scale: 1, ease: "out" },
    { t: HOLD, x, y, ease: "hold" },
    { t: DURATION, x, y, opacity: 0, ease: "linear" },
  ]);
const nodeTracks = NODES.map((n) => still(`cg-${n.id}`, n.x, n.y, n.t));

const ramp = (t: number, from: number, ms: number) => Math.min(Math.max((t - from) / ms, 0), 1);

const Edges = () => {
  const gRef = useRef<SVGGElement | null>(null);
  const regRef = useRef<SVGGElement | null>(null);
  useFlowFrame((t) => {
    const decay = t >= HOLD ? Math.max(0, 1 - (t - HOLD) / 400) : 1;
    gRef.current && Array.from(gRef.current.children).forEach((el, i) => {
      (el as SVGElement).style.opacity = String(ramp(t, EDGES[i].t, 380) * decay);
    });
    regRef.current && Array.from(regRef.current.children).forEach((el, i) => {
      (el as SVGElement).style.opacity = String(ramp(t, [T1, T3, T2][i], 400) * decay);
    });
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg cg-svg" style={{ position: "absolute", inset: 0 }}>
      <g ref={regRef}>
        <text className="cg-region st" x={62} y={38} style={{ opacity: 0 }}>short-term · the conversation</text>
        <text className="cg-region rs" x={240} y={H - 14} style={{ opacity: 0 }}>reasoning · the decision trace</text>
        <text className="cg-region lt" x={W - 40} y={24} textAnchor="end" style={{ opacity: 0 }}>long-term · enterprise knowledge</text>
      </g>
      <g ref={gRef}>
        {EDGES.map((e) => {
          const a = byId[e.from], b = byId[e.to];
          const s = trim(a, b);
          // Label sits beside the midpoint on the upper side of the edge. On
          // horizontal edges it is centred above; on sloped edges it is anchored
          // so the whole word sits clear of the line instead of straddling it.
          const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2;
          let nx = -s.uy, ny = s.ux;
          if (ny > 0) { nx = -nx; ny = -ny; }
          const horizontal = Math.abs(s.uy) < 0.35;
          const off = horizontal ? 18 : 12;
          const lx = mx + nx * off, ly = my + ny * off + 4;
          const anchor = horizontal ? "middle" : nx < 0 ? "end" : "start";
          return (
            <g key={e.from + e.to} className={`cg-edge ${e.mem} ${e.style ?? "solid"}`} style={{ opacity: 0 }}>
              <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} markerEnd={`url(#cg-arrow-${e.mem})`} />
              <text x={lx} y={ly} textAnchor={anchor}>{e.label}</text>
            </g>
          );
        })}
      </g>
      <defs>
        {(["st", "rs", "lt", "x"] as const).map((m) => (
          <marker key={m} id={`cg-arrow-${m}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className={`cg-head ${m}`} />
          </marker>
        ))}
      </defs>
    </svg>
  );
};

export const ContextGraph = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={HOLD - 300}
    aria-label="A context graph built in three passes: the conversation's messages, the long-term entities they mention, then the reasoning trace one message triggers, which retrieves a long-term entity — all one graph"
    controls={false}
    {...motion({ holdAt: HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-loop">
      <Edges />
      {NODES.map((n, i) => (
        <Flow.Token key={n.id} track={nodeTracks[i]}>
          <div className={`cg-node ${n.mem}`} style={{ width: n.w, height: NODE_H }}>{n.label}</div>
        </Flow.Token>
      ))}
    </Flow.Stage>
  </Flow.Root>
);
