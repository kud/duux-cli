# duux-cli — brand sheet

## The mark

Three open arcs on a shared 33-unit radius, rotated at 120°, with a hub holding the
centre. The blades are never closed: the eye completes the rotor, which is what gives
the mark its lightness. It reads as a fan and as a spiral of airflow at the same time.

Everything is hand-authored vector on a `0 0 100 100` grid, transparent ground, no baked
tile.

## Files

| File                                 | Use                                                        |
| ------------------------------------ | ---------------------------------------------------------- |
| `assets/icon.svg`                    | The mark, in brand teal. Default for anything ≥24px.       |
| `assets/icon-mono.svg`               | Same geometry, `currentColor` — inherits ink from context. |
| `assets/favicon.svg`                 | Simplified glyph for ≤24px. Not the mark shrunk.           |
| `assets/favicon-mono.svg`            | Simplified glyph, `currentColor`.                          |
| `assets/brand/lockup-horizontal.svg` | Mark + wordmark, side by side.                             |
| `assets/brand/lockup-stacked.svg`    | Mark above wordmark.                                       |

The favicon glyph is a separate drawing, not a scaled copy: it carries a heavier stroke
and a larger hub to buy ink at small sizes, and a shorter arc span so the fattened round
caps don't swallow the gaps that carry the rotation.

## Clear space and minimum size

- **Clear space** — leave the hub diameter (14% of the mark's width) free on all sides.
- **≥24px** — use `icon.svg`.
- **16–24px** — use `favicon.svg`. Verified legible at 16px.
- **<16px** — don't. The gaps close and the rotation is lost.

## Palette

| Token            | Hex       | HSL                | Role                                |
| ---------------- | --------- | ------------------ | ----------------------------------- |
| `--ink`          | `#14A8BD` | `hsl(187 81% 41%)` | The mark. Brand teal.               |
| `--ink-deep`     | `#0B6B79` | `hsl(188 83% 26%)` | Teal for **text on light** grounds. |
| `--ink-bright`   | `#2BC0D4` | `hsl(187 66% 50%)` | Teal for **text on dark** grounds.  |
| `--ground-dark`  | `#0E1416` | `hsl(195 22% 7%)`  | Dark ground.                        |
| `--ground-light` | `#F7FAFB` | `hsl(195 33% 98%)` | Light ground.                       |
| `--neutral-700`  | `#33474B` | `hsl(190 19% 25%)` | Body text on light.                 |
| `--neutral-400`  | `#7D9498` | `hsl(189 12% 54%)` | Secondary text on dark.             |

The neutrals carry a deliberate teal bias rather than being pure grey, so they read as
chosen alongside the mark rather than inherited.

### Contrast (WCAG 2.1, computed)

| Foreground      | Ground           | Ratio     | Verdict        |
| --------------- | ---------------- | --------- | -------------- |
| `--ink`         | `--ground-light` | `2.72:1`  | **fails text** |
| `--ink`         | `--ground-dark`  | `6.52:1`  | AA text        |
| `--ink-deep`    | `--ground-light` | `5.90:1`  | AA text        |
| `--ink-bright`  | `--ground-dark`  | `8.49:1`  | AAA text       |
| `--neutral-700` | `--ground-light` | `9.34:1`  | AAA text       |
| `--neutral-400` | `--ground-dark`  | `5.80:1`  | AA text        |
| `--ground-dark` | `--ground-light` | `17.71:1` | AAA text       |

`--ink` on a light ground is the one number to remember. At 2.72:1 it is fine for **the
mark** — WCAG exempts logotypes from contrast minimums — but it must never carry text or
UI state on white. Reach for `--ink-deep` there.

Note that `--ink-deep` and `--ink-bright` differ from `--ink` mainly in **lightness**, not
hue. That is deliberate: lightness contrast survives colour vision deficiency, hue
contrast does not.

## Type

| Role      | Face              | Why                                                                                                                                      |
| --------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Headings  | **Archivo**       | A grotesque with real width and a condensed sibling — carries a heading without shouting, and its closed apertures echo the mark's arcs. |
| Body      | **IBM Plex Sans** | Humanist, unfussy, and genuinely good at small sizes where most technical prose lives.                                                   |
| Data / UI | **IBM Plex Mono** | The project's own voice. A CLI's docs should set its commands in the face you actually see in the terminal.                              |

## Do and don't

- **Do** use `icon-mono.svg` and set `color` on the container when the mark sits on a
  coloured ground. One file, any ink.
- **Don't** recolour the mark outside the palette, and don't add a background tile — it is
  transparent by design and tuned for both grounds.
- **Don't** rotate the mark. At 30° the gaps become mirror-symmetric about the vertical
  axis and it stops reading as a rotor and starts reading as a standing figure. This was
  tested, not assumed.
- **Don't** shrink `icon.svg` past 24px. Switch to `favicon.svg`, which was drawn for it.
- **Don't** set `--ink` as text on white. See the contrast table.
