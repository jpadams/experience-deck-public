/**
 * Icon-like illustrations for the ladder slide's two result cards.
 *   BREW: a knowledge base of recipes, drawn as a file tree. Every recipe
 *         carries when / steps / pitfalls and has passed a reward check.
 *   ReMe: memory as a plant that is tended, not piled up. A watering can
 *         curates (distill → reuse); shears prune a lower branch that
 *         stopped earning its keep.
 * Pure SVG, brand palette, drawn on a 600×220 canvas.
 */
const VB = "0 0 600 220";

type Row = { depth: number; kind: "dir" | "file"; name: string };
const TREE: Row[] = [
  { depth: 0, kind: "dir", name: "recipes/" },
  { depth: 1, kind: "dir", name: "checkout/" },
  { depth: 2, kind: "file", name: "refund-v2.md" },
  { depth: 2, kind: "file", name: "cancel-order.md" },
  { depth: 1, kind: "dir", name: "login/" },
  { depth: 2, kind: "file", name: "sso.md" },
];
const ROW_H = 34;
const X0 = 70;
const INDENT = 34;
const rowY = (i: number) => 22 + i * ROW_H;
const rowX = (d: number) => X0 + d * INDENT;

const Folder = ({ x, y }: { x: number; y: number }) => (
  <path className="ra-folder" d={`M ${x - 11} ${y - 8} h 8 l 3 3 h 11 v 13 h -22 z`} />
);
const File = ({ x, y }: { x: number; y: number }) => (
  <g className="ra-file">
    <path d={`M ${x - 8} ${y - 10} h 11 l 5 5 v 15 h -16 z`} />
    <line x1={x - 4} y1={y - 1} x2={x + 4} y2={y - 1} />
    <line x1={x - 4} y1={y + 4} x2={x + 4} y2={y + 4} />
  </g>
);

export const RecipeTreeArt = () => {
  // Parent index for each row, to draw the tree rails.
  const parent = TREE.map((r, i) => {
    for (let j = i - 1; j >= 0; j--) if (TREE[j].depth === r.depth - 1) return j;
    return -1;
  });
  return (
    <svg viewBox={VB} className="ra-art" aria-hidden="true">
      {TREE.map((r, i) => {
        const p = parent[i];
        if (p < 0) return null;
        const px = rowX(TREE[p].depth);
        return (
          <path
            key={`rail-${i}`}
            className="ra-rail"
            d={`M ${px} ${rowY(p) + 12} V ${rowY(i)} H ${rowX(r.depth) - 16}`}
          />
        );
      })}
      {TREE.map((r, i) => {
        const x = rowX(r.depth);
        const y = rowY(i);
        return (
          <g key={r.name}>
            {r.kind === "dir" ? <Folder x={x} y={y} /> : <File x={x} y={y} />}
            <text className={`ra-name ${r.kind}`} x={x + 18} y={y + 5}>{r.name}</text>
            {r.kind === "file" ? (
              <g>
                {["when", "steps", "pitfalls"].map((tag, k) => (
                  <g key={tag}>
                    <rect className="ra-tag" x={330 + k * 72} y={y - 11} width={64} height={22} rx={11} />
                    <text className="ra-tag-label" x={362 + k * 72} y={y + 4} textAnchor="middle">{tag}</text>
                  </g>
                ))}
                <circle className="ra-check-bg" cx={556} cy={y} r={11} />
                <path className="ra-check" d={`M ${550} ${y} l 4 4 l 8 -8`} />
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

const Leaf = ({ x, y, rot, className = "" }: { x: number; y: number; rot: number; className?: string }) => (
  <ellipse className={`ra-leaf ${className}`} cx={x} cy={y} rx={17} ry={8} transform={`rotate(${rot} ${x} ${y})`} />
);

export const PruneArt = () => {
  const SX = 300; // stem x
  return (
    <svg viewBox={VB} className="ra-art" aria-hidden="true">
      {/* soil */}
      <path className="ra-soil" d={`M ${SX - 90} 208 Q ${SX} 188 ${SX + 90} 208 Z`} />

      {/* stem and live branches */}
      <path className="ra-stem" d={`M ${SX} 204 C ${SX - 6} 150, ${SX + 6} 90, ${SX} 30`} />
      <path className="ra-branch" d={`M ${SX + 1} 62 Q ${SX + 30} 52 ${SX + 58} 44`} />
      <path className="ra-branch" d={`M ${SX} 92 Q ${SX - 32} 84 ${SX - 62} 74`} />
      <path className="ra-branch" d={`M ${SX + 1} 124 Q ${SX + 34} 116 ${SX + 66} 106`} />
      <Leaf x={SX + 70} y={40} rot={-18} />
      <Leaf x={SX + 36} y={40} rot={-50} className="small" />
      <Leaf x={SX - 74} y={70} rot={18} />
      <Leaf x={SX - 40} y={72} rot={40} className="small" />
      <Leaf x={SX + 78} y={102} rot={-18} />
      <Leaf x={SX + 44} y={104} rot={-44} className="small" />
      <Leaf x={SX - 10} y={22} rot={-70} className="small" />
      <Leaf x={SX + 10} y={22} rot={70} className="small" />

      {/* pruned lower branch: a stub on the stem, a cut mark, the piece dropping away */}
      <path className="ra-branch" d={`M ${SX - 1} 160 L ${SX - 22} 154`} />
      <line className="ra-cut" x1={SX - 30} y1={140} x2={SX - 24} y2={168} />
      <g transform={`translate(-38 30) rotate(-22 ${SX - 60} 150)`}>
        <path className="ra-branch dead" d={`M ${SX - 34} 152 Q ${SX - 56} 146 ${SX - 80} 138`} />
        <Leaf x={SX - 92} y={134} rot={16} className="dead" />
        <Leaf x={SX - 58} y={136} rot={36} className="dead small" />
      </g>

      {/* shears, blades pointing at the cut */}
      <g className="ra-shears" transform={`translate(${SX - 92} 150) rotate(4)`}>
        <circle cx={-6} cy={-8} r={7} />
        <circle cx={-6} cy={8} r={7} />
        <path d="M 1 -5 L 42 4 M 1 5 L 42 -4" />
      </g>
      <text className="ra-label prune" x={SX - 104} y={124} textAnchor="middle">prune</text>

      {/* watering can, tilted so the spout pours onto the plant: curate */}
      <g className="ra-can" transform="translate(470 20) rotate(-40 25 29)">
        <path d="M 0 10 h 50 l -6 38 h -38 z" />
        <path className="ra-can-handle" d="M 12 10 C 14 -12, 40 -12, 42 10" />
        <path d="M 2 20 L -34 2" />
        <circle cx={-36} cy={1} r={5} />
      </g>
      {[[424, 78], [414, 90], [428, 94], [410, 104]].map(([x, y], i) => (
        <path key={i} className="ra-drop" d={`M ${x} ${y - 6} q 4 6 0 9 q -4 -3 0 -9 z`} />
      ))}
      <text className="ra-label curate" x={490} y={134} textAnchor="middle">curate · reuse</text>
    </svg>
  );
};
