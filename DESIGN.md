# Design — "Muhr va koʻprik" (seal and bridge)

Owner: B. B1 turns this into tokens in `web/src/app/globals.css`. Keep this file in sync with them.

## World

Two sides of a dispute meet in the middle. The metaphor is a **bridge**: the claimant on the left and the
respondent on the right, with every step drawing them closer. The material is a calm, official **document
on good paper**: ink, a margin rule, and a round **seal (muhr)** that lands when the agreement is signed.
The page should feel trustworthy and humane, like a well-run notary's office, never a courtroom and never a
corporate dashboard. The courtroom side (the court in comparisons) is shown in muted rust and slate, while
mediation is shown in calm teal.

## Tokens (starting values)

| Token | Value | Use |
|---|---|---|
| `--paper` | `#FAF8F3` | page background |
| `--sheet` | `#FFFFFF` | cards and documents |
| `--rule` | `#E6E1D6` | borders and margin rules |
| `--ink` | `#1B2A4A` | text, primary buttons |
| `--ink-soft` | `#55607A` | secondary text |
| `--accord` | `#0F766E` | mediation, agreement, success (teal) |
| `--accord-tint` | `#E3F2EF` | teal backgrounds |
| `--court` | `#9A4A2C` | the court side in comparisons (rust), never for errors |
| `--seal` | `#2E4FA3` | the seal and links (stamp blue) |
| `--warn` | `#B7791F` | waiting states |
| `--stop` | `#C2410C` | the non-mediable stop card |
| `--highlight` | `#FFE58A` | the ZOPA line and key phrases (marker, 70 %) |

Light theme only. All text meets AA contrast.

## Type

- Display: **Unbounded** 600–700 for titles, big numbers and the landing headline.
- UI and body: **Onest** 400–700.
- Documents (invite letter, agreement, print view): **Source Serif 4** 400–600 (Literata was tried first and drew `ʻ` as a tiny mark; Source Serif 4 renders it correctly). If it ever renders badly, use
  **PT Serif** instead and update this file.
- B1 must check `oʻ gʻ ʼ` in all three fonts with a screenshot.
- Numbers: tabular figures; amounts are always written `9 000 000 soʻm`.

## Shape

- Sheets: white, radius 14 px, a 1 px `--rule` border and a soft shadow.
- Buttons: radius 12 px; primary is an ink fill, secondary a 1.5 px ink outline.
- Touch targets are at least 48 px. Phone layouts come first (the respondent and the judges use phones).

## Motion (motion/react)

- UI feedback 150–250 ms; page and step transitions 300–400 ms; springs (stiffness about 300, damping about 30).
- `AiThinking`: steps tick in one by one (minimum 1.6 s in total), so the "AI" moment is readable on stage.
- Comparison: the court and mediation bars grow from zero; mediation finishes first. NumberFlow counts the
  numbers.
- Respondent accepts: the two party cards slide toward the centre and meet (the bridge).
- Agreement signed: the seal stamps in (scale 1.6 → 1, rotate −8° → −4°, ring ripple), then a gentle teal
  glow. No confetti; this is a legal moment, so keep it dignified.
- `prefers-reduced-motion`: jump to the end states.

## Backgrounds

**Default: "Atlas muvozanati" (variant `e`).**
- **What it is:** Uzbek khan-atlas (abr ikat) bands in Samarkand tile colours run down both page edges and mirror
  each other like the two pans of a balance. That reads as justice: two equal sides and a clear middle where they
  meet.
  - Colours: cobalt `#1f4e9e`, turquoise `#14a3a0`, saffron gold `#e9b543`, pomegranate `#cf4f3c`.
  - The abr "cloud" edge comes from an SVG turbulence and displacement filter (`components/brand/atlas.tsx`).
  - The bands fade toward the content and sit over soft teal, blue and apricot glows.
- **Small screens (< 1024 px):** only thin atlas selvedge stripes stay on the edges, so text never sits on the pattern.
- **Research (2026-11-20):**
  - Khan atlas (abr) is Uzbekistan's best-known textile, now used by fashion designers worldwide.
  - Its blurred "cloud" edges are its defining trait.
  - Registan tiles are mainly cobalt, turquoise, white and gold.
  - A balance (scales) is the universal sign of justice.
- **Other variants**, preview with `?fon=a|b|c|d`: a soft glows, b dot grid, c bridge arcs, d girih lattice. The first
  try (a guilloche rosette) looked strange to the team and was removed.
- **Dark numbers section:** keeps the girih (dilduz) lattice at 9 % white.

## Don't

- No purple or blue gradients, glassmorphism, blob backgrounds, Inter or Roboto, or emoji as icons (use lucide).
- No gavels or courtroom imagery for mediation.
- No real photos of people (mediators get initials avatars).
- No tiny grey labels, and no spinner running over 1 s without text.
- Do not imitate the Ministry's official branding or coat of arms: we are a pitch, not the state.
