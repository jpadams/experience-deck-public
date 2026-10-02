import { useRef } from "react";
import { motion } from "./motion";
import { Flow, defineTrack, useFlowFrame } from "../flow";
import "./diagrams.css";

/**
 * The counter-argument: distillation doesn't only produce knowledge. An
 * incorrect answer disappears; an incorrect memory compounds — it loops
 * back into future experience instead of the future action alone.
 */
// Stage is 1300 design units rendered at 1300px — units are px.
const W = 1300;
const H = 520;
const DURATION = 8200;
const HOLD = DURATION - 700;

const N = {
  experience: { x: 650, y: 46 },
  distillation: { x: 650, y: 190 },
  knowledge: { x: 350, y: 334 },
  error: { x: 950, y: 334 },
  action: { x: 650, y: 478 },
};
const HH = 28; // node half-height

const TIMES = { experience: 400, distillation: 1300, split: 2400, action: 3500, loop: 4700 };

const node = (id: string, x: number, y: number, t0: number) =>
  defineTrack(id, [
    { t: t0, x, y: y + 8, opacity: 0, scale: 0.85 },
    { t: t0 + 320, x, y, opacity: 1, scale: 1, ease: "out" },
    { t: HOLD, x, y, ease: "hold" },
    { t: DURATION, x, y, opacity: 0, ease: "linear" },
  ]);

const NODE_TRACKS = {
  experience: node("ec-experience", N.experience.x, N.experience.y, TIMES.experience),
  distillation: node("ec-distillation", N.distillation.x, N.distillation.y, TIMES.distillation),
  knowledge: node("ec-knowledge", N.knowledge.x, N.knowledge.y, TIMES.split),
  error: node("ec-error", N.error.x, N.error.y, TIMES.split),
  action: node("ec-action", N.action.x, N.action.y, TIMES.action),
};

/** Must render *inside* Flow.Root — useFlowFrame needs the flow context. */
const EcEdges = () => {
  const arrowRef = useRef<SVGGElement | null>(null);
  const loopRef = useRef<SVGPathElement | null>(null);
  const loopLabelRef = useRef<SVGTextElement | null>(null);

  useFlowFrame((t) => {
    const decay = t >= HOLD ? Math.max(0, 1 - (t - HOLD) / 400) : 1;
    const g = arrowRef.current;
    if (g) {
      const onTimes = [TIMES.distillation, TIMES.split, TIMES.split, TIMES.action, TIMES.action];
      onTimes.forEach((onAt, i) => {
        const el = g.children[i] as SVGPathElement | undefined;
        if (!el) return;
        const p = Math.min(Math.max((t - (onAt + 150)) / 220, 0), 1) * decay;
        el.style.opacity = String(p);
      });
    }
    const loop = loopRef.current;
    const label = loopLabelRef.current;
    if (loop && label) {
      const p = Math.min(Math.max((t - TIMES.loop) / 420, 0), 1) * decay;
      loop.style.opacity = String(p);
      label.style.opacity = String(p);
    }
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg ec-svg" style={{ position: "absolute", inset: 0 }}>
      <g ref={arrowRef}>
        <path className="pl-arrow on" style={{ opacity: 0 }} d={`M ${N.experience.x} ${N.experience.y + HH} L ${N.distillation.x} ${N.distillation.y - HH - 6}`} markerEnd="url(#ec-arrow-ok)" />
        <path className="pl-arrow on" style={{ opacity: 0 }} d={`M ${N.distillation.x - 50} ${N.distillation.y + HH} L ${N.knowledge.x + 40} ${N.knowledge.y - HH - 8}`} markerEnd="url(#ec-arrow-ok)" />
        <path className="pl-arrow" style={{ opacity: 0, stroke: "var(--coral)" }} d={`M ${N.distillation.x + 50} ${N.distillation.y + HH} L ${N.error.x - 30} ${N.error.y - HH - 8}`} markerEnd="url(#ec-arrow-bad)" />
        <path className="pl-arrow on" style={{ opacity: 0 }} d={`M ${N.knowledge.x + 30} ${N.knowledge.y + HH} L ${N.action.x - 110} ${N.action.y - HH - 6}`} markerEnd="url(#ec-arrow-ok)" />
        <path className="pl-arrow" style={{ opacity: 0, stroke: "var(--coral)" }} d={`M ${N.error.x - 30} ${N.error.y + HH} L ${N.action.x + 110} ${N.action.y - HH - 6}`} markerEnd="url(#ec-arrow-bad)" />
      </g>
      <path
        ref={loopRef}
        className="pl-loop"
        style={{ opacity: 0 }}
        d={`M ${N.error.x + 80} ${N.error.y} C ${W - 60} ${N.error.y}, ${W - 60} ${N.experience.y}, ${N.experience.x + 120} ${N.experience.y}`}
        markerEnd="url(#ec-arrow-bad)"
      />
      <text ref={loopLabelRef} className="label" x={N.error.x + 175} y={N.error.y + 40} textAnchor="middle" style={{ opacity: 0, fill: "var(--coral)" }}>
        compounds
      </text>
      <defs>
        <marker id="ec-arrow-ok" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--teal)" />
        </marker>
        <marker id="ec-arrow-bad" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--coral)" />
        </marker>
      </defs>
    </svg>
  );
};

export const ErrorCompounds = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={HOLD - 200}
    aria-label="Distillation splits into knowledge and error. Error doesn't just reach the next action — it loops back into future experience and compounds."
    controls={false}
    {...motion({ holdAt: HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-distill">
      <EcEdges />
      <Flow.Token track={NODE_TRACKS.experience}><div className="ec-node neutral">EXPERIENCE</div></Flow.Token>
      <Flow.Token track={NODE_TRACKS.distillation}><div className="ec-node neutral">DISTILLATION</div></Flow.Token>
      <Flow.Token track={NODE_TRACKS.knowledge}><div className="ec-node good">KNOWLEDGE</div></Flow.Token>
      <Flow.Token track={NODE_TRACKS.error}><div className="ec-node bad">ERROR</div></Flow.Token>
      <Flow.Token track={NODE_TRACKS.action}><div className="ec-node neutral">FUTURE ACTION</div></Flow.Token>
    </Flow.Stage>
  </Flow.Root>
);
