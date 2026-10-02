import { useRef } from "react";
import { motion } from "./motion";
import { Flow, createSeededRandom, defineTrack, useFlowFrame } from "../flow";
import "./diagrams.css";

/**
 * The graph is the source code. Left two thirds: a small context graph draws
 * in, node by node, typed edge by typed edge. Then a compile arrow lights and
 * packets leave the graph for the right third, where a bracketed field of
 * bits fills in as each packet lands: the compiled artifact. The field keeps
 * flickering while the loop holds — fast, opaque, and re-derivable.
 *
 * Stage is 1400 design units rendered at 1400px — units are px.
 */
const W = 1400;
const H = 320;
const NODE_H = 40;

type Mem = "st" | "rs" | "lt";
interface Node { id: string; label: string; mem: Mem; x: number; y: number; w: number; t: number }
const NODES: Node[] = [
  { id: "skill", label: "Skill", mem: "lt", x: 130, y: 62, w: 88, t: 200 },
  { id: "step1", label: "SkillStep", mem: "lt", x: 360, y: 62, w: 126, t: 420 },
  { id: "step2", label: "SkillStep", mem: "lt", x: 600, y: 62, w: 126, t: 640 },
  { id: "policy", label: "Policy", mem: "lt", x: 830, y: 62, w: 92, t: 860 },
  { id: "msg", label: "Message", mem: "st", x: 130, y: 170, w: 112, t: 1080 },
  { id: "call", label: "ToolCall", mem: "rs", x: 360, y: 170, w: 112, t: 1300 },
  { id: "obs", label: "Observation", mem: "st", x: 600, y: 170, w: 140, t: 1520 },
  { id: "person", label: "Entity:Person", mem: "lt", x: 245, y: 278, w: 152, t: 1740 },
  { id: "org", label: "Entity:Organization", mem: "lt", x: 560, y: 278, w: 200, t: 1960 },
];
const byId = Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, Node>;

interface Edge { from: string; to: string; label: string; t: number; mem: Mem | "x"; style?: "solid" | "dashed" | "dotted"; labelAt?: number }
const EDGES: Edge[] = [
  { from: "skill", to: "step1", label: "HAS_STEP", t: 520, mem: "lt" },
  { from: "step1", to: "step2", label: "NEXT", t: 740, mem: "lt" },
  { from: "step2", to: "policy", label: "CHECKS", t: 960, mem: "lt" },
  { from: "msg", to: "call", label: "TRIGGERED", t: 1400, mem: "x" },
  { from: "step1", to: "call", label: "GROUNDED_IN", t: 1420, mem: "x", style: "dashed" },
  { from: "step2", to: "obs", label: "GROUNDED_IN", t: 1620, mem: "x", style: "dashed" },
  { from: "msg", to: "person", label: "MENTIONS", t: 1840, mem: "st" },
  { from: "call", to: "org", label: "RETRIEVED", t: 2060, mem: "rs", labelAt: 0.28 },
  { from: "obs", to: "org", label: "ABOUT", t: 2100, mem: "st", style: "dotted", labelAt: 0.6 },
  { from: "person", to: "org", label: "WORKS_AT", t: 2160, mem: "lt", style: "dotted" },
];

const T_COMPILE = 2650;
const T_PACKETS = 2950;
const PACKET_FROM = ["skill", "step1", "call", "obs", "org", "policy"];
const PACKET_GAP = 360;
const PACKET_MS = 720;
const ARROW = { x1: 960, x2: 1040, y: 160 };
const BRACKET = { x1: 1064, x2: 1392, y1: 34, y2: 292 };
const COLS = 12, ROWS = 7;
const BIT_X0 = 1084, BIT_Y0 = 46, BIT_DX = 24, BIT_DY = 34;
const N_BITS = COLS * ROWS;
const CHUNK = Math.ceil(N_BITS / PACKET_FROM.length);
const FILL_MS = 320;

const packetArrive = (k: number) => T_PACKETS + k * PACKET_GAP + PACKET_MS;
const T_FULL = packetArrive(PACKET_FROM.length - 1) + FILL_MS;
const HOLD = T_FULL + 4600;
const DURATION = HOLD + 700;

const rnd = createSeededRandom("compile-bits");
const BITS = Array.from({ length: N_BITS }, () => (rnd() < 0.5 ? "0" : "1"));

const ramp = (t: number, from: number, ms: number) => Math.min(Math.max((t - from) / ms, 0), 1);

/** Trim a segment so it starts/ends at the pill boundary plus a small gap. */
const trim = (a: Node, b: Node, gap = 8) => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const edge = (n: Node) => {
    const rx = n.w / 2 + gap, ry = NODE_H / 2 + gap;
    return 1 / Math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry));
  };
  const ra = edge(a), rb = edge(b);
  return { x1: a.x + ux * ra, y1: a.y + uy * ra, x2: b.x - ux * rb, y2: b.y - uy * rb, ux, uy };
};

const still = (id: string, x: number, y: number, t0: number) =>
  defineTrack(id, [
    { t: t0, x, y: y + 8, opacity: 0, scale: 0.9 },
    { t: t0 + 360, x, y, opacity: 1, scale: 1, ease: "out" },
    { t: HOLD, x, y, ease: "hold" },
    { t: DURATION, x, y, opacity: 0, ease: "linear" },
  ]);
const nodeTracks = NODES.map((n) => still(`cp-n-${n.id}`, n.x, n.y, n.t));
const packetTracks = PACKET_FROM.map((id, k) => {
  const n = byId[id];
  const t0 = T_PACKETS + k * PACKET_GAP;
  return defineTrack(`cp-p-${k}`, [
    { t: t0, x: n.x, y: n.y, opacity: 0, scale: 0.6 },
    { t: t0 + 120, x: n.x + 30, y: n.y, opacity: 1, scale: 1, ease: "out" },
    { t: t0 + PACKET_MS * 0.55, x: ARROW.x1 - 10, y: ARROW.y, ease: "inOut" },
    { t: t0 + PACKET_MS, x: BRACKET.x1 + 6, y: ARROW.y, ease: "linear" },
    { t: t0 + PACKET_MS + 140, x: BRACKET.x1 + 30, y: ARROW.y, opacity: 0, scale: 0.4, ease: "in" },
  ]);
});

const Wires = () => {
  const edgesRef = useRef<SVGGElement | null>(null);
  const arrowRef = useRef<SVGGElement | null>(null);
  const bracketRef = useRef<SVGGElement | null>(null);
  const bitsRef = useRef<HTMLDivElement | null>(null);

  useFlowFrame((t) => {
    const decay = t >= HOLD ? Math.max(0, 1 - (t - HOLD) / 400) : 1;
    const edges = edgesRef.current;
    if (edges) {
      Array.from(edges.children).forEach((el, i) => {
        (el as SVGElement).style.opacity = String(ramp(t, EDGES[i].t, 380) * decay);
      });
    }
    const arrow = arrowRef.current;
    if (arrow) {
      const on = ramp(t, T_COMPILE, 400);
      arrow.style.opacity = String(on * decay);
      arrow.dataset.hot = t >= T_PACKETS && t < T_FULL ? "true" : "false";
    }
    const br = bracketRef.current;
    if (br) br.style.opacity = String(ramp(t, T_COMPILE - 200, 400) * decay);
    const bits = bitsRef.current;
    if (bits) {
      const flicker = Math.floor(t / 420);
      for (let i = 0; i < N_BITS; i++) {
        const el = bits.children[i] as HTMLElement | undefined;
        if (!el) continue;
        const k = Math.floor(i / CHUNK);
        const inChunk = i - k * CHUNK;
        const at = packetArrive(k) + (inChunk / CHUNK) * FILL_MS;
        const on = ramp(t, at, 120);
        let bit = BITS[i];
        // Once full, a few bits keep changing: a compiled artifact is live, not carved.
        if (t >= T_FULL && (i * 7919 + flicker * 104729) % 23 === 0) bit = bit === "0" ? "1" : "0";
        el.textContent = bit;
        el.style.opacity = String(on * decay);
      }
    }
  });

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg cg-svg cp-svg" style={{ position: "absolute", inset: 0 }}>
        <text className="label" x={86} y={22}>source · the graph</text>
        <text className="label" x={BRACKET.x2} y={22} textAnchor="end">compiled artifact</text>
        <g ref={edgesRef}>
          {EDGES.map((e) => {
            const a = byId[e.from], b = byId[e.to];
            const s = trim(a, b);
            const u = e.labelAt ?? 0.5;
            const mx = s.x1 + (s.x2 - s.x1) * u, my = s.y1 + (s.y2 - s.y1) * u;
            let nx = -s.uy, ny = s.ux;
            if (ny > 0) { nx = -nx; ny = -ny; }
            const horizontal = Math.abs(s.uy) < 0.35;
            const off = horizontal ? 16 : 12;
            const lx = mx + nx * off, ly = my + ny * off + 4;
            const anchor = horizontal ? "middle" : nx < 0 ? "end" : "start";
            return (
              <g key={e.from + e.to} className={`cg-edge ${e.mem} ${e.style ?? "solid"}`} style={{ opacity: 0 }}>
                <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} markerEnd={`url(#cp-arrow-${e.mem})`} />
                <text x={lx} y={ly} textAnchor={anchor}>{e.label}</text>
              </g>
            );
          })}
        </g>
        <g ref={arrowRef} className="cp-compile" style={{ opacity: 0 }}>
          <line x1={ARROW.x1} y1={ARROW.y} x2={ARROW.x2 - 6} y2={ARROW.y} markerEnd="url(#cp-compile-head)" />
          <text x={(ARROW.x1 + ARROW.x2) / 2} y={ARROW.y - 16} textAnchor="middle">compile</text>
        </g>
        <g ref={bracketRef} className="cp-bracket" style={{ opacity: 0 }}>
          <path d={`M ${BRACKET.x1 + 18} ${BRACKET.y1} L ${BRACKET.x1} ${BRACKET.y1} L ${BRACKET.x1} ${BRACKET.y2} L ${BRACKET.x1 + 18} ${BRACKET.y2}`} />
          <path d={`M ${BRACKET.x2 - 18} ${BRACKET.y1} L ${BRACKET.x2} ${BRACKET.y1} L ${BRACKET.x2} ${BRACKET.y2} L ${BRACKET.x2 - 18} ${BRACKET.y2}`} />
        </g>
        <defs>
          {(["st", "rs", "lt", "x"] as const).map((m) => (
            <marker key={m} id={`cp-arrow-${m}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className={`cg-head ${m}`} />
            </marker>
          ))}
          <marker id="cp-compile-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="cp-compile-head" />
          </marker>
        </defs>
      </svg>
      <div ref={bitsRef} className="cp-bits" style={{ left: BIT_X0, top: BIT_Y0, gridTemplateColumns: `repeat(${COLS}, ${BIT_DX}px)`, gridAutoRows: `${BIT_DY}px` }}>
        {BITS.map((b, i) => (
          <span key={i} style={{ opacity: 0 }}>{b}</span>
        ))}
      </div>
    </>
  );
};

export const Compile = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={T_FULL + 600}
    aria-label="A small context graph of skills, steps, tool calls, observations and entities draws in on the left; a compile arrow lights and packets leave the graph for a bracketed field of ones and zeros on the right, which fills in as they land"
    controls={false}
    {...motion({ holdAt: HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-loop">
      <Wires />
      {NODES.map((n, i) => (
        <Flow.Token key={n.id} track={nodeTracks[i]}>
          <div className={`cg-node ${n.mem}`} style={{ width: n.w, height: NODE_H }}>{n.label}</div>
        </Flow.Token>
      ))}
      {packetTracks.map((tr, k) => (
        <Flow.Token key={tr.id} track={tr}>
          <div className="cp-packet">{BITS.slice(k * 4, k * 4 + 4).join("")}</div>
        </Flow.Token>
      ))}
    </Flow.Stage>
  </Flow.Root>
);
