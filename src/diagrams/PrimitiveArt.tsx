/**
 * Evocative thumbnails for the "several primitives" slide — one per
 * knowledge representation. Pure SVG, brand palette, no text to read.
 * Each is drawn on a 300×120 canvas and stretches to its card's width.
 */
const VB = "0 0 300 120";

/** Markdown & hypertext: a heading, prose lines, a list, a link. */
const TextArt = () => (
  <svg viewBox={VB} className="prim-art" aria-hidden="true">
    <rect x="16" y="14" width="10" height="10" rx="2" fill="var(--teal)" />
    <rect x="32" y="15" width="120" height="8" rx="4" fill="var(--teal)" />
    {[
      [16, 38, 268], [16, 52, 244], [16, 66, 256],
    ].map(([x, y, w]) => (
      <rect key={y} x={x} y={y} width={w} height="6" rx="3" fill="var(--fg-border)" />
    ))}
    <circle cx="20" cy="86" r="3" fill="var(--teal2)" />
    <rect x="30" y="83" width="150" height="6" rx="3" fill="var(--fg-border)" />
    <circle cx="20" cy="102" r="3" fill="var(--teal2)" />
    <rect x="30" y="99" width="96" height="6" rx="3" fill="var(--fg-border)" />
    <rect x="132" y="99" width="70" height="6" rx="3" fill="var(--teal)" />
    <rect x="132" y="108" width="70" height="1.5" fill="var(--teal)" />
  </svg>
);

/** Vector embeddings: a heat strip of components and a point cloud with a nearest-neighbour ring. */
const DenseArt = () => {
  const cells = Array.from({ length: 24 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7 + 0.4) * Math.cos(i * 0.6)));
  const pts: [number, number, number][] = [
    [64, 78, 3], [88, 96, 3], [110, 70, 3], [140, 90, 3], [176, 64, 3], [210, 98, 3], [236, 74, 3], [262, 92, 3],
    [128, 104, 2.4], [196, 82, 2.4], [40, 100, 2.4], [250, 60, 2.4],
  ];
  return (
    <svg viewBox={VB} className="prim-art" aria-hidden="true">
      {cells.map((a, i) => (
        <rect key={i} x={16 + i * 11.2} y="14" width="9.6" height="22" rx="2" fill="var(--blue)" opacity={a} />
      ))}
      <text x="16" y="50" className="prim-mono">[ 0.13  −0.42  0.88  0.07  …  −0.31 ]</text>
      {pts.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="var(--blue)" opacity={0.55} />
      ))}
      <circle cx="176" cy="84" r="22" fill="none" stroke="var(--blue)" strokeWidth="1.5" strokeDasharray="4 4" />
      <circle cx="176" cy="84" r="4.5" fill="var(--blue)" />
      {[[176, 64], [196, 82], [140, 90]].map(([x, y], i) => (
        <line key={i} x1="176" y1="84" x2={x} y2={y} stroke="var(--blue)" strokeWidth="1.2" opacity="0.7" />
      ))}
    </svg>
  );
};

/** Model weights: a dense matrix of parameters, a few of them hot. */
const CompiledArt = () => {
  const cols = 18, rows = 6, cw = 14.2, ch = 15;
  const cells: { x: number; y: number; a: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = Math.abs(Math.sin(r * 2.3 + c * 0.9) * Math.cos(c * 0.37 - r));
      cells.push({ x: 16 + c * cw, y: 14 + r * ch, a: 0.08 + 0.85 * v * v });
    }
  }
  return (
    <svg viewBox={VB} className="prim-art" aria-hidden="true">
      {cells.map((k, i) => (
        <rect key={i} x={k.x} y={k.y} width={cw - 2.2} height={ch - 2.4} rx="1.5" fill="var(--coral)" opacity={k.a} />
      ))}
      <text x="16" y="114" className="prim-mono">W ∈ ℝ^(4096×4096) · frozen</text>
    </svg>
  );
};

/** Knowledge graph: labelled nodes and typed relationships, one path lit. */
const StructuredArt = () => {
  const N: Record<string, [number, number]> = {
    a: [40, 40], b: [110, 24], c: [120, 84], d: [190, 56], e: [250, 28], f: [262, 88], g: [34, 92],
  };
  const E: [string, string, boolean][] = [
    ["a", "b", true], ["b", "d", true], ["d", "f", true], ["a", "c", false], ["c", "d", false],
    ["d", "e", false], ["c", "g", false], ["a", "g", false], ["e", "f", false],
  ];
  return (
    <svg viewBox={VB} className="prim-art" aria-hidden="true">
      {E.map(([u, v, hot]) => (
        <line key={u + v} x1={N[u][0]} y1={N[u][1]} x2={N[v][0]} y2={N[v][1]}
          stroke={hot ? "var(--green-ink)" : "var(--fg-border)"} strokeWidth={hot ? 2.4 : 1.6} />
      ))}
      {Object.entries(N).map(([k, [x, y]]) => {
        const hot = "abdf".includes(k);
        return (
          <g key={k}>
            <circle cx={x} cy={y} r={hot ? 11 : 9} fill={hot ? "var(--green)" : "var(--paper)"}
              stroke={hot ? "var(--green-ink)" : "var(--fg-tertiary)"} strokeWidth="1.8" />
            <rect x={x - 7} y={y - 2} width="14" height="4" rx="2" fill={hot ? "#fff" : "var(--fg-border)"} opacity="0.9" />
          </g>
        );
      })}
      <text x="150" y="114" className="prim-mono" textAnchor="middle">(:Failure)-[:FOLLOWED_BY]-&gt;(:Retry)</text>
    </svg>
  );
};


// ── "Where does learning end up?" — context / knowledge / weights ─────

/** Context: a wall of inscrutable replayed text. */
const ContextArt = () => {
  // Deterministic pseudo-log tokens so the wall looks like real transcript noise.
  const CH = "0123456789abcdef";
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const hex = (n: number) => Array.from({ length: n }, () => CH[Math.floor(rnd() * 16)]).join("");
  const frags = ["tool_call", "obs", "retry", "id", "argv", "span", "ok", "err", "ctx", "tok", "usr", "sys", "res", "ts"];
  const line = () => {
    let out = "";
    while (out.length < 62) out += `${frags[Math.floor(rnd() * frags.length)]}:${hex(2 + Math.floor(rnd() * 6))} `;
    return out.slice(0, 62);
  };
  const lines = Array.from({ length: 11 }, line);
  return (
    <svg viewBox={VB} className="prim-art" aria-hidden="true">
      <defs>
        <linearGradient id="ctx-fade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--fg-secondary)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--fg-secondary)" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {lines.map((l, i) => (
        <text key={i} x="14" y={16 + i * 9.6} className="prim-wall" fill="url(#ctx-fade)">{l}</text>
      ))}
    </svg>
  );
};

/** Small line icons for the knowledge graph, each drawn around (x, y). */
const Ico = {
  person: (x: number, y: number) => (
    <g>
      <circle cx={x} cy={y - 5} r="4.2" />
      <path d={`M ${x - 8} ${y + 9} a 8 6 0 0 1 16 0 Z`} />
    </g>
  ),
  building: (x: number, y: number) => (
    <g>
      <rect x={x - 8} y={y - 10} width="16" height="20" rx="1.5" />
      {[-4.5, 0.5].map((dx) => [-6, -1, 4].map((dy) => (
        <rect key={`${dx}${dy}`} x={x + dx} y={y + dy} width="3.5" height="3" fill="currentColor" stroke="none" opacity="0.9" />
      )))}
    </g>
  ),
  computer: (x: number, y: number) => (
    <g>
      <rect x={x - 11} y={y - 9} width="22" height="14" rx="2" />
      <line x1={x} y1={y + 5} x2={x} y2={y + 9} />
      <line x1={x - 6} y1={y + 9} x2={x + 6} y2={y + 9} />
    </g>
  ),
  skill: (x: number, y: number) => (
    <g>
      <path d={`M ${x - 8} ${y - 11} H ${x + 4} L ${x + 8} ${y - 7} V ${y + 11} H ${x - 8} Z`} />
      <path d={`M ${x + 4} ${y - 11} V ${y - 7} H ${x + 8}`} />
      {[-2, 2, 6].map((dy) => (
        <line key={dy} x1={x - 4.5} y1={y + dy} x2={x + 4.5} y2={y + dy} />
      ))}
    </g>
  ),
  memory: (x: number, y: number) => (
    <g>
      <ellipse cx={x} cy={y - 7} rx="9" ry="3.2" />
      <path d={`M ${x - 9} ${y - 7} V ${y + 6} a 9 3.2 0 0 0 18 0 V ${y - 7}`} />
      <path d={`M ${x - 9} ${y} a 9 3.2 0 0 0 18 0`} />
    </g>
  ),
};

/** Knowledge: an orderly graph whose nodes are skills, memories, people, buildings, computers. */
const KnowledgeArt = () => {
  type Kind = keyof typeof Ico;
  const nodes: { id: string; k: Kind; x: number; y: number; hot?: boolean }[] = [
    { id: "s1", k: "skill", x: 58, y: 30, hot: true },
    { id: "m1", k: "memory", x: 150, y: 30, hot: true },
    { id: "s2", k: "skill", x: 242, y: 30 },
    { id: "p1", k: "person", x: 36, y: 90 },
    { id: "c1", k: "computer", x: 112, y: 90, hot: true },
    { id: "b1", k: "building", x: 188, y: 90 },
    { id: "p2", k: "person", x: 264, y: 90 },
  ];
  const edges: [string, string, boolean?][] = [
    ["s1", "m1", true], ["m1", "s2"], ["s1", "c1", true], ["m1", "c1", true], ["m1", "b1"], ["s2", "b1"],
    ["p1", "c1"], ["b1", "p2"], ["c1", "b1"],
  ];
  const at = (id: string) => nodes.find((n) => n.id === id)!;
  return (
    <svg viewBox={VB} className="prim-art" aria-hidden="true">
      {edges.map(([u, v, hot]) => (
        <line key={u + v} x1={at(u).x} y1={at(u).y} x2={at(v).x} y2={at(v).y}
          stroke={hot ? "var(--green-ink)" : "var(--fg-border)"} strokeWidth={hot ? 2.2 : 1.6} />
      ))}
      {nodes.map((n) => (
        <g key={n.id} className={`prim-ico ${n.hot ? "hot" : ""}`}>
          <rect x={n.x - 15} y={n.y - 15} width="30" height="30" rx="7" className="prim-ico-bg" />
          {Ico[n.k](n.x, n.y)}
        </g>
      ))}
      <text x="150" y="116" className="prim-mono" textAnchor="middle">skills · memories · people · systems</text>
    </svg>
  );
};

/** Weights: a black box; the parameter matrix from earlier is barely visible inside. */
const WeightsArt = () => {
  const cols = 16, rows = 5, cw = 15, ch = 15;
  const cells: { x: number; y: number; a: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = Math.abs(Math.sin(r * 2.3 + c * 0.9) * Math.cos(c * 0.37 - r));
      cells.push({ x: 30 + c * cw, y: 24 + r * ch, a: 0.05 + 0.2 * v * v });
    }
  }
  return (
    <svg viewBox={VB} className="prim-art" aria-hidden="true">
      <rect x="14" y="10" width="272" height="100" rx="10" fill="var(--ink)" />
      <rect x="14" y="10" width="272" height="100" rx="10" fill="none" stroke="var(--fg-tertiary)" strokeWidth="1.5" opacity="0.5" />
      {cells.map((k, i) => (
        <rect key={i} x={k.x} y={k.y} width={cw - 2.6} height={ch - 2.6} rx="1.5" fill="var(--coral)" opacity={k.a} />
      ))}
      <g stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.55">
        <rect x="262" y="88" width="12" height="9" rx="1.5" />
        <path d="M 264.5 88 V 85 a 3.5 3.5 0 0 1 7 0 V 88" />
      </g>
      <text x="150" y="105" className="prim-mono" textAnchor="middle" style={{ fill: "rgba(255,255,255,0.45)" }}>no read access · no diff · no revert</text>
    </svg>
  );
};

export const LAYER_ART = {
  Context: <ContextArt />,
  Knowledge: <KnowledgeArt />,
  Weights: <WeightsArt />,
} as const;


// ── "Three ways a memory goes bad" ────────────────────────────────────

/** A skill document whose claims point at nothing. */
const UngroundedArt = () => (
  <svg viewBox={VB} className="prim-art" aria-hidden="true">
    <path d="M 30 22 H 96 L 116 42 V 104 H 30 Z" fill="var(--paper)" stroke="var(--fg-tertiary)" strokeWidth="1.8" />
    <path d="M 96 22 V 42 H 116" fill="none" stroke="var(--fg-tertiary)" strokeWidth="1.8" />
    {[52, 66, 80].map((y, i) => (
      <g key={y}>
        <rect x="42" y={y - 3} width={i === 1 ? 44 : 60} height="6" rx="3" fill="var(--fg-border)" />
        <line x1={i === 1 ? 92 : 108} y1={y} x2={190 + i * 26} y2={y - 20 + i * 20} stroke="var(--coral)" strokeWidth="1.6" strokeDasharray="4 4" />
        <circle cx={198 + i * 26} cy={y - 20 + i * 20} r="9" fill="var(--bg)" stroke="var(--coral)" strokeWidth="1.6" strokeDasharray="3 3" />
        <text x={198 + i * 26} y={y - 16 + i * 20} textAnchor="middle" className="prim-mono" style={{ fill: "var(--coral)", fontSize: 11 }}>?</text>
      </g>
    ))}
  </svg>
);

/** Two unrelated clusters welded together by one wrong edge. */
const IncoherentArt = () => {
  const A: [number, number][] = [[50, 40], [90, 28], [82, 76], [40, 84]];
  const B: [number, number][] = [[210, 40], [252, 34], [262, 84], [222, 90]];
  const edges = (P: [number, number][]) => P.flatMap((p, i) => P.slice(i + 1).map((q) => [p, q] as const));
  return (
    <svg viewBox={VB} className="prim-art" aria-hidden="true">
      {edges(A).map(([p, q], i) => <line key={`a${i}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="var(--fg-border)" strokeWidth="1.6" />)}
      {edges(B).map(([p, q], i) => <line key={`b${i}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="var(--fg-border)" strokeWidth="1.6" />)}
      <line x1="90" y1="28" x2="210" y2="40" stroke="var(--amber)" strokeWidth="3" />
      <line x1="140" y1="22" x2="160" y2="46" stroke="var(--coral)" strokeWidth="2.4" />
      <line x1="160" y1="22" x2="140" y2="46" stroke="var(--coral)" strokeWidth="2.4" />
      {A.map(([x, y], i) => <circle key={`an${i}`} cx={x} cy={y} r="9" fill="#e9f3f4" stroke="var(--teal2)" strokeWidth="1.8" />)}
      {B.map(([x, y], i) => <circle key={`bn${i}`} cx={x} cy={y} r="9" fill="#fdf1e3" stroke="var(--amber)" strokeWidth="1.8" />)}
      <text x="66" y="112" className="prim-mono" textAnchor="middle">billing dispute</text>
      <text x="236" y="112" className="prim-mono" textAnchor="middle">incident response</text>
    </svg>
  );
};

/** A grounded skill whose evidence has moved under it: one source gone, one changed. */
const DriftedArt = () => (
  <svg viewBox={VB} className="prim-art" aria-hidden="true">
    <path d="M 30 26 H 96 L 116 46 V 104 H 30 Z" fill="var(--paper)" stroke="var(--green-ink)" strokeWidth="1.8" />
    <path d="M 96 26 V 46 H 116" fill="none" stroke="var(--green-ink)" strokeWidth="1.8" />
    {[56, 70, 84].map((y) => <rect key={y} x="42" y={y - 3} width="58" height="6" rx="3" fill="var(--fg-border)" />)}
    {/* still grounded */}
    <line x1="116" y1="56" x2="178" y2="34" stroke="var(--green-ink)" strokeWidth="1.6" />
    <circle cx="188" cy="32" r="10" fill="#eaf2e2" stroke="var(--green-ink)" strokeWidth="1.8" />
    {/* stale: the source is gone */}
    <line x1="116" y1="70" x2="174" y2="70" stroke="var(--fg-tertiary)" strokeWidth="1.6" strokeDasharray="4 4" />
    <circle cx="188" cy="70" r="10" fill="none" stroke="var(--fg-tertiary)" strokeWidth="1.6" strokeDasharray="3 3" />
    <line x1="182" y1="64" x2="194" y2="76" stroke="var(--coral)" strokeWidth="2" />
    <line x1="194" y1="64" x2="182" y2="76" stroke="var(--coral)" strokeWidth="2" />
    <text x="206" y="74" className="prim-mono">stale</text>
    {/* contradicted: the outcome changed */}
    <line x1="116" y1="84" x2="176" y2="104" stroke="var(--amber)" strokeWidth="1.6" />
    <circle cx="188" cy="106" r="10" fill="#fdf1e3" stroke="var(--amber)" strokeWidth="1.8" />
    <text x="188" y="110" textAnchor="middle" className="prim-mono" style={{ fill: "var(--amber)", fontSize: 12, fontWeight: 700 }}>!</text>
    <text x="206" y="110" className="prim-mono">contradicted</text>
  </svg>
);

export const GATE_ART = {
  ungrounded: <UngroundedArt />,
  incoherent: <IncoherentArt />,
  drifted: <DriftedArt />,
} as const;

export const PRIMITIVE_ART = {
  TEXT: <TextArt />,
  DENSE: <DenseArt />,
  COMPILED: <CompiledArt />,
  STRUCTURED: <StructuredArt />,
} as const;
