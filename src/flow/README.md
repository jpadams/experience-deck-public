# Flow

Copy-ported from hatchet-dev/hatchet `frontend/docs/components/flow` (MIT).
Changes: no `"use client"`, `import.meta.env.DEV` instead of `process.env`,
and the design tokens (`--fg`, `--accent`, `--rlh`, ...) live in `src/flow/tokens.css`
under the `flow-scope` class, tuned for light mode.


## Speed and looping

`<Flow.Root>` takes three playback props:

| prop | default | effect |
|---|---|---|
| `speed` | `1` | playback rate; scales wall-clock time, so every keyframe scales together |
| `loop` | `true` | wrap at `duration` and replay; `false` plays once and parks. The deck passes `false` by default (see `motion.ts`) |
| `holdAt` | `duration` | when `loop` is false, the loop time to park on (use the moment before a fade-out) |

The deck sets these in one place, `src/diagrams/motion.ts` (`SPEED`, `LOOP`),
and each diagram spreads `{...motion({ holdAt: HOLD })}` onto its Root. A
diagram can multiply its own rate (`motion({ speed: 0.25, holdAt })`). For
rehearsal, `?speed=0.5` and `?loop=1` (replay forever) on the deck URL
override both without a rebuild. `?t=poster` parks every diagram on its poster frame, `?t=hold` on its
`holdAt` (the frame `loop=0` ends on), and `?t=12000` on a given loop time (static, like reduced motion) — use it to screenshot a
frame from an automation tab the browser treats as hidden, where
`requestAnimationFrame` never fires. In that static mode Flow also exposes
`window.__flow.seek(t)` / `window.__flow.roots()`, which `scripts/export-slides.mjs`
uses to render animations frame by frame. A slide change fires `flow:reset`, so a parked animation replays when you
return to the slide. A fragment step within the same slide fires `flow:hold`,
which parks every diagram on its `holdAt` frame and stops its clock, so text
revealed under a finished diagram does not replay it. A Root with
`resumeOnStep` plays in segments instead: before advancing, the deck fires a
cancelable `flow:finish`, and a segment still playing snaps to its end and
cancels it, so that click finishes the segment and the next one advances.
