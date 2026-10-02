---
name: neo4j-deck-brand
description: Make a web slide deck (React/HTML/CSS) match the Neo4j corporate PowerPoint template "A Template for All Nodes" — palette, Syne/Public Sans typography, layout geometry, the real blob/wave shapes, and the official logos. Also a general method for decoding any .pptx template into web tokens and SVG paths. Use when asked to brand, restyle, or design-sweep a presentation against a Neo4j (or other) pptx template, or to use the Neo4j logos correctly.
---

# Neo4j deck brand (from the pptx template)

This directory is the skill. It holds the source template, the official logos,
the decoded brand system, scripts to re-derive everything, and drop-in web
starters. Install by symlinking or copying the directory into
`~/.claude/skills/neo4j-deck-brand` (or keep it in a repo's `assets/`).

```
SKILL.md                              this file
Copy of Copy of A Template for All Nodes.pptx   the source of truth
logo-white-RGB-transBG.png            official wordmark, white on transparent (7121×2371)
logo-mark-white-RGB-transBG.png       official mark, white on transparent (2100×2000)
reference/brand-system.md             decoded palette, fonts, type scale, layouts, decoration rules
reference/web-implementation.md       how to apply it in a React/CSS deck + pitfalls hit in practice
reference/compliance-checklist.md     the design-sweep checklist
reference/theme-dump.json             raw output of `pptx_brand.py theme`
reference/layouts-dump.txt            raw output of `pptx_brand.py layouts`
scripts/pptx_brand.py                 pptx → theme / layout summary / SVG shapes / previews (stdlib only)
shapes/template-shapes.json           every custGeom in the template as SVG paths (1600×900 stage)
shapes/template-shapes.ts             the 12 hero/section/content/closing shapes, as TS exports
shapes/palette.json                   scheme-name → hex map for previews
shapes/preview/*.svg                  one SVG per layout, to eyeball the shapes
web/brand-tokens.css                  drop-in CSS variables + type scale + geometry notes
web/shapes.ts                         curated, friendly-named shapes (TITLE_BLOB_TR, CONTENT_BLOB_BL, …)
web/Blobs.tsx                         <Blobs tone> decoration + <Logo> mask component (React)
```

## Workflow

1. **Never eyeball a template. Decode it.** Run the script on the pptx (or any
   other pptx you are asked to match):
   ```bash
   python3 scripts/pptx_brand.py theme   "<deck>.pptx"                     # colours, fonts, sizes
   python3 scripts/pptx_brand.py layouts "<deck>.pptx"                     # per-layout geometry in px
   python3 scripts/pptx_brand.py layouts "<deck>.pptx" --slides            # how real slides use it
   python3 scripts/pptx_brand.py shapes  "<deck>.pptx" --out shapes.json   # blobs → SVG paths
   python3 scripts/pptx_brand.py preview shapes.json --out preview --palette shapes/palette.json
   ```
   The theme's `fontScheme` is usually a decoy (Arial); trust `typefaces_used`
   and `ppt/fonts/` instead. Colours in `srgb_colours_on_slides` beyond the
   scheme are the template's semantic colours (error red, success green).
   For the Neo4j template this is already done: read `reference/brand-system.md`.

2. **Map each slide to a template layout family**, not to ad-hoc styling.
   Neo4j has five families worth reproducing: `navy` (TITLE), `light`
   (TITLE_AND_BODY, plain or with blobs), `teal` (…_1 variants, cyan blobs),
   `cream` (TITLE_1 section divider), `closing` (TITLE_1_1_1_1 thank-you waves).
   `web/Blobs.tsx` implements exactly these.

3. **Use the official logos via a CSS mask**, never redraw the mark. The PNGs
   are white-on-transparent, so on white slides they are invisible unless
   masked and recoloured (`background-color: currentColor` + `mask-image`).
   See `<Logo>` in `web/Blobs.tsx`.

4. **Reproduce the real shapes.** Import `web/shapes.ts` (or regenerate with
   `shapes --out x.ts`) and draw them in one full-bleed
   `<svg viewBox="0 0 1600 900" preserveAspectRatio="none">`. Shapes extend
   past the slide edge on purpose; do not clip or normalise them.

5. **Run the sweep** in `reference/compliance-checklist.md`, then verify in a
   real browser at the deck's native stage size. Screenshot every slide,
   including fragment states (`#/9.1`).

## Rules of thumb learned on the Neo4j template

- Syne is only for hero and statement titles. Content titles are Public Sans
  SemiBold; body is Public Sans Light/Regular. No monospace anywhere in the
  template; keep mono for code samples only.
- Blobs are full-colour, not tinted. The template puts accent2 blobs on white
  at 100% opacity and lets content avoid them (agenda body starts at x≈467).
- Footer colour flips depending on what it sits on: dark text on white and on
  cyan blobs, white text on teal blobs and on the closing waves. The title
  layout has no footer at all.
- Yellow (accent6) is a numeral/accent colour on teal, never a fill on white.
- Cards and surfaces use lt2 (#FCF9F6), not grey. Borders are warm (#E4DFD3).
- Keep the message untouched when asked to restyle: only tones, layout
  offsets, typography, colour, and decoration change.
