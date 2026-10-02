# Neo4j template brand system (decoded)

Source: `Copy of Copy of A Template for All Nodes.pptx` (Google Slides export,
theme "Simple Light", 54 slides, 34 layouts, 1 master). Slide size
9144000×5143500 EMU = 16:9. All px below are on a **1600×900 stage**
(1 EMU-px = 5715 EMU, 1pt = 2.222px).

## Colour scheme (theme1.xml)

| Scheme | Hex | Role in the template |
|---|---|---|
| dk1 | `#181414` | body text on light |
| lt1 | `#4F4D4E` | secondary text |
| dk2 | `#F2EAD4` | cream — section-divider background |
| lt2 | `#FCF9F6` | off-white — surfaces, subtitle on navy, blob on cream |
| accent1 | `#014063` | navy — title-slide background, top wave on closing |
| accent2 | `#0A6190` | primary blue — blobs on white, agenda/emphasis background, links |
| accent3 | `#4C99A4` | teal — divider blob, bottom wave on closing |
| accent4 | `#8FE3E8` | cyan — wave on title, blobs on teal |
| accent5 | `#6A82FF` | blue accent |
| accent6 | `#FAFF00` | yellow — agenda numerals (Public Sans Thin 48pt) |
| hlink | `#0A6190` | links |

Semantic colours used on real slides (not in the scheme): red `#D43300` and
salmon `#E46962` (negative), greens `#6FA646` / `#90CB62` (positive), orange
`#F96746`, amber `#FFA802`. Use `#D43300` for error and `#6FA646` for success.

## Fonts

Embedded in `ppt/fonts/`: **Syne** (Regular, Bold) and **Public Sans** in
Thin, Light, Regular, SemiBold (each with italic/bold variants). The theme's
declared font is Arial — ignore it.

Usage counts across slides/layouts: Public Sans 3404, Public Sans SemiBold
1306, Public Sans Light 831, Public Sans Thin 160, Syne 95.

| Element | Face | pt | ≈px on 1600 stage |
|---|---|---|---|
| Hero title (TITLE layout) | Syne Bold, white | 52–56 | 116–124 |
| Section title (TITLE_1…) | Syne Bold, accent1/dk1 or white | 42–52 | 93–116 |
| Content title (master) | Public Sans SemiBold, dk1 | 28 | 62 |
| Body (master) | Public Sans Light, dk1 | 16 | 36 |
| Agenda items | Public Sans SemiBold, white | 16+ | 36+ |
| Agenda numerals | Public Sans Thin, accent6 | 48 | 107 |
| Small / captions | Public Sans | 12 / 11.25 | 27 / 25 |
| Footer | Public Sans | 8 | 18 |

Most common sizes on real slides: 16pt (318×), 8pt (224×), 12pt (119×),
11.25pt, 32pt, 48pt, 64pt.

## Master geometry (px)

- Title placeholder: x 64, y 48, w 1472, h 96
- Body placeholder: x 64, y 208, w 1472, h 592 (two-column variants: 640 + 640 at x 64 / 864; three columns 416 wide at x 64 / 576 / 1088)
- Footer text "Neo4j Inc. All rights reserved 2023": x 63, y 854, 8pt; slide number at x 0
- Hero/section title placeholder: x 159, y 281, w 1312, h 306; subtitle x 161, y 605, w 736
- Agenda body on the real agenda slide: x 467, y 183, w 666 (offset right to clear the bottom-left blob)

## Layout families → what to reproduce

| Family (layout names) | Background | Decoration (shape → fill) | Text | Footer |
|---|---|---|---|---|
| **TITLE** (slideLayout1) | accent1 navy | blob top-right @(955,−157) 975×893 → accent2; wave bottom-left @(−14,693) 1003×368 → accent4; large white vector wordmark @(42,292) | Syne white; subtitle accent4/lt2 | none |
| **TITLE_1 / _1_1 / _1_1_1** (2–4) | dk2 cream | blob top-left @(87,−79) 488×446 → accent3; blob right @(1164,257) 808×453 → lt2 | Syne accent1 | dk1 |
| **TITLE_1_1_1_1…** (5–7, "Thank you") | accent2 | wave top @(−1331,−497) 2574×939 → accent1; wave bottom @(−171,440) 2574×939 → accent3 | Syne white | white |
| **TITLE_AND_BODY(_1, _2)** (8, 11, 14, 27, 31) | white | none | Public Sans dk1 | dk1 |
| **…_1_2 / _3 / _2_1** blob variants (9, 12, 15, 28, 32) | white | blob top-right @(775,−225) 1320×481 → accent2; blob bottom-left @(−718,568) 1320×481 → accent2; tab @(1464,−8) 195×47 | dk1 | **white** (sits on blob) |
| **…_1_2_1 / _3_1 / _2_1_1** (10, 13, 16, 30, 34) | accent2 | same two blobs → accent4 | white | **dk1** (sits on cyan) |
| Split layouts (17–26) | accent2 with white panel 800 or 533 wide | optional accent4 blobs | dk1 on white, white on teal | dk1 |

Blob coordinates are the shape's bounding box; the paths themselves are in
`../shapes/template-shapes.json` (all 50 custGeoms) and the 12 that matter
in `../web/shapes.ts` with friendly names:

| Export | Layout | Fill |
|---|---|---|
| `TITLE_BLOB_TR`, `TITLE_WAVE_BL` | TITLE | accent2, accent4 |
| `CONTENT_BLOB_TR`, `CONTENT_BLOB_BL` | TITLE_AND_BODY_1_2 (also used with accent4 on teal) | accent2 |
| `SECTION_BLOB_TL`, `SECTION_BLOB_R` | TITLE_1 | accent3, lt2 |
| `CLOSING_WAVE_TOP`, `CLOSING_WAVE_BOTTOM` | TITLE_1_1_1_1 | accent1, accent3 |
| `NODE_CHAIN` | slide 5 | accent2 — small metaball "node chain" divider @(665,802) 269×60 |

## Logos

The template draws the wordmark as white vector custGeoms on the title layout
(shapes 15/16 in slideLayout1). Prefer the supplied PNGs:
`logo-white-RGB-transBG.png` (wordmark, 7121×2371) and
`logo-mark-white-RGB-transBG.png` (mark, 2100×2000). Both are pure white with
alpha, so recolour with a CSS mask. Typical sizes on the 1600 stage: wordmark
44px tall on the title slide, 18px tall in the footer.

## What the template does *not* have

No monospace face, no uppercase tracked "kicker" labels, no drop shadows, no
gradients, no rounded photo frames. When a web deck adds those (kickers, code
blocks), set them in Public Sans / JetBrains Mono and keep them small.
