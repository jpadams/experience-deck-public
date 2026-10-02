import { useRef } from "react";
import { motion } from "./motion";
import { Flow, useFlowFrame } from "../flow";
import "./diagrams.css";

/**
 * Provenance: trajectories on the left are the evidence; the distilled skill
 * on the right is the knowledge an agent reads. Every line of the skill links
 * back to the trace spans it came from, so it can be re-derived, checked and
 * repaired. Same refund task as the retrieval-crowding diagram on slide 5.
 */
// Stage is 1456 design units rendered at 1456px — units are px.
const W = 1456;
const H = 280;
const DURATION = 7000;
const HOLD = DURATION - 700;

type Kind = "neutral" | "bad" | "ok";
const RUNS: { id: string; spans: { label: string; kind: Kind }[] }[] = [
  { id: "1041", spans: [
    { label: "get order", kind: "neutral" },
    { label: "v1 refund", kind: "neutral" },
    { label: "410 Gone", kind: "bad" },
    { label: "v2 refund ✓", kind: "ok" },
  ] },
  { id: "1187", spans: [
    { label: "get order", kind: "neutral" },
    { label: "v2 refund ✓", kind: "ok" },
    { label: "notify", kind: "neutral" },
  ] },
  { id: "1203", spans: [
    { label: "search docs", kind: "neutral" },
    { label: "v1 refund", kind: "neutral" },
    { label: "410 Gone", kind: "bad" },
    { label: "gave up ✗", kind: "bad" },
  ] },
];
const ROW_Y = [78, 152, 226];
const SPAN_X0 = 112;
const SPAN_W = 132;
const SPAN_GAP = 12;
const SPAN_H = 40;
const spanX = (i: number) => SPAN_X0 + i * (SPAN_W + SPAN_GAP);

const CARD = { x: 842, y: 34, w: 614, h: 234 };
const LINE_X = CARD.x + 22;
const SKILL: { tag: string; text: string; cite: string; from: [number, number][] }[] = [
  { tag: "When", text: "order was paid through v2 checkout", cite: "1041·1", from: [[0, 0]] },
  { tag: "Step 1", text: "GET /v2/orders/{id}", cite: "1187·1", from: [[1, 0]] },
  { tag: "Step 2", text: "POST /v2/refunds + idempotency key", cite: "1187·2 1041·4", from: [[1, 1], [0, 3]] },
  { tag: "Pitfall", text: "v1 refund returns 410: skip it", cite: "1041·3 1203·3", from: [[0, 2], [2, 2]] },
];
const SKILL_Y = [106, 148, 190, 232];

const T = {
  runs: 200, // row r starts at runs + r * 420
  spanStep: 110,
  distill: 1700,
  card: 2000,
  line: 2250, // skill line i at line + i * 220
  links: 3500, // skill line i links back at links + i * 420
};
const linkT = (i: number) => T.links + i * 420;

const ProvenanceLines = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  useFlowFrame((t) => {
    const svg = svgRef.current;
    if (!svg) return;
    const decay = t >= HOLD ? Math.max(0, 1 - (t - HOLD) / 400) : 1;
    svg.querySelectorAll<SVGElement>("[data-t]").forEach((el) => {
      const p = Math.min(Math.max((t - Number(el.dataset.t)) / 300, 0), 1) * decay;
      el.style.opacity = String(p);
    });
    svg.querySelectorAll<SVGElement>("[data-hot]").forEach((el) => {
      el.dataset.on = t >= Number(el.dataset.hot) ? "true" : "false";
    });
  });

  // Earliest link time per source span, so each span lights when first cited.
  const hotAt = new Map<string, number>();
  SKILL.forEach((s, i) =>
    s.from.forEach(([r, k]) => {
      const key = `${r}-${k}`;
      hotAt.set(key, Math.min(hotAt.get(key) ?? Infinity, linkT(i)));
    }),
  );

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="dg-svg pv-svg" style={{ position: "absolute", inset: 0 }}>
      <text className="label" x={0} y={22} data-t={T.runs}>Trajectories · the evidence</text>
      <text className="label" x={CARD.x} y={22} data-t={T.card}>Knowledge · what the agent reads</text>

      {/* Provenance links sit under the spans; the span fills mask them. */}
      {SKILL.map((s, i) =>
        s.from.map(([r, k]) => {
          const x0 = spanX(k) + SPAN_W;
          const y0 = ROW_Y[r];
          const y1 = SKILL_Y[i] - 5;
          return (
            <path
              key={`${i}-${r}-${k}`}
              className="pv-link"
              data-t={linkT(i)}
              style={{ opacity: 0 }}
              d={`M ${x0} ${y0} C ${x0 + 120} ${y0}, ${LINE_X - 120} ${y1}, ${LINE_X - 8} ${y1}`}
            />
          );
        }),
      )}

      {RUNS.map((run, r) => (
        <g key={run.id}>
          <text className="pv-run" x={0} y={ROW_Y[r] + 5} data-t={T.runs + r * 420} style={{ opacity: 0 }}>
            run {run.id}
          </text>
          {run.spans.map((sp, k) => {
            const t0 = T.runs + r * 420 + (k + 1) * T.spanStep;
            const hot = hotAt.get(`${r}-${k}`);
            return (
              <g key={k} data-t={t0} style={{ opacity: 0 }}>
                {k > 0 ? <line className="pv-rail" x1={spanX(k) - SPAN_GAP} y1={ROW_Y[r]} x2={spanX(k)} y2={ROW_Y[r]} /> : null}
                <rect
                  className={`pv-span ${sp.kind}`}
                  data-hot={hot ?? undefined}
                  x={spanX(k)}
                  y={ROW_Y[r] - SPAN_H / 2}
                  width={SPAN_W}
                  height={SPAN_H}
                  rx={SPAN_H / 2}
                />
                <text className={`pv-span-label ${sp.kind}`} x={spanX(k) + SPAN_W / 2} y={ROW_Y[r] + 5} textAnchor="middle">
                  {sp.label}
                </text>
              </g>
            );
          })}
        </g>
      ))}

      <g data-t={T.distill} style={{ opacity: 0 }}>
        <path className="pl-arrow on" d={`M 716 ${ROW_Y[1] - 70} L 820 ${ROW_Y[1] - 70}`} markerEnd="url(#pv-arrow)" />
        <text className="label" x={768} y={ROW_Y[1] - 84} textAnchor="middle">Distill</text>
      </g>
      <text className="label pv-back" x={742} y={ROW_Y[2] + 46} textAnchor="middle" data-t={linkT(0)} style={{ opacity: 0 }}>
        ← Provenance
      </text>

      <g data-t={T.card} style={{ opacity: 0 }}>
        <rect className="pv-card" x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={16} />
        <text className="pv-card-title" x={LINE_X} y={CARD.y + 36}>Skill · refund via v2 API</text>
      </g>
      {SKILL.map((s, i) => (
        <g key={s.tag} data-t={T.line + i * 220} style={{ opacity: 0 }}>
          <text className={`pv-tag ${s.tag === "Pitfall" ? "bad" : ""}`} x={LINE_X} y={SKILL_Y[i]}>{s.tag}</text>
          <text className="pv-line" x={LINE_X + 86} y={SKILL_Y[i]}>{s.text}</text>
          <text className="pv-cite" x={CARD.x + CARD.w - 18} y={SKILL_Y[i]} textAnchor="end" data-t={linkT(i)} style={{ opacity: 0 }}>
            ↩ {s.cite}
          </text>
        </g>
      ))}

      <defs>
        <marker id="pv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--teal)" />
        </marker>
      </defs>
    </svg>
  );
};

export const ProvenanceTrail = () => (
  <Flow.Root
    duration={DURATION}
    posterTime={HOLD - 200}
    aria-label="Three refund runs are drawn as chains of steps: get order, v1 refund, 410 Gone, v2 refund. They are distilled into a skill card: when the order was paid through v2 checkout, get the order, post a v2 refund with an idempotency key, and a pitfall that the v1 refund returns 410. Dashed provenance links then run from each line of the skill back to the exact run steps it came from."
    controls={false}
    {...motion({ holdAt: HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-prov">
      <ProvenanceLines />
    </Flow.Stage>
  </Flow.Root>
);
