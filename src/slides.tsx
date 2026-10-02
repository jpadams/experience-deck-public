import { Fragment, useLayoutEffect, useRef } from "react";
import type { SlideDef } from "./deck";
import { Frag, useStep } from "./deck";
import { Slide, tokenize } from "./ui";
import { Logo } from "./brand/Blobs";
import { TraceStream } from "./diagrams/TraceStream";
import { SearchPrune } from "./diagrams/SearchPrune";
import { LearningLoop } from "./diagrams/LearningLoop";
import { GraphPipeline } from "./diagrams/GraphPipeline";
import { ErrorCompounds } from "./diagrams/ErrorCompounds";
import { RetrievalCrowding } from "./diagrams/RetrievalCrowding";
import { ProvenanceTrail } from "./diagrams/ProvenanceTrail";
import { Consolidation } from "./diagrams/Consolidation";
import { PruneArt, RecipeTreeArt } from "./diagrams/ResultArt";
import { PRIMITIVE_ART, LAYER_ART, GATE_ART } from "./diagrams/PrimitiveArt";
import { ContextGraph } from "./diagrams/ContextGraph";
import { ForkTree, Landscape } from "./diagrams/ForkTree";
import { Compile } from "./diagrams/Compile";
import desirePath from "./assets/desire-path.jpg";

const centered: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// ═══════════════════════════════════════════════════════════════════
// ACT 1 — THE FLOOD
// ═══════════════════════════════════════════════════════════════════

// ── 1. Title ─────────────────────────────────────────────────────────
const TitleSlide = () => (
  <Slide tone="navy">
    <Logo height={44} />
    <h1>
      Experience Is Abundant.
      <br />
      Knowledge Is Distilled.
    </h1>
    <p className="lead" style={{ maxWidth: 980 }}>
      What agentic AI leaves behind, and what it takes to turn that into
      something an agent — or an enterprise — can actually reuse.
    </p>
    <p className="small byline" style={{ marginTop: 8 }}>
      Jeremy Adams · Neo4j
    </p>
  </Slide>
);

// ── 2. Cold open ─────────────────────────────────────────────────────
const ColdOpenSlide = () => (
  <Slide tone="teal" className="statement">
    <p className="claim" style={{ maxWidth: 1250 }}>
      We are about to generate <em>billions</em> of agent trajectories.
    </p>
    <Frag at={1} className="cold-open-q">
      <p className="lead">
        What do we do
        <br />
        with them?
      </p>
    </Frag>
  </Slide>
);

// ── 3. GenAI vs agentic AI ──────────────────────────────────────────
export const ShiftSlide = () => (
  <Slide kicker="THE SHIFT" blobs>
    <div className="grow" style={centered}>
      <div style={{ maxWidth: 1100, marginLeft: 300, paddingBottom: 60 }}>
        <h2 style={{ marginBottom: 24 }}>
          Generative AI gave us an abundance of content.
        </h2>
        <p className="lead">
          Agentic AI is giving us something potentially more valuable —
          and much more overwhelming: <em>experience.</em>
        </p>
      </div>
    </div>
  </Slide>
);

// ── 4. Abundance / trace stream ──────────────────────────────────────
const TraceSlide = () => (
  <Slide kicker="THE FLOOD" className="wide">
    <h2>Every tool call, conversation, git commit, error, robot trace.</h2>
    <div className="grow" style={centered}>
      <TraceStream />
    </div>
    <p className="small muted">
      Each one a trace of what happened, what worked, and what didn't — and
      almost none of it is ever read again.
    </p>
  </Slide>
);

// ── 5. The question / Nothing. ───────────────────────────────────────
const AmnesiaSlide = () => (
  <Slide tone="teal" blobs={false} kicker="THE QUESTION">
    <div className="grow" style={{ ...centered, flexDirection: "column", alignItems: "flex-start", gap: 30 }}>
      <p className="claim" style={{ maxWidth: 1250 }}>
        If your agent finished 10,000 tasks yesterday, what does it know
        today?
      </p>
      <Frag at={1}>
        <p className="big-no">Nothing.</p>
      </Frag>
      <Frag at={2}>
        <p className="lead" style={{ fontSize: 40 }}>
          A brilliant new hire on their first day, every day. 
        </p>
      </Frag>
    </div>
  </Slide>
);

// ── 6. "Just store everything" ───────────────────────────────────────
const StoreItAllSlide = () => {
  const step = useStep();
  return (
  <Slide kicker="THE OBVIOUS FIX" className="wide">
    <h2>"Fine — just store everything."</h2>
    <div className="grow" style={centered}>
      <RetrievalCrowding part={step} />
    </div>
    <Frag at={2}>
      <p className="claim" style={{ fontSize: 50, margin: "0 0 6px" }}>
        More memory can make your agent <em>worse.</em>
      </p>
    </Frag>
    <p className="tiny muted">
      Negative transfer — the wrong memory surfacing at the wrong time — hits
      the hard cases hardest; external memory relocates the continual-learning
      bottleneck to retrieval (arXiv:2604.27003). Two memory-augmented
      baselines finish behind memoryless agents on OSWorld and SpreadsheetBench
      (BREW, arXiv:2511.20297). Diagram illustrative.
    </p>
  </Slide>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ACT 2 — THE TURN
// ═══════════════════════════════════════════════════════════════════

// ── 7. Trace vs trajectory ───────────────────────────────────────────
export const TerminologySlide = () => (
  <Slide kicker="A WORD ON VOCABULARY">
    <h2>A trajectory is not a log</h2>
    <div className="row">
      <div className="col">
        <p className="lead">
          A <strong>trace</strong> is a record of what happened.
        </p>
        <p className="lead">
          A <strong>trajectory</strong> is the path taken while pursuing a
          goal — observations, decisions, actions, corrections, outcome.
        </p>
      </div>
      <div className="col">
        <p className="small muted">
          Standard vocabulary in RL and robotics for decades. ReAct (2022)
          gave LLM agents trajectory-shaped traces; by 2026 it's a term of
          art — trajectory distillation, trajectory-level reward modeling,
          a proposed Agent Trajectory Interchange Format.
        </p>
        <p className="small muted">
          A Claude Code session, a browser agent, and a robot arm are the
          same shape of evidence. That's what makes the next idea general.
        </p>
      </div>
    </div>
  </Slide>
);

// ── 8. Search & prune ────────────────────────────────────────────────
const SearchPruneSlide = () => (
  <Slide kicker="WHAT LEARNING ACTUALLY LOOKS LIKE" className="wide">
    <h2>Learning is search, then pruning.</h2>
    <div className="grow" style={centered}>
      <SearchPrune />
    </div>
    <p className="small muted">
      BREW runs a tree search over candidate recipes and keeps only the
      ones that raise task reward. SKILL-KD diffs a failed trajectory
      against a successful one and distills the discrepancy into a skill
      patch. The failures aren't waste — they're the raw material. The
      recipe is what's left.
    </p>
    <p className="tiny muted">
      Vocabulary: a <strong>trace</strong> is a record of what happened; a{" "}
      <strong>trajectory</strong> is the path taken while pursuing a goal —
      observations, decisions, actions, corrections, outcome. A Claude Code
      session, a browser agent and a robot arm are the same shape of evidence.
    </p>
  </Slide>
);

// ── 8b. Fork tree: many sessions, one well-worn path ────────────────
const ForkTreeSlide = () => (
    <Slide kicker="THE SAME TASK, MANY SESSIONS" className="wide">
      <h2>Overlay the sessions and a path wears in.</h2>
      <div className="grow" style={centered}>
        <ForkTree />
      </div>
      <div className="ft-foot">
        <p className="small muted">
          Many sessions on the same kind of task are a tree: every fork
          somebody tried, piled up. Well-walked segments thicken; dead ends
          are pruned by outcome. The dominant route becomes the skill, the
          runners-up its fallbacks. NAMS's consolidate stage does this with
          frequency-weighted pattern clusters, split by tool outcome.
        </p>
        <Frag at={1}>
          <div className="inset">
            <Landscape />
            <p className="inset-cap">
              <strong>The runners-up are local maxima.</strong> No single
              session can tell which peak is global. Only the aggregate can.
            </p>
          </div>
        </Frag>
      </div>
    </Slide>
);

// ── 8c. Desire paths ────────────────────────────────────────────────
export const DesirePathSlide = () => (
  <Slide kicker="AN OLD IDEA" className="wide">
    <div className="photo-row">
      <img src={desirePath} alt="A dirt desire path worn diagonally across a lawn beside the paved sidewalks" />
      <div className="photo-text">
        <p className="claim">Desire paths.</p>
        <p className="lead">
          Nobody designed them. Enough people walked the same way that the
          grass gave up, and the route became the path.
        </p>
        <p className="small muted">
          A skill is a desire path through the tool space: the route enough
          sessions took that we paved it, and the trampled dead ends we let
          grow back.
        </p>
        <p className="photo-credit">Photo: dankeck, Ohio State University · CC0</p>
      </div>
    </div>
  </Slide>
);

// ── 9. The ladder ────────────────────────────────────────────────────
const RUNGS = [
  { level: 1, yr: "raw", title: "Episode", body: "One trajectory. What happened, once." },
  { level: 2, yr: "2023 · Generative Agents, Reflexion", title: "Reflection", body: "Trial-and-error turned into a sentence the agent can re-read." },
  { level: 3, yr: "2023 · ExpeL", title: "Procedure", body: "Knowledge extracted from many episodes, not one." },
  { level: 4, yr: "2024 · Agent Workflow Memory", title: "Workflow", body: "Reusable routines induced from trajectories. +24.6% / +51.1% relative on Mind2Web / WebArena." },
  { level: 5, yr: "2025–26 · BREW, ReMe, SKILL‑KD", title: "Skill", body: "Recipes with when-to-apply and pitfalls. BREW and SKILL-KD test recipes by re-running the agent." },
];
const LadderSlide = () => {
  const step = useStep();
  return (
    <Slide kicker="A CONVERGING LITERATURE">
      <h2>"Experience distillation" has a ladder now</h2>
      <div className="ladder">
        {RUNGS.map((r, i) => (
          <>
            {i > 0 ? <span key={`s-${r.level}`} className="step">→</span> : null}
            <div key={r.title} className="rung" data-level={String(r.level)}>
              <span className="yr">{r.yr}</span>
              <h3>{r.title}</h3>
              <p>{r.body}</p>
            </div>
          </>
        ))}
      </div>
      <Frag at={1}>
        <div className="row" style={{ marginTop: 4 }}>
          <div className="col" style={{ gap: 18 }}>
            <div className="card good">
              <h3>BREW · Microsoft</h3>
              <p className="small">
                Trajectories → structured KB of natural-language recipes.
                10–20% higher task success, 10–15% fewer steps.
              </p>
            </div>
            <RecipeTreeArt />
          </div>
          <div className="col" style={{ gap: 18 }}>
            <div className="card good">
              <h3>ReMe · ACL 2026 Findings</h3>
              <p className="small">
                Names the enemy: "passive accumulation." Distill → reuse in
                context → prune what stops earning its keep.
              </p>
            </div>
            <PruneArt />
          </div>
        </div>
      </Frag>
      {step === 0 ? (
        <p className="small muted" style={{ marginTop: -6 }}>
          → press for the 2026 results
        </p>
      ) : null}
    </Slide>
  );
};

// ── 10. Consolidation ────────────────────────────────────────────────
const ConsolidationSlide = () => (
  <Slide kicker="CONSOLIDATION">
    <h2>Attention is scarce. Consolidate while nobody's asking.</h2>
    <div className="row">
      <div className="col">
        <div className="stat">
          <span className="n">87%</span>
          <span className="l">
            lower memory-construction cost — RecMem, ACL 2026 Findings
          </span>
        </div>
        <p className="small muted">
          RecMem only pays for an LLM consolidation pass when it sees a
          cluster of similar interactions recur — and still beats systems
          that process every interaction. <strong>Repetition is the
          signal.</strong>
        </p>
      </div>
      <div className="col">
        <p className="lead">
          raw observations → episodes → abstractions → durable knowledge
        </p>
        <p className="small muted">
          Sleep-time compute (Letta / UC Berkeley, arXiv:2504.13171) moves
          this off the request path entirely: ~5× less test-time compute for
          the same accuracy. The brain doesn't consolidate memory while
          you're awake either.
        </p>
      </div>
    </div>
    <div className="grow" style={centered}>
      <Consolidation />
    </div>
  </Slide>
);

// ── 11. The learning loop ────────────────────────────────────────────
const LoopSlide = () => (
  <Slide kicker="THE LOOP" className="wide">
    <h2>Every run should make the next one shorter.</h2>
    <div className="grow" style={centered}>
      <LearningLoop />
    </div>
    <p className="small muted">
      Illustrative numbers. Reported: BREW cuts steps 10–15% and lifts
      success 10–20%; Agent Memory Distillation lifts 4–8B students +27.2pp
      on AppWorld; ReMe prunes what stops earning its keep so the store
      stays small.
    </p>
  </Slide>
);

// ── 12. Frozen model + living knowledge ──────────────────────────────
const FrozenSlide = () => (
  <Slide tone="cream" className="statement">
    <p className="claim" style={{ maxWidth: 1300 }}>
      A frozen 8B model with a <em>living knowledge layer</em> edges out a
      memoryless 14B.
    </p>
    <Frag at={1}>
      <p className="small muted" style={{ marginTop: 26, maxWidth: 1100, fontSize: 22 }}>
        Qwen3-8B + ReMe: 55.0% vs Qwen3-14B: 54.7% avg Pass@4 (arXiv:2512.10696).
        4–8B students given hierarchical teacher memory: +27.2pp on AppWorld
        (arXiv:2608.07169). The knowledge layer is doing work the parameters
        can't.
      </p>
    </Frag>
  </Slide>
);

// ═══════════════════════════════════════════════════════════════════
// ACT 3 — THE DANGER
// ═══════════════════════════════════════════════════════════════════

// ── 13. Counter-evidence transition ──────────────────────────────────
// ── Thesis: store · distill · trace ─────────────────────────────────
const PILLARS = [
  { k: "Store", v: "as structure, so the right memory can be told from its look-alikes" },
  { k: "Distill", v: "into skills that are tested, reused and pruned" },
  { k: "Trace", v: "back to the runs that produced it" },
];
const ThesisSlide = () => (
  <Slide tone="teal" blobs={false} kicker="THE ANSWER">
    <div className="grow" style={{ ...centered, flexDirection: "column", alignItems: "flex-start", gap: 26 }}>
      <p className="claim" style={{ maxWidth: 1350 }}>
        It's not how much you remember.
      </p>
      <p className="lead" style={{ fontSize: 38, maxWidth: 1350 }}>
        It's how you <em>store</em> it, what you <em>distill</em> it into,
        and whether you can <em>trace</em> it back.
      </p>
      <Frag at={1}>
        <div className="row tight thesis-pillars">
          {PILLARS.map((p) => (
            <div key={p.k} className="thesis-pillar">
              <h3>{p.k}</h3>
              <p>{p.v}</p>
            </div>
          ))}
        </div>
      </Frag>
    </div>
  </Slide>
);

const CounterTransitionSlide = () => (
  <Slide tone="teal" className="statement" kicker="3 · TRACE">
    <p className="lead">
      None of this is automatically safe.
    </p>
  </Slide>
);

// ── 14. Error compounds ──────────────────────────────────────────────
const ErrorSlide = () => (
  <Slide kicker="AND IT COMPOUNDS" className="wide">
    <h2>An incorrect response might be forgotten. An incorrect memory compounds.</h2>
    <div className="grow" style={centered}>
      <ErrorCompounds />
    </div>
    <p className="small muted">
      TrustMem names three ways a memory update goes wrong: omission,
      corruption, hallucination (arXiv:2606.25161).
    </p>
  </Slide>
);

// ── 15. Provenance ───────────────────────────────────────────────────
const ProvenanceSlide = () => (
  <Slide kicker="THE CONSEQUENCE">
    <p className="claim" style={{ maxWidth: 1350, marginBottom: 10 }}>
      Knowledge you can't trace back to the trajectories that produced it
      is a <em>liability that compounds.</em>
    </p>
    <div className="row">
      <div className="card accent">
        <h3>Every recipe points at its runs</h3>
        <p className="small">
          A skill, an edge, a "when this applies" clause — each should link
          back to the trace spans it was distilled from. If you can't
          re-derive it, you can't repair it.
        </p>
      </div>
      <div className="card accent">
        <h3>Verify before you commit</h3>
        <p className="small">
          TrustMem's transition verifier checks coverage, preservation and
          faithfulness on every memory update (arXiv:2606.25161). Provenance
          is what makes that check possible.
        </p>
      </div>
    </div>
    <div className="grow" style={centered}>
      <ProvenanceTrail />
    </div>
  </Slide>
);


// ── Act 2 divider: memory vs skills ──────────────────────────────────
const MemorySkillsDividerSlide = () => (
  <Slide tone="cream" className="statement" kicker="2 · DISTILL">
    <p className="lead">
      Memory tells you what happened.
      <br />
      Skills tell you what to do.
    </p>
    <p className="small muted" style={{ marginTop: 18, fontSize: 22 }}>
      Distillation is the compiler between them. — William Lyon,{" "}
      <em>Actionable Knowledge with Context Graphs</em>
    </p>
  </Slide>
);

// ── Act 3: three ways a memory goes bad ──────────────────────────────
const GATES = [
  {
    id: "ungrounded", tone: "bad", title: "Ungrounded",
    body: "A plausible procedure written from a transcript. No link to evidence — so no way to verify it, and no way to tell when it goes stale.",
    gate: "Gate: grounding. Every claim and step points at the memory it came from.",
  },
  {
    id: "incoherent", tone: "amber", title: "Grounded, and still wrong",
    body: "A distilled skill scored 100% on provenance — and chained billing-dispute steps onto incident-management steps. Every line was true. The whole was nonsense.",
    gate: "Gate: coherence. One skill, one cluster of experience — or split it.",
  },
  {
    id: "drifted", tone: "teal", title: "Drifted",
    body: "Stale: a source was deleted or merged away, and the claim lost its evidence. Contradicted: a recorded tool outcome changed, so the procedure may now be wrong.",
    gate: "Gate: reconcile continuously. Repair the step or re-distill.",
  },
] as const;
const GatesSlide = () => {
  const step = useStep();
  return (
    <Slide kicker="THE GATES">
      <h2>Three ways a memory goes bad</h2>
      <div className="row tight">
        {GATES.map((g, i) => (
          <Frag key={g.id} at={i} mode="dim">
            <div className={`card gate ${g.tone}`}>
              <div className="card-art">{GATE_ART[g.id]}</div>
              <h3>{g.title}</h3>
              <p className="small">{g.body}</p>
              <p className="gate-line">{g.gate}</p>
            </div>
          </Frag>
        ))}
      </div>
      <p className="small muted">
        Provenance is what makes each check possible. None of them is
        automatic. Gates and war story from Neo4j's skill-distillation
        pipeline (Lyon, 2026); verifier failure modes from TrustMem
        (arXiv:2606.25161).
      </p>
      {step === 0 ? (
        <p className="tiny muted" style={{ marginTop: -10 }}>→ press for each failure mode</p>
      ) : null}
    </Slide>
  );
};

// ── Act 4 climax: the graph is the source code ───────────────────────
const PROPS = [
  { k: "Explicit", v: "Reviewable and editable. A human can read the source." },
  { k: "Typed", v: "Executable and checkable. Steps bind to tools with typed inputs and outputs." },
  { k: "Flexible", v: "The schema grows with the domain instead of being fixed at training time." },
  { k: "Traceable", v: "Repair, drift detection and evaluation — every asset points back at its runs." },
];
const SourceCodeSlide = () => (
    <Slide kicker="THE CLAIM" className="wide">
      <p className="claim" style={{ marginBottom: 0 }}>
        The graph is the <em>source code.</em>
      </p>
      <p className="lead" style={{ maxWidth: 1400, fontSize: 32 }}>
        Skills, GDS insights, training data, prompts, embeddings — and
        eventually model weights — are compiled artifacts. You recompile from
        source. You don't decompile the binary and hope.
      </p>
      <div className="grow" style={centered}>
        <Compile />
      </div>
      <Frag at={1}>
        <div className="row tight props">
          {PROPS.map((p) => (
            <div key={p.k} className="card compact st">
              <h3>{p.k}</h3>
              <p>{p.v}</p>
            </div>
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 10 }}>
          Those four properties are what a self-improving loop needs from its
          substrate. Robotics reached the same shape independently: a skill
          graph as one representation for configuring, executing, evaluating
          and learning (Yu et al., CMU, arXiv:2603.12649).
        </p>
      </Frag>
    </Slide>
);

// ── 23b. The larger picture: the knowledge layer ─────────────────────
const KL_COLS = [
  { key: "ont", title: "Ontologies", items: ["Domain model", "Systems metadata", "Business rules"] },
  { key: "data", title: "Data", items: ["Reference", "Domain", "Virtual graphs"] },
  { key: "mem", title: "Memory", items: ["Long & short term", "Procedural", "Context graph"] },
];
const KnowledgeLayerSlide = () => {
  const step = useStep();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const memRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  // Fit the highlight to the Memory column, measured from the DOM so it tracks
  // the layout instead of hand-tuned coordinates.
  useLayoutEffect(() => {
    const place = () => {
      const p = panelRef.current, m = memRef.current, b = boxRef.current;
      if (!p || !m || !b) return;
      const pr = p.getBoundingClientRect(), mr = m.getBoundingClientRect();
      const k = pr.width / p.offsetWidth || 1;
      const pad = 12;
      b.style.left = `${(mr.left - pr.left) / k - pad}px`;
      b.style.top = `${(mr.top - pr.top) / k - pad}px`;
      b.style.width = `${mr.width / k + 2 * pad}px`;
      b.style.height = `${mr.height / k + 2 * pad}px`;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);
  return (
    <Slide kicker="THE LARGER PICTURE" className="wide">
      <h2>Memory is one pillar of a complete knowledge layer.</h2>
      <div className="kl-row">
        <div ref={panelRef} className="kl-panel" data-focus={step >= 1 ? "true" : "false"}>
          <div className="kl-top">
            <div className="kl-pill">Applications</div>
            <div className="kl-pill">Agents</div>
            <div className="kl-pill">Tools</div>
          </div>
          <div className="kl-arrows"><span>↓↑</span><span>↓↑</span><span>↓↑</span></div>
          <div className="kl-band">Knowledge layer</div>
          <div className="kl-cols">
            {KL_COLS.map((c) => (
              <div key={c.key} ref={c.key === "mem" ? memRef : undefined} className={`kl-col ${c.key}`}>
                <h4>{c.title}</h4>
                {c.items.map((it) => (
                  <div key={it} className="kl-item">
                    {it}
                    {c.key === "mem" && it === "Procedural" ? <em>· skills</em> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div ref={boxRef} className="kl-hilite">
            <span className="kl-tag">this talk</span>
          </div>
        </div>
        <div className="kl-text">
          <blockquote>
            "A shared, governed substrate where enterprise knowledge lives,
            accessible to agents, tools, and applications … organizational
            knowledge as queryable as data and as actionable as code."
            <cite>Jesús Barrasa, The Enterprise Knowledge Layer, Neo4j, 2026</cite>
          </blockquote>
        </div>
      </div>
      {/* Own layer, so its disappearance never shifts the text column. */}
      {step === 0 ? <p className="tiny muted press-hint">→ press to place this talk</p> : null}
    </Slide>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ACT 4 — THE SHAPE OF KNOWLEDGE
// ═══════════════════════════════════════════════════════════════════

// ── 16. What should knowledge look like? ─────────────────────────────
const SPECTRUM = [
  { tag: "TEXT", tone: "teal", title: "Markdown & hypertext", body: "Human-readable, portable, cheap to write — hard to query at scale." },
  { tag: "DENSE", tone: "blue", title: "Vector embeddings", body: "Great similarity search, weak on identity, relationships, or “why.”" },
  { tag: "COMPILED", tone: "bad", title: "Model weights", body: "Fully absorbed, fast to run, opaque and expensive to audit or revert." },
  { tag: "STRUCTURED", tone: "good", title: "Knowledge graphs", body: "Explicit entities and relationships, inspectable, provenance-preserving." },
];
const SpectrumSlide = () => {
  const step = useStep();
  const emphasized = step >= 1;
  return (
    <Slide kicker="1 · STORE · WHAT SHOULD KNOWLEDGE LOOK LIKE?">
      <h2>Several primitives are competing for this layer</h2>
      <div className="grow" style={{ ...centered, alignItems: "stretch" }}>
        <div className="spectrum">
          {SPECTRUM.map((s, i) => (
            <div
              key={s.title}
              className="spectrum-item"
              data-emph={emphasized && i === 3 ? "true" : "false"}
              data-dim={emphasized && i !== 3 ? "true" : "false"}
            >
              <div className="spectrum-art">{PRIMITIVE_ART[s.tag as keyof typeof PRIMITIVE_ART]}</div>
              <span className={`tag ${s.tone}`}>{s.tag}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Always laid out so revealing it never shifts the tiles. */}
      <p className="small muted" style={{ visibility: emphasized ? "visible" : "hidden" }}>
        Graphs keep popping up — a candidate for this layer, not a crowned
        winner. Here's the honest case.
      </p>
    </Slide>
  );
};

// ── 17. Why graphs keep appearing ────────────────────────────────────
const GraphSlide = () => (
  <Slide kicker="WHY GRAPHS KEEP APPEARING" className="wide">
    <h2>The graph holds memory and is the workbench.</h2>
    <div className="grow" style={centered}>
      <GraphPipeline />
    </div>
    <p className="small muted">
      A single trajectory is episodic. Patterns <em>across</em> trajectories
      are candidates for knowledge, and finding them needs shared entities,
      relationships and provenance made explicit. A-MEM and Zep/Graphiti
      both land here — a strong intermediate representation, not
      necessarily the final one.
    </p>
  </Slide>
);

// ── 18. Neo4j's own framing ──────────────────────────────────────────
const ContextGraphSlide = () => (
  <Slide kicker="NEO4J'S TAKE" className="wide">
    <h2>A context graph is three memories in one graph</h2>
    <div className="grow" style={centered}>
      <ContextGraph />
    </div>
    <div className="row tight">
      <div className="card compact st">
        <h3>Short-term</h3>
        <p className="small">Conversation history for the session in front of you.</p>
      </div>
      <div className="card compact lt">
        <h3>Long-term</h3>
        <p className="small">
          Enterprise knowledge — the ontology and the data it's grounded in.
        </p>
      </div>
      <div className="card compact rs">
        <h3>Reasoning</h3>
        <p className="small">
          Decision traces — the steps, tool calls, and outcomes that got you
          here.
        </p>
      </div>
    </div>
  </Slide>
);

// ── 18b. Steps, not prose: deterministic context lookups ────────────
const SKILL_STEPS = [
  { kind: "script step", cls: "script", what: <>Resolve the customer. <code>MATCH (p:Person {"{"}name: $name{"}"})</code></> },
  { kind: "script step", cls: "script", what: <>Run the evidence plan: 10 named, parameterized Cypher retrievals. Accounts and co-owners with sanctions status, counterparties, transactions, tickets, alerts, decision history, precedents, base rates, policies.</> },
  { kind: "script step", cls: "script", what: <>Derive the policy arithmetic in code: proposed total, share of income, increase vs current limit. Known calculations never go to a model.</> },
  { kind: "judgment step", cls: "judge", what: <>Ask typed questions of the evidence: one Choice for the verdict, one Noul per precedent and per policy. Jev answers with calibrated probabilities.</> },
  { kind: "routing step", cls: "route", what: <>Route on confidence: act above the floor, escalate to a reasoning model below it, a human above that.</> },
];

// The opening build: the same five steps as code, simplified for size and
// scope. Each box morphs into its row of SKILL_STEPS on the first click.
const SKILL_CODE: { title: string; code: string }[] = [
  {
    title: "Resolve the customer",
    code: `MATCH (p:Person)
  WHERE p.normalized_name IN $names
RETURN p.id, p.name, p.risk_score`,
  },
  {
    title: "Run the evidence plan · 1 of 10 retrievals",
    code: `MATCH (p:Person {id: $customer_id})-[:OWNS]->(a:Account)
MATCH (a)<-[:FROM_ACCOUNT | TO_ACCOUNT]-(t:Transaction)
  WHERE t.status IN ['flagged'] OR t.risk_score >= $threshold
RETURN t.id, a.account_number, t.risk_score, t.timestamp
  ORDER BY t.timestamp DESC
// + co-owners, counterparties, tickets, alerts, history, precedents, base rates, policies`,
  },
  {
    title: "Derive the policy arithmetic",
    code: `proposed_total  = current_limit + requested
share_of_income = proposed_total / annual_income     // policy: at most 35%
increase        = requested / current_limit          // policy: at most 100%`,
  },
  {
    title: "Ask typed questions",
    code: `verdict = jev.choice(evidence, options = [yes, no, needs_llm_decision])
signals = jev.noul(each precedent, each policy)      // "does precedents[2] support approving?"`,
  },
  {
    title: "Route on confidence",
    code: `if verdict != needs_llm_decision and verdict.confidence >= 0.6: act(verdict)
else: escalate(claude, same_evidence)                // a human tier sits above`,
  },
];

const DeterministicSlide = () => {
  const step = useStep();
  const code = step === 0;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const codeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const shellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const placedRef = useRef(false);

  // The five box outlines are shared shells, placed over either the code boxes
  // or the list rows (both are always laid out). A step change moves them with
  // a CSS transition; the first placement and resizes snap.
  useLayoutEffect(() => {
    const place = (animate: boolean) => {
      const st = stageRef.current;
      if (!st) return;
      const sr = st.getBoundingClientRect();
      const k = sr.width / st.offsetWidth || 1;
      const targets = code ? codeRefs.current : rowRefs.current;
      shellRefs.current.forEach((sh, i) => {
        const t = targets[i];
        if (!sh || !t) return;
        const r = t.getBoundingClientRect();
        sh.classList.toggle("snap", !animate);
        sh.style.left = `${(r.left - sr.left) / k}px`;
        sh.style.top = `${(r.top - sr.top) / k}px`;
        sh.style.width = `${r.width / k}px`;
        sh.style.height = `${r.height / k}px`;
      });
    };
    place(placedRef.current);
    placedRef.current = true;
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [code]);

  return (
    <Slide kicker="WHY TYPED MATTERS" className="wide">
      <h2>Making context lookup deterministic.</h2>
      <div ref={stageRef} className="aip-stage" data-view={code ? "code" : "list"}>
        {SKILL_STEPS.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              shellRefs.current[i] = el;
            }}
            className={`aip-shell ${s.cls} ${step >= 2 && i < 3 ? "hot" : ""}`}
          />
        ))}
        <div className="row aip-list" style={{ gap: 40, alignItems: "flex-start" }}>
          <ol className="steps" style={{ flex: 1.2 }}>
            {SKILL_STEPS.map((s, i) => (
              <li
                key={i}
                ref={(el) => {
                  rowRefs.current[i] = el;
                }}
              >
                <span className="n">{i + 1}</span>
                <span className={`kind ${s.cls}`}>{s.kind}</span>
                <p className="what">{s.what}</p>
              </li>
            ))}
          </ol>
          <div className="col" style={{ flex: 1, gap: 14 }}>
            <p className="lead" style={{ fontSize: 24, marginTop: 2 }}>
              Prose know-how is re-read and re-derived every session. Steps bind
              to recorded tool calls: name, typed inputs and outputs, expected
              status. The graph fixes <em>which</em> context a task needs, so
              retrieval is a query and judgment shrinks to a typed question that
              a System One model or a small LLM can carry.
            </p>
            <Frag at={2}>
              <div className="stat-pair">
                <div className="card">
                  <h3>Tool-loop agent</h3>
                  <div className="stat"><span>mean wall time</span><b>68 s</b></div>
                  <div className="stat"><span>tool calls per run</span><b>5.3</b></div>
                  <div className="stat"><span>evidence gathered</span><b>varies</b></div>
                </div>
                <div className="card good">
                  <h3>Fixed plan + Jev</h3>
                  <div className="stat"><span>typed verdict</span><b>3 s</b></div>
                  <div className="stat"><span>tool calls per run</span><b>0</b></div>
                  <div className="stat"><span>evidence gathered</span><b>identical</b></div>
                </div>
              </div>
              <p className="tiny muted" style={{ marginTop: 0 }}>
                Same 20 credit-limit cases. Jev decided 14 alone and escalated 6.
                Claude reading the identical evidence agreed with the fast path
                20 of 20.
              </p>
              <p className="tiny muted" style={{ marginTop: 6 }}>
                And when the <em>skill itself</em> becomes a graph: AIP compiles
                free-form prose skills into a schema-validated execution graph and
                lifts Claude's mean task reward 0.60→0.71, pass rate 53%→67% across
                27 real tasks (Blumenfeld &amp; Webber, Neo4j, arXiv:2606.04781;
                Lyon, <em>From Agent Memory to Portable Skills</em>).
              </p>
            </Frag>
            {step === 1 ? <p className="tiny muted">→ press for what it bought</p> : null}
          </div>
        </div>
        <div className="aip-code">
          {SKILL_CODE.map((c, i) => (
            <Fragment key={i}>
              {i > 0 ? <div className="aip-arrow" aria-hidden>↓</div> : null}
              <div
                ref={(el) => {
                  codeRefs.current[i] = el;
                }}
                className="aip-box"
              >
                <div className="aip-label">
                  <span className="n">{i + 1}</span>
                  <span className={`kind ${SKILL_STEPS[i].cls}`}>{SKILL_STEPS[i].kind}</span>
                  <span className="t">{c.title}</span>
                </div>
                <pre className="aip-pre">
                  {c.code.split("\n").map((l, j) => (
                    <span key={j}>
                      {tokenize(l)}
                      {"\n"}
                    </span>
                  ))}
                </pre>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </Slide>
  );
};

// ── 19. Source-code analogy ──────────────────────────────────────────
export const AnalogySlide = () => (
  <Slide kicker="THE ANALOGY">
    <div className="grow" style={centered}>
      <div style={{ maxWidth: 1250 }}>
        <p className="claim" style={{ marginBottom: 28 }}>
          Never let the only copy of what your organization knows be the{" "}
          <em>machine code.</em>
        </p>
        <p className="lead" style={{ marginBottom: 14 }}>
          The explicit knowledge layer is source. Prompts, indexes,
          embeddings, caches, skills — and eventually model weights — are
          compiled artifacts.
        </p>
        <p className="muted">
          You recompile from source. You don't decompile the binary and hope.
        </p>
      </div>
    </div>
  </Slide>
);

// ── 20. Will the model swallow it? ───────────────────────────────────
const EndUpSlide = () => {
  const step = useStep();
  return (
    <Slide kicker="THE OPEN QUESTION">
      <h2>Will the model just swallow all of this?</h2>
      <div className="row">
        <div className="card">
          <div className="card-art">{LAYER_ART.Context}</div>
          <h3>Context</h3>
          <p className="small">Trajectories and examples, replayed each call. Cheap, forgetful.</p>
        </div>
        <div className="card good">
          <div className="card-art">{LAYER_ART.Knowledge}</div>
          <h3>Knowledge</h3>
          <p className="small">Graphs, docs, skills — explicit, inspectable, shared across models.</p>
        </div>
        <div className="card">
          <div className="card-art">{PRIMITIVE_ART.COMPILED}</div>
          <h3>Weights</h3>
          <p className="small">Fine-tuning, RL, world models — compiled, fast, opaque.</p>
        </div>
      </div>
      <Frag at={1}>
        <p className="lead" style={{ marginTop: 4 }}>
          The research doesn't crown a winner. So the question isn't graphs
          versus models — it's <strong>what should stay explicit, and what
          should be compiled.</strong>
        </p>
      </Frag>
      {step === 0 ? (
        <p className="small muted" style={{ marginTop: -6 }}>
          → press for the honest answer
        </p>
      ) : null}
    </Slide>
  );
};

// ═══════════════════════════════════════════════════════════════════
// CLOSE
// ═══════════════════════════════════════════════════════════════════

// ── 21. Closing ───────────────────────────────────────────────────────
const ClosingSlide = () => (
  <Slide tone="teal" blobs={false} kicker="THE LESSON">
    <div className="grow" style={{ ...centered, flexDirection: "column", alignItems: "flex-start", gap: 26 }}>
      <h2 style={{ maxWidth: 1350 }}>
        <em>Experience is abundant. Knowledge is distilled.</em>
      </h2>
<p></p>
<p></p>
<p></p>
<p></p>
      <p className="claim" style={{ maxWidth: 1350 }}>
        It's not <em>how much</em> you remember.
      </p>
      <p className="lead" style={{ fontSize: 38, maxWidth: 1350 }}>
        It's how you <em>store</em> it, what you <em>distill</em> it into,
        and whether you can <em>trace</em> it back.
      </p>
      <div className="row tight thesis-pillars">
        {PILLARS.map((p) => (
          <div key={p.k} className="thesis-pillar">
            <h3>{p.k}</h3>
            <p>{p.v}</p>
          </div>
        ))}
      </div>
    </div>
  </Slide>
);

// ── 22. Thanks / further reading ─────────────────────────────────────
const REFS: { href: string; label: string; desc: string }[] = [
  {
    href: "https://neo4j.com/blog/agentic-ai/enterprise-knowledge-layer/",
    label: "neo4j.com/blog/agentic-ai/enterprise-knowledge-layer",
    desc: "The enterprise knowledge layer: ontology, data, and memory as decision traces.",
  },
  {
    href: "https://neo4j.com/blog/agentic-ai/context-graph-decision-traces/",
    label: "neo4j.com/blog/agentic-ai/context-graph-decision-traces",
    desc: "Decision traces and the three-layer context graph.",
  },
  {
    href: "https://arxiv.org/abs/2511.20297",
    label: "arXiv:2511.20297 — BREW",
    desc: "Bootstrapping expeRientially-learned Environmental knoWledge.",
  },
  {
    href: "https://arxiv.org/abs/2512.10696",
    label: "arXiv:2512.10696 — ReMe",
    desc: "Remember Me, Refine Me: dynamic procedural memory.",
  },
  {
    href: "https://arxiv.org/abs/2605.16045",
    label: "arXiv:2605.16045 — RecMem",
    desc: "Recurrence-based memory consolidation.",
  },
  {
    href: "https://arxiv.org/abs/2604.27003",
    label: "arXiv:2604.27003",
    desc: "When Continual Learning Moves to Memory.",
  },
  {
    href: "https://arxiv.org/abs/2608.07169",
    label: "arXiv:2608.07169 — Agent Memory Distillation",
    desc: "Hierarchical teacher memory for small agents.",
  },
  {
    href: "https://arxiv.org/abs/2606.04781",
    label: "arXiv:2606.04781 — AIP",
    desc: "A graph representation for learning and governing agent skills (Neo4j).",
  },
  {
    href: "https://arxiv.org/abs/2501.13956",
    label: "arXiv:2501.13956 — Zep / Graphiti",
    desc: "Temporal knowledge graph architecture for agent memory.",
  },
  {
    href: "https://arxiv.org/abs/2502.12110",
    label: "arXiv:2502.12110 — A-MEM",
    desc: "Zettelkasten-style agentic memory for LLM agents.",
  },
  {
    href: "https://arxiv.org/abs/2606.25161",
    label: "arXiv:2606.25161 — TrustMem",
    desc: "Trustworthy memory consolidation: catching omission, corruption, hallucination.",
  },
  {
    href: "https://arxiv.org/abs/2504.13171",
    label: "arXiv:2504.13171 — Sleep-time Compute",
    desc: "Consolidation off the request path (Letta / UC Berkeley).",
  },
  {
    href: "https://graphstuff.com/actionknowledge",
    label: "graphstuff.com/actionknowledge — Context Graphs",
    desc: "William Lyon, Neo4j: memory → distillation → grounded, governed skills.",
  },
  {
    href: "https://arxiv.org/abs/2603.12649",
    label: "arXiv:2603.12649 — Skill Graphs (CMU)",
    desc: "One graph for configuring, executing, evaluating and improving robot skills.",
  },
  {
    href: "https://arxiv.org/abs/2409.07429",
    label: "arXiv:2409.07429 — Agent Workflow Memory",
    desc: "Inducing reusable workflows from trajectories.",
  },
];
const ThanksSlide = () => (
  <Slide kicker="FURTHER READING">
    <h2>Thanks</h2>
    <div className="refs">
      {REFS.map((r) => (
        <div key={r.href}>
          <a href={r.href} target="_blank" rel="noreferrer">
            {r.label}
          </a>
          <div className="desc">{r.desc}</div>
        </div>
      ))}
    </div>
    <p className="small muted" style={{ marginTop: 10 }}>
      Jeremy Adams · jeremy.adams@neo4j.com
    </p>
  </Slide>
);

export const slides: SlideDef[] = [
  // Act 1 — the flood
  { render: () => <TitleSlide /> },
  { steps: 2, render: () => <AmnesiaSlide /> },
  { render: () => <TraceSlide /> },
  { steps: 1, render: () => <ColdOpenSlide /> },
  { steps: 2, render: () => <StoreItAllSlide /> },
  { steps: 1, render: () => <ErrorSlide /> },
  { steps: 1, render: () => <ThesisSlide /> },
  // Act 2 — store it as structure
  { steps: 1, render: () => <SpectrumSlide /> },
  { steps: 1, render: () => <ContextGraphSlide /> },
  { steps: 1, render: () => <GraphSlide /> },
  // Act 3 — distill it into skills
  { render: () => <MemorySkillsDividerSlide /> },
  { steps: 1, render: () => <SearchPruneSlide /> },
  { steps: 1, render: () => <ForkTreeSlide /> },
  { steps: 2, render: () => <DeterministicSlide /> },
  { steps: 1, render: () => <LoopSlide /> },
  { steps: 1, render: () => <FrozenSlide /> },
  // Act 4 — keep it traceable
  { render: () => <CounterTransitionSlide /> },
  { steps: 2, render: () => <GatesSlide /> },
  { steps: 1, render: () => <ProvenanceSlide /> },
  // Close — the claim
  { steps: 1, render: () => <EndUpSlide /> },
  { steps: 1, render: () => <SourceCodeSlide /> },
  { steps: 1, render: () => <KnowledgeLayerSlide /> },
  { render: () => <ClosingSlide /> },
  { render: () => <ThanksSlide /> },
  // Backup — past Thanks, for Q&A or a longer slot
  { steps: 1, render: () => <LadderSlide /> },
  { steps: 1, render: () => <ConsolidationSlide /> },
];
