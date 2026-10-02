# Design-sweep checklist (Neo4j template)

Run after any restyle. Screenshot every slide at stage size, including
fragment states.

**Palette**
- [ ] Only scheme colours + `#D43300` / `#6FA646` semantics; no stray blues/greens from old tokens (grep for `#` in every CSS file, including diagram and engine tokens).
- [ ] Navy `#014063` for title bg; teal `#0A6190` for blobs on white and teal slides; cyan `#8FE3E8` only on dark; yellow `#FAFF00` only as numerals/accents on teal.
- [ ] Cards/surfaces on `#FCF9F6`, borders warm (`#E4DFD3`), not grey.

**Type**
- [ ] Syne only on hero/statement titles; content titles Public Sans 600; body Public Sans 300/400; Thin for big numerals.
- [ ] Weights 100 and 300 actually loaded (check the fonts link).
- [ ] No monospace outside code samples; kickers/labels/tags in Public Sans.

**Layout & decoration**
- [ ] Each slide maps to one layout family (navy / light / light+blobs / teal / cream / closing).
- [ ] Blobs are the real template paths, full colour, full-bleed, unclipped.
- [ ] Light+blobs slides carry at most a claim plus one lead (~250px); anything heavier uses the plain layout.
- [ ] Text never sits on a blob unintentionally: agenda item 1 clears the top-right blob (y>256 for x>775); statement blocks on light+blobs start x≥300; title-slide content ends above the wave (y<690).
- [ ] Footer present on everything except the title slide; colour flips correctly (white on teal blobs / closing, navy on white and on cyan blobs).
- [ ] Footer is `position:absolute` at the bottom, not a flex item.

**Logos**
- [ ] Official PNGs only (no hand-drawn marks); rendered via mask so colour matches the slide (white on dark, navy on light).
- [ ] Wordmark on the title slide top-left ≈44px; footer ≈18px; aspect ratios 7121:2371 (wordmark) and 2100:2000 (mark).

**Content**
- [ ] Copy unchanged when the ask was styling-only (diff `slides.tsx` for text changes).
- [ ] `pnpm build` and `pnpm lint` pass; screenshots reviewed in a foreground browser tab.
