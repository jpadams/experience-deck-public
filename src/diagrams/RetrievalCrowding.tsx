import { motion } from "./motion";
import { Flow, defineTrack, type FlowKeyframe } from "../flow";
import "./diagrams.css";

/**
 * "Just store everything" fails at retrieval time. The context window has a
 * fixed number of slots. With a small store the right memory makes the cut
 * and the task succeeds. Grow the store and look-alike memories (same task,
 * different environment) outrank it: the right memory is still stored, just
 * never retrieved, and the task fails. Negative transfer at the retrieval
 * bottleneck (Hu et al., arXiv:2604.27003).
 */
// Stage is 1300 design units rendered at 1300px — units are px.
const W = 1300;
const H = 500;
// The opening (small store → solved) runs at 3/4 the pace of the rest, to
// leave time to explain the setup before the store grows.
const OPEN_SLOW = 4 / 3;
const OPEN_END = 3500; // T.clear as authored, before the stretch
const open = (t: number) => Math.round(t * OPEN_SLOW);
const SHIFT = open(OPEN_END) - OPEN_END;
const DURATION = 9400 + SHIFT;
const HOLD = DURATION - 700;

// ── Layout ───────────────────────────────────────────────────────────
const STORE = { x: 24, y: 54, w: 640, h: 396 };
const COLS = 4;
const colX = (c: number) => STORE.x + 86 + c * 156;
const rowY = (r: number) => STORE.y + 30 + r * 42;
const cell = (i: number) => ({ x: colX(i % COLS), y: rowY(Math.floor(i / COLS)) });

const WIN = { x: 750, y: 140, w: 250, h: 230 };
const SLOT_X = WIN.x + WIN.w / 2;
const SLOT_Y = [WIN.y + 48, WIN.y + 115, WIN.y + 182];
const TASK = { x: 1172, y: 212 };
const OUTCOME = { x: 1172, y: 300 };

// ── Memories: 36 in the grown store, 6 in the small one ──────────────
const RIGHT = 17;
const LABELS = [
  "login · sso", "export csv", "refund · v1 API", "track parcel",
  "reset pwd", "invoice", "tax report", "cancel order",
  "refund · sandbox", "search", "gift card", "list orders",
  "refund · old shop", "apply coupon", "ship label", "stock check",
  "update addr", "refund · v2 API", "price match", "merge carts",
  "login · 2fa", "refund · test acct", "cancel · bulk", "invoice · pdf",
  "export · xlsx", "search · filters", "refund · v1 retry", "reorder",
  "track · intl", "update email", "coupon · expired", "ship · return",
  "invoice · eu", "stock · alert", "price · history", "close account",
];
const SMALL_STORE = [0, 7, RIGHT, 22, 29, 35];
/** Top-3 by similarity, before and after the store grows. */
const PICK_SMALL = [RIGHT, 7, 22];
const PICK_BIG = [2, 12, 26];

const T = {
  small: open(300), // small store pops in
  pickSmall: open(1500),
  solved: open(2300),
  clear: open(OPEN_END),
  grow: 3800 + SHIFT, // the rest of the store pops in, staggered
  growStep: 45,
  pickBig: 5800 + SHIFT,
  fail: 6700 + SHIFT,
  caption: 7200 + SHIFT,
};
const FLY = 650;

/** Appends the park-and-fade tail every track shares (loop mode fades out). */
const track = (id: string, frames: FlowKeyframe[]) => {
  const last = frames[frames.length - 1];
  return defineTrack(id, [
    ...frames,
    { t: HOLD, x: last.x, y: last.y, ease: "hold" },
    { t: DURATION, x: last.x, y: last.y, opacity: 0, ease: "linear" },
  ]);
};

const popIn = (x: number, y: number, t0: number): FlowKeyframe[] => [
  { t: t0, x, y, opacity: 0, scale: 0.7 },
  { t: t0 + 260, x, y, opacity: 1, scale: 1, ease: "out" },
];

// Stored memories: pop in, then everything but the right one dims once the
// big retrieval has picked past it.
const growOrder = LABELS.map((_, i) => i).filter((i) => !SMALL_STORE.includes(i));
const STORE_TRACKS = LABELS.map((_, i) => {
  const { x, y } = cell(i);
  const t0 = SMALL_STORE.includes(i)
    ? T.small + SMALL_STORE.indexOf(i) * 90
    : T.grow + growOrder.indexOf(i) * T.growStep;
  const isRight = i === RIGHT;
  return track(`rc-mem-${i}`, [
    ...popIn(x, y, t0),
    { t: T.pickBig + FLY, x, y, ease: "hold" },
    isRight
      ? { t: T.fail, x, y, state: "missed", ease: "hold" }
      : { t: T.pickBig + FLY + 300, x, y, opacity: 0.35, ease: "linear" },
  ]);
});

// Retrieved copies fly from their stored position into a slot.
const pick = (id: string, from: number, slot: number, t0: number, until: number | null, badAt: number | null) => {
  const a = cell(from);
  const frames: FlowKeyframe[] = [
    { t: t0 + slot * 120, x: a.x, y: a.y, opacity: 0, scale: 0.75 },
    { t: t0 + slot * 120 + 80, x: a.x, y: a.y, opacity: 1, scale: 0.75, ease: "linear" },
    { t: t0 + slot * 120 + FLY, x: SLOT_X, y: SLOT_Y[slot], scale: 1, ease: "inOut" },
  ];
  if (badAt !== null) frames.push({ t: badAt, x: SLOT_X, y: SLOT_Y[slot], state: "bad", ease: "hold" });
  if (until !== null) {
    frames.push({ t: until, x: SLOT_X, y: SLOT_Y[slot], ease: "hold" });
    frames.push({ t: until + 250, x: SLOT_X, y: SLOT_Y[slot], opacity: 0, ease: "linear" });
    return defineTrack(id, frames);
  }
  return track(id, frames);
};
const PICK_SMALL_TRACKS = PICK_SMALL.map((m, s) => pick(`rc-ps-${s}`, m, s, T.pickSmall, T.clear, null));
const PICK_BIG_TRACKS = PICK_BIG.map((m, s) => pick(`rc-pb-${s}`, m, s, T.pickBig, null, T.fail));

// Labels and outcomes.
const flash = (id: string, x: number, y: number, t0: number, until: number) =>
  defineTrack(id, [
    ...popIn(x, y, t0),
    { t: until, x, y, ease: "hold" },
    { t: until + 250, x, y, opacity: 0, ease: "linear" },
  ]);
const COUNT_X = STORE.x + STORE.w - 66;
const COUNT_Y = STORE.y - 20;
const TRACKS = {
  task: track("rc-task", popIn(TASK.x, TASK.y, 100)),
  countSmall: flash("rc-count-s", COUNT_X, COUNT_Y, T.small, T.grow),
  countBig: track("rc-count-b", popIn(COUNT_X, COUNT_Y, T.grow + 150)),
  solved: flash("rc-solved", OUTCOME.x, OUTCOME.y, T.solved, T.clear),
  failed: track("rc-failed", popIn(OUTCOME.x, OUTCOME.y, T.fail + 300)),
  capSmall: flash("rc-cap-s", W / 2, H - 18, T.solved, T.clear),
  capBig: track("rc-cap-b", popIn(W / 2, H - 18, T.caption)),
};

const Lines = () => (
  <svg viewBox={`0 0 ${W} ${H}`} className="dg-svg rc-svg" style={{ position: "absolute", inset: 0 }}>
    <rect className="rc-box" x={STORE.x} y={STORE.y} width={STORE.w} height={STORE.h} rx={18} />
    <text className="label" x={STORE.x + 4} y={STORE.y - 14}>Memory store</text>

    <rect className="rc-box win" x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} rx={18} />
    <text className="label" x={WIN.x + 4} y={WIN.y - 14}>Context window · 3 slots</text>
    {SLOT_Y.map((y) => (
      <rect key={y} className="rc-slot" x={SLOT_X - 106} y={y - 24} width={212} height={48} rx={24} />
    ))}

    <path className="pl-arrow" d={`M ${STORE.x + STORE.w + 12} ${WIN.y + WIN.h / 2} L ${WIN.x - 12} ${WIN.y + WIN.h / 2}`} markerEnd="url(#rc-arrow)" />
    <text className="label" x={(STORE.x + STORE.w + WIN.x) / 2} y={WIN.y + WIN.h / 2 - 16} textAnchor="middle">Top 3</text>
    <path className="pl-arrow" d={`M ${WIN.x + WIN.w + 12} ${WIN.y + WIN.h / 2} L ${TASK.x - 104} ${WIN.y + WIN.h / 2}`} markerEnd="url(#rc-arrow)" />
    <defs>
      <marker id="rc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--fg-tertiary)" />
      </marker>
    </defs>
  </svg>
);

/** Where part one (small store, solved) parks until the next click. */
const PAUSE = T.clear - 50;

/**
 * Plays in segments driven by the slide's step. 0: small store, solved, park.
 * 1: the store grows and the task fails. 2+: parked on the final frame (a
 * step past the last segment holds like every other diagram).
 *
 * resumeOnStep is on at every step, part 0 included: a click while a segment
 * is still playing snaps it to its end and the step only advances on the next
 * click, so part 1 always plays in full before the claim appears.
 */
export const RetrievalCrowding = ({ part = 1 }: { part?: number }) => (
  <Flow.Root
    duration={DURATION}
    posterTime={HOLD - 200}
    resumeOnStep
    aria-label="A memory store of six memories feeds a context window with three slots; the right memory, refund via the v2 API, is retrieved and the task is solved. The store grows to thirty-six memories. The window still has three slots, and three look-alike refund memories from other environments outrank the right one. It stays in the store unretrieved, and the task fails."
    controls={false}
    {...motion({ speed: 0.6, holdAt: part === 0 ? PAUSE : HOLD })}
  >
    <Flow.Stage width={W} height={H} className="dg-distill rc-stage">
      <Lines />
      {STORE_TRACKS.map((tr, i) => (
        <Flow.Token key={tr.id} track={tr}>
          <div className={`rc-chip ${i === RIGHT ? "right" : ""}`}>{LABELS[i]}</div>
        </Flow.Token>
      ))}
      {PICK_SMALL_TRACKS.map((tr, s) => (
        <Flow.Token key={tr.id} track={tr}>
          <div className={`rc-chip slot ${PICK_SMALL[s] === RIGHT ? "right" : ""}`}>{LABELS[PICK_SMALL[s]]}</div>
        </Flow.Token>
      ))}
      {PICK_BIG_TRACKS.map((tr, s) => (
        <Flow.Token key={tr.id} track={tr}>
          <div className="rc-chip slot">{LABELS[PICK_BIG[s]]}</div>
        </Flow.Token>
      ))}
      <Flow.Token track={TRACKS.task}><div className="rc-task"><span>Task</span>refund · v2 API</div></Flow.Token>
      <Flow.Token track={TRACKS.countSmall}><div className="rc-count">6 memories</div></Flow.Token>
      <Flow.Token track={TRACKS.countBig}><div className="rc-count">36 memories</div></Flow.Token>
      <Flow.Token track={TRACKS.solved}><div className="ec-node good">✓ SOLVED</div></Flow.Token>
      <Flow.Token track={TRACKS.failed}><div className="ec-node bad">✗ FAILED</div></Flow.Token>
      <Flow.Token track={TRACKS.capSmall}><div className="rc-cap good">Small store: the right memory makes the cut.</div></Flow.Token>
      <Flow.Token track={TRACKS.capBig}><div className="rc-cap bad">Same three slots. Look-alikes outrank the right memory. It's still in the store.</div></Flow.Token>
    </Flow.Stage>
  </Flow.Root>
);
