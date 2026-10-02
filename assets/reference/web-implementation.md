# Applying the brand in a React / CSS slide deck

Reference implementation: `experience-deck` (`src/brand/`, `src/ui.tsx`,
`src/index.css`). Copy the starters in `../web/`.

## Stage

Render slides on a fixed 1600×900 stage and scale the stage to the window
(`transform: scale(min(vw/1600, vh/900))`). Every measurement in
`brand-system.md` is then usable directly.

## Tokens

`web/brand-tokens.css` defines the palette and documents the type scale and
geometry. Load fonts with these exact weights (Thin 100 and Light 300 are
needed and are not in the usual Google Fonts default set):

```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Public+Sans:wght@100;300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

## Slide tones

`<Slide tone="light|navy|teal|cream|closing" blobs? footer?>`:

- `light` — white, plain by default (TITLE_AND_BODY_1). Pass `blobs` for the
  blob variant; then push centred statement text right (`margin-left ≈ 300`)
  so it clears the bottom-left blob, and the footer brand turns white.
  Budget: the blob variant only fits a statement block of roughly 250px
  height (one claim + one lead). Heavier blocks (claim + lead + footnote)
  cannot clear both blobs at once — use the plain layout instead.
- `navy` — title slide. Logo wordmark top-left (44px), Syne title, body
  centred with extra bottom padding so nothing overlaps the cyan wave
  (starts at y≈690). No footer.
- `teal` — agenda / emphasis. Cyan blobs. Agenda list offset
  `margin-left: 400px; margin-top: 48px` so item 1 clears the top-right blob
  (which reaches y≈256 for x>775). Footer brand navy (sits on cyan).
- `cream` — section divider / pivot statement. Syne navy, left-aligned at
  x≈160, vertically centred.
- `closing` — thank-you layout: navy top wave, teal2 bottom wave, Syne white.

Add `on-dark` / `on-light` and `has-blobs` classes so colour rules stay
simple: `.slide.on-dark p { color: rgba(255,255,255,.82) }`,
`.slide.on-light.has-blobs .footer-brand { color: #fff }`,
`.slide.teal.has-blobs .footer-brand { color: var(--navy) }`.

## Decoration

One full-bleed SVG per slide:

```tsx
<svg className="brand-blobs" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden>
  {LAYERS[tone].map(l => <path d={l.d} fill={l.fill} />)}
</svg>
```

`position:absolute; inset:0; z-index:0; pointer-events:none`. Give the
kicker, body, and footer `position: relative; z-index: 1`.

## Logo as a mask

```tsx
<span role="img" aria-label="Neo4j" className="logo"
      style={{ height, width: height * 7121/2371, WebkitMaskImage: `url(${logoUrl})`, maskImage: `url(${logoUrl})` }} />
```
```css
.logo { display:inline-block; background-color: currentColor;
        mask-repeat:no-repeat; mask-size:contain; mask-position:center;
        -webkit-mask-repeat:no-repeat; -webkit-mask-size:contain; -webkit-mask-position:center; }
```
Import the PNGs from `src/` so Vite hashes them (`types: ["vite/client"]`
must be in tsconfig for `.png` imports). Set colour via `color` on the
parent: navy on white slides, white on dark.

## Type

```css
h1 { font: 700 92px/1.02 var(--font-display); letter-spacing:-0.015em }   /* hero, 2 lines fit 1456px */
h2 { font: 600 56px/1.12 var(--font-sans);    letter-spacing:-0.02em }
h3 { font: 600 28px var(--font-sans) }
p, li { font: 400 28px/1.42 var(--font-sans); color: var(--ink-2) }
.lead { font-weight:300; font-size:40px; color: var(--ink) }               /* template body is Light */
.statement .lead { font: 700 60px/1.1 var(--font-display) }                /* section-divider statement */
.agenda .n { font: 100 68px/1 var(--font-sans); color: var(--yellow) }
.stat .n { font: 100 112px/1 var(--font-sans); color: var(--navy) }        /* yellow on dark */
.kicker { font: 600 15px var(--font-sans); letter-spacing:.18em; text-transform:uppercase; color: var(--teal) } /* yellow on dark */
.footer { font: 500 14px var(--font-sans); bottom:30px; left:72px; right:72px }
```

## Pitfalls hit in practice

- A blanket `.slide > .footer { position: relative }` (added for z-index)
  silently overrides `position: absolute` on the footer and makes it a flex
  item mid-slide. Put `z-index` on the absolute rule instead.
- `qlmanage -t -s N` thumbnails SVGs into an N×N square (cropped), fine for a
  glance, not for measurement. Use the browser for real checks.
- Headless/automation tabs report `document.hidden === true`; animation
  engines that pause when hidden (the deck's Flow engine does) will show
  blank stages in screenshots. Confirm against a baseline before "fixing".
- White-on-transparent logos vanish on white backgrounds and on the cyan
  wave; always recolour via mask and check the footer on every tone.
- Flow diagrams: `Flow.Token` centres its child on `(x, y)`, so x values are
  column *centres*, not left edges; every chip must fit within its column's
  half-width or it hangs off the stage. Keep SVG labels clear of the first
  row (labels at y≈20, first chip centre ≥ y 90). Make the design width equal
  the rendered width (`Flow.Stage width={W}` + `.dg-x { width: Wpx }`) so
  units are px and chip text set in px lines up with the geometry.
- The Flow frame ships a border, padding, and margin and does not centre its
  stage. On slides, zero them and centre: `.flow-scope { border:0; padding:0;
  margin:0; align-items:center }` and `.flow-scope > [class*="root"] { width:100%;
  display:flex; justify-content:center }`.
- To check Flow geometry in a hidden automation tab, inject
  `[class*="_token_"]{visibility:visible!important;opacity:1!important}` and
  screenshot the poster positions.
- Give every animated slide one speed and one loop switch. The Flow engine
  takes `speed`, `loop`, and `holdAt` on `<Flow.Root>`; put deck-wide values
  in `src/diagrams/motion.ts` (`SPEED`, `LOOP`; the deck plays each diagram
  once and parks on its hold frame by default) and spread
  `{...motion({ holdAt: HOLD })}` onto each Root. `?speed=` and `?loop=1` on
  the URL override both for rehearsal. Never bake speed into keyframe maths.
  A slide change fires `flow:reset` (replay from 0); a fragment step within the
  same slide fires `flow:hold` (park every diagram on its `holdAt` frame and
  stop the clock), so text revealed under a finished diagram never replays it.
- Automation tabs are usually `document.hidden`, so no animation frame ever
  runs and every Flow diagram screenshots at t=0 (empty). Add `?t=poster`
  (each diagram's poster frame), `?t=hold` (the frame `loop=0` ends on) or
  `?t=<ms>` to park the clocks statically, then screenshot. Diagram edges
  driven by `useFlowFrame` render too.
- Export to PNG / animation + PPTX: `pnpm export` (`scripts/export-slides.mjs`).
  It runs `vite build`, serves `dist/` on a free port, drives one headless
  Chrome over the DevTools protocol, writes to `export/` (gitignored; not under
  `dist/`, which the build empties), shoots every slide at its final step
  using `?export=1&t=hold&loop=0` (`export` fixes the stage at 1600×900,
  scale 1, no HUD) and builds a 16:9 PPTX with pptxgenjs, slide text in the
  speaker notes. Flags: `--scale 3` for 4800×2700 stills (default 2);
  `--video gif|mp4|both` renders every Flow slide frame by frame through
  `window.__flow.seek(t)` (a hook Flow exposes only in static `?t=` mode) and
  encodes with ffmpeg at `--fps 24` — GIF autoplays in a PowerPoint slideshow
  (first frame shows in edit view), MP4 gets the hold frame as its cover and
  plays on click; `--all-steps` gives one slide per fragment state;
  `--only 8,9` a subset; `--base <url>` uses a server you already run (note
  `pnpm preview` defaults to port 4173). Headless Chrome's `--window-size`
  includes ~87px of browser chrome, which is why export mode ignores the
  viewport instead of fitting to it.
- Diagram/token CSS often carries its own palette (`tokens.css`); align it to
  the theme too or the diagrams will look off-brand next to the slides.
