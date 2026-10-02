# Speaker notes: *Experience Is Abundant. Knowledge Is Distilled.*

A draft for a **20-minute** slot. The budgets add up to about **19 minutes**,
which leaves about a minute for a late start or a slow click. The spoken lines come to about 2,000 words, or about 15½
minutes at 130 words per minute. The rest of each budget is for letting the
animations play (slides 5, 6, 9, 10, 14 and 19 run 10–15 seconds each), pausing
and clicking. Treat them as talking points to say in your own words, not a
script to read.

`[click]` marks a fragment step. Every animated slide also takes one click to
finish its build (it jumps to the final frame) before the next click advances,
so you can cut an animation short without skipping the slide. Those clicks
aren't marked below. The exception is slide 3 (the flood): one click moves on. Slide numbers follow the `best` branch's
24-slide order. Two backup slides (B1–B2) sit after Thanks for Q&A or a longer
slot. Lines marked **Say it right** are places where the slide still compresses
a source (see `citations.md` §2). They're notes for you, not lines for the
audience. Say the exact version aloud, or fix the slide.

The spine of the talk is the thesis on slide 7: **store** it as structure,
**distill** it into skills, **trace** it back to its runs. The first slide of
each part carries its number and pillar in the kicker (1 · STORE, 2 · DISTILL,
3 · TRACE), so the audience can see where they are.

| Section | Slides | Budget | Running |
|---|---|---|---|
| Opening · The flood | 1–6 | 4:50 | 4:50 |
| Thesis | 7 | 0:25 | 5:15 |
| Part 1 · Store it as structure | 8–10 | 2:40 | 7:55 |
| Part 2 · Distill it into skills | 11–16 | 5:25 | 13:20 |
| Part 3 · Keep it traceable | 17–19 | 2:25 | 15:45 |
| Close · The claim | 20–24 | 3:10 | 18:55 |

---

## Opening · The flood (4:50)

### 1 · Title (0:30)
Hi, I'm Jeremy, from Neo4j. This talk is about what agentic AI leaves behind:
the huge trail of experience every agent run produces. And about what it takes
to turn that trail into something an agent, or a whole company, can actually
reuse. The short version is in the title. Experience is abundant. Knowledge has
to be distilled.

### 2 · 10,000 tasks (1:00)
Let me start with a question. Say your agent finished ten thousand tasks
yesterday. Refunds, tickets, pull requests, whatever it does for you. What does
it know today?

`[click]` Nothing. Unless you built something to catch it, every lesson from
those ten thousand runs is gone. The first success, the weird edge case, the
API that changed under it: all gone.

`[click]` It's a brilliant new hire on their first day, every day. The talent is
real, so this isn't a complaint about models. The problem is that it never gets
seniority.

### 3 · The flood (0:40)
And it's not that we're short of material. Every tool call, every conversation,
every commit, every error, every robot trace records what happened, what worked
and what didn't. Almost none of it is ever read again. We log it, we pay to
store it, and we let it rot.

### 4 · Billions of trajectories (0:25)
Scale that up: billions of agent trajectories. `[click]` So what do we do with
them? That's the question for the next fifteen minutes.

### 5 · "Fine — just store everything." (1:15)
The obvious answer is to store everything, give the agent memory and let it look
things up. The diagram plays in two parts.

With a small store it works. The task is a v2 refund, the right memory makes the
top three, and the task is solved. *(The diagram stops here; take your time.)*

`[click]` Now watch the store grow. Same task, same
three slots in the context window. But now there are look-alikes: refund on the
v1 API, refund on an old shop, a v1 retry. They look *more* relevant than the
right answer, and they fill the slots. The right memory is still in the store.
It just never gets retrieved.

A recent study calls this negative transfer, and it hits the hard cases hardest.
Memory doesn't remove the bottleneck; it moves it to retrieval. In BREW's
benchmarks, two memory-augmented baselines finished behind agents with no memory
at all.

`[click]` So: more memory can make your agent *worse*.

### 6 · An incorrect answer disappears. An incorrect memory compounds. (1:00)
And it gets worse over time. Follow the diagram. The agent distills its
experience and gets two things out: knowledge, and error.

When a memoryless agent is wrong, the mistake reaches one action and is
forgotten. When a *learning* agent stores a wrong lesson, the error feeds back
into future experience. The runs it misleads get distilled again. The mistake
reinforces itself.

**Say it right:** "The mistake is forgotten, even if its side effects aren't. A
bad memory repeats the mistake." Say this before someone raises the obvious
objection that a wrong *action* can have lasting consequences.

TrustMem names three ways a memory update goes wrong: omission, corruption and
hallucination. Hold on to those; they come back.

---

## Thesis (0:25)

### 7 · It's not how much you remember. (0:25)
So if more memory isn't the answer, what is? It's not how much you remember.
It's how you *store* it, what you *distill* it into, and whether you can *trace*
it back.

`[click]` Three parts. Store it as structure, so the right memory can be told
apart from its look-alikes. Distill it into skills that get tested, reused and
pruned. And trace every piece back to the runs that produced it. That's the rest
of the talk; you'll see the number in the corner as we go.

---

## Part 1 · Store it as structure (2:40)

### 8 · Several primitives are competing for this layer (0:50)
One: how you store it. There are four serious candidates. Plain text and
markdown: readable and cheap, but hard to query at scale. Vector embeddings:
great for similarity, weak on identity, relationships and *why*. And similarity
is exactly what failed us on the refund. Model weights: fast, but opaque and
expensive to audit or roll back. Knowledge graphs: explicit entities and
relationships, inspectable, provenance-preserving.

`[click]` Graphs keep turning up. To be honest, that makes them a candidate for
this layer, not a crowned winner. Here's the case.

### 9 · A context graph is three memories in one graph (1:00)
Here's how we frame it at Neo4j. A context graph is three memories in one graph.
Short-term: the conversation and its messages. Long-term: the enterprise
knowledge, the people and organisations those messages mention. Reasoning: the
decision trace a message triggers, its steps, the tool call, and what that call
retrieved.

The point is the arrows *between* the colours. Because it's one graph, you can
traverse from a message to the decision it caused to the facts it relied on.
And back to the refund: "v1 API" versus "v2 API" isn't a look-alike string
here. It's a relationship to a specific entity. That's how the right memory gets
told apart from the wrong one.

### 10 · The graph holds memory and is the workbench. (0:50)
One run is episodic. Patterns *across* runs are where knowledge comes from, and
finding them needs shared entities and relationships made explicit. Watch the
four runs fly onto one graph. Steps that name the same entity land on the same
node, so what repeats becomes a visibly heavier path. The graph is the memory,
and it's also the workbench: you can pull a skill out of it, an analytics
insight, verified training data, each traceable to the runs it came from. A-MEM
and Zep both land here too.

That heavier path is what we distill next.

---

## Part 2 · Distill it into skills (5:25)

### 11 · Memory tells you what happened. Skills tell you what to do. (0:30)
Two: what you distill it into. Memory tells you what happened. Skills tell you
what to do. My colleague William Lyon puts it this way: distillation is the
compiler between them.

**Say it right:** his full line is that distillation is the compiler from
short-term, long-term and reasoning memory into governed, reusable procedural
knowledge. Those are the three colours on slide 9, so the full line lands if you
have the time. Otherwise credit the phrase to his talk rather than quoting it
word for word (fix #5).

### 12 · Learning is search, then pruning. (1:00)
Real learning looks like this. One task fans out into many attempts. Most fail
and get pruned. The survivors converge on a recipe.

The failures stay on screen as ghosts. They aren't waste; they're the raw
material. BREW, from Microsoft, runs a tree search over candidate recipes and
keeps the ones that raise task reward: 10 to 20 percent higher task success,
10 to 15 percent fewer steps. SKILL-KD diffs a failed run against a successful
one and turns the difference into a skill patch.

### 13 · Overlay the sessions and a path wears in. (1:00)
Now overlay many sessions of the same kind of task: every fork somebody tried,
piled on top of each other. That's the heavier path from the graph. The
well-walked segments get thicker; the dead ends drop out on outcome. The main
route becomes the skill, the runners-up its fallbacks. Lyon's pipeline does
exactly this, clustering recurring actions by frequency and splitting them by
tool outcome.

`[click]` And here's why you need the aggregate. The runners-up are local
maxima. No single session can tell which peak is the global one. Only the pile
of sessions can.

### 14 · Every run should make the next one shorter. (0:45)
Put it together and you get a loop. A run produces trajectories. Distillation
prunes most of them, and what survives goes into the knowledge store, which
feeds the next run. Every lap is shorter and succeeds more often.

The bars are illustrative; the direction is reported. ReMe names the enemy:
*passive accumulation*. Their answer is distill, reuse, and prune what stops
earning its keep.

### 15 · Typed steps make the context lookup deterministic. (1:30)
Here's what "shorter" looks like when the skill itself is a graph. *(The slide
opens on the skill as code.)* Five steps, top to bottom. Three are scripts:
resolve the customer, run the evidence plan, do the policy arithmetic. One is a
judgment, one is routing. The Cypher is simplified to make the point; the real
plan runs ten named retrievals. None of the first three steps needs a model.

`[click]` The code boxes fold into the step list.

Prose know-how gets re-read and re-derived every session. Structured steps bind to
recorded tool calls: tool name, typed inputs and outputs, expected status. The
graph fixes *which* context a task needs, so retrieval becomes a query. Judgment
shrinks to a typed question a small, fast model can answer.

`[click]` Here's what that bought us on 20 credit-limit decisions. The tool-loop
agent took 68 seconds on average, about five tool calls per run, and the
evidence it gathered varied. The fixed plan plus Jev, TypeSafe's typed decision
model, reached a verdict in 3 seconds with zero extra tool calls and identical
evidence every time. Jev decided 14 cases alone and escalated 6. Claude, reading
the same evidence, agreed with the fast path 20 out of 20.

**Say it right:** 3 seconds is the verdict step, not the whole path.

That's one demo. At scale, AIP, from Neo4j, compiles prose skills into a
schema-validated execution graph: pass rate from 53 to 67 percent across 27
real tasks.

### 16 · A frozen 8B with a living knowledge layer beats a memoryless 14B. (0:40)
And the result that should make you stop and think. A frozen 8-billion
parameter model with a living knowledge layer edges past a 14-billion model with
no memory.

`[click]` Qwen3-8B plus ReMe scores 55.0 against 54.7 for Qwen3-14B. The margin
is thin. The point is that the knowledge layer does work that extra parameters
would otherwise have to do. Small students given teacher memory gain 27 points
on AppWorld.

**Say it right:** four tenths of a point, so say "edges past" or "matches", not
"beats".

---

## Part 3 · Keep it traceable (2:25)

### 17 · None of this is automatically safe. (0:10)
Three: trace. Because none of this is automatically safe. *(Pause. Let it land.)*

### 18 · Three ways a memory goes bad (1:15)
Distilled knowledge can go bad too. Three ways, all from Neo4j's own
skill-distillation pipeline.

`[click]` One: *ungrounded*. A plausible procedure written from a transcript,
with no link to evidence. You can't verify it, and you can't tell when it goes
stale. The fix is grounding: every step points at the memory it came from.

`[click]` Two, my favourite war story: *grounded, and still wrong*. An early run
produced a skill that scored 100 percent on provenance. Every line was real. And
it chained billing-dispute steps onto incident-management steps. Every line was
true; the whole was nonsense. The fix is coherence: one skill, one cluster of
experience, or split it.

`[click]` Three: *drift*. A source gets deleted, or a tool's behaviour changes,
and the procedure silently rots. That's worse than no skill at all. The fix is
to reconcile continuously: repair the step, or re-distill.

### 19 · Knowledge you can't trace back… is a liability that compounds. (1:00)
Which brings us to the consequence. Knowledge you can't trace back to the runs
that produced it is a liability that compounds.

On the left, three runs of that same refund task; one hits a 410 from the old
API and gives up. On the right, the distilled skill. Watch the links draw back:
every line of the skill points at the steps it came from. The pitfall line cites
the two *failures*. Failed runs count as evidence too.

That's what makes a TrustMem-style check possible: coverage, preservation and
faithfulness on every update. If you can't re-derive it, you can't repair it.
And those links are just edges, which is one more reason the graph keeps showing
up.

---

## Close · The claim (3:10)

### 20 · Will the model just swallow all of this? (0:50)
Remember the four candidates from the start of part one. Here's the fair
question: won't the models just swallow all of this? Maybe some of it. Put it on
a spectrum. Context: replayed every call, cheap, forgetful. Knowledge: graphs,
docs, skills, explicit and shared across models. Weights: fine-tuning and RL,
compiled, fast and opaque.

`[click]` The research doesn't crown a winner. So the question isn't graphs
versus models. It's what should stay explicit, and what should be compiled.

### 21 · The graph is the source code. (1:00)
Here's my answer. The graph is the *source code*. Remember Lyon's line:
distillation is the compiler. The graph is the memory and also the workbench,
and what comes out of it are compiled artifacts: skills, analytics insights,
training data, prompts, embeddings, eventually model weights. Fast, opaque and
re-derivable. You recompile from source. You don't decompile the binary and
hope.

`[click]` A self-improving loop needs four properties from its substrate:
explicit, so a human can review it; typed, so steps are executable and
checkable; flexible, so the schema grows with the domain; traceable, so every
asset points back at its runs. That's store, distill and trace in one line.
Robotics got to the same shape independently: CMU uses a skill graph as one
representation for configuring, executing, evaluating and learning.

### 22 · Memory is one pillar of the knowledge layer. (0:40)
To zoom out: memory is one pillar of what Jesús Barrasa calls the enterprise
knowledge layer. `[click]` This talk lives here. The other pillars are what
ground and govern it. Data: the entities a skill touches are real records.
Ontologies: the domain model types those entities, and business rules bound
what a step is allowed to do. We touched one pillar today; come talk to us about
the rest.

### 23 · Closing (0:25)
Experience is abundant. Knowledge is distilled. *(Pause.)* The challenge was
never giving an agent infinite memory. It's deciding what deserves to become
knowledge.

### 24 · Thanks (0:15)
Thank you. Everything I cited is on this slide and linked in the deck. I'm happy
to take questions.

---

## Backup slides (after Thanks)

Not part of the timed run. In Q&A, jump to one by adding its hash to the URL
(for example `#25`). The HUD counts them, so Thanks shows `24 / 26`. Don't
click past Thanks, and don't press `End`: it goes to B2.

- **B1 · "Experience distillation" has a ladder now.** (`#25`) Episode → reflection →
  procedure → workflow → skill, 2023 to now. Use it for "is anyone else doing
  this?" The AWM numbers (about 25 and 51 percent) are relative gains.
- **B2 · Attention is scarce. Consolidate while nobody's asking.** (`#26`) RecMem and
  sleep-time compute. Use it for "when does the distilling run?" or "what does it
  cost?" **Say it right:** "*up to* 87 percent lower memory-construction cost";
  "the brain does most of its consolidating while you sleep, too."

## If you're running short (a 22–25 minute slot)

Add back in this order. Each one means moving its line in the `slides` array
in `src/slides.tsx` before the talk; you can't reorder slides live.

1. **B1, after slide 13** (+1:15). Goes well before the loop.
2. **B2, after slide 14** (+1:00). Open with "when do you do the distilling? Not on the hot path."

## If you're running long

These are the cuts that cost the least, in order:

1. **Slide 13's inset** (local maxima): skip the click and say one sentence. Saves about 0:20.
2. **Slide 14** (the loop): one breath, "every lap shorter, every lap more often right", and move on. Saves about 0:25.
3. **Slide 4**: say the line over slide 3 and click straight through. Saves about 0:20.
4. **Slide 15's AIP paragraph**: drop it. Saves about 0:15.
5. **Slide 22** (knowledge layer): one sentence and the click. Saves about 0:20.
6. **Slide 10**: one sentence ("the graph is also the workbench, where repeated paths show up") as the hand-off to distilling. Saves about 0:30.

## Likely questions

- **"Isn't this just RAG?"** RAG retrieves what was *written*. This is about what
  the agent *did*: distilled, tested, pruned and traced. Slide 5 is the reason
  plain retrieval over raw experience isn't enough.
- **"Won't long context make this moot?"** A bigger window doesn't fix
  *selection*. Slide 5's look-alikes still outrank the right memory. And you
  still need provenance and repair (slides 18–19).
- **"Why a graph and not a vector store?"** Similarity finds look-alikes. You need
  identity, relationships and provenance to know which look-alike is *right*
  and where it came from (slides 8–10).
- **"Is anyone else doing this?"** Backup B1, the ladder.
- **"When does distillation run, and what does it cost?"** Backup B2.
