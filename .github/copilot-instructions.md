# Copilot review instructions — duux-cli

## Project context

`@kud/duux-cli` is a terminal client for the Duux Whisper Flex 2 smart fan: an
Ink 7 TUI (`duux` with no args) plus commander subcommands (`auth`,
`discover`, `devices`, `switch`, `status`, `prefs`, `debug`). TypeScript,
ESM, Node >= 22, built with `tsup`.

All device logic — auth, discovery, cloud/MQTT transport, command encoding —
lives in the published core library `@kud/duux`. This repo is purely the
terminal surface over it: `src/lib/` wraps core calls for CLI use (see
`auth.ts`, `params.ts`), `src/hooks/use-session.ts` adapts the core's
framework-agnostic session into React state, `src/commands/` are the
commander entry points, and `src/components/` are the Ink views.

## Content rules

Flag deviations from these established patterns:

- **Arrow functions only.** `const fn = () => {}`, never `function fn() {}`
  declarations, and no classes anywhere in `src/`.
- **`const` over `let`.** Flag `let` where a ternary or a small helper would
  avoid the mutation.
- **Trailing `export { ... }` block.** Every file exports via a single
  `export { ... }` (and `export type { ... }`) block at the end of the file,
  never inline `export const` / `export function`. New files that export
  inline should be flagged.
- **Kebab-case lowercase filenames**, including `.tsx` components
  (`control-panel.tsx`, never `ControlPanel.tsx`). The exported identifier is
  PascalCase; the filename never is.
- **Source grouped by kind** — `src/components/` (Ink views), `src/lib/`
  (pure helpers / core-library wrappers), `src/hooks/` (React adapters over
  `@kud/duux`), `src/commands/` (commander entry points). Flag new files
  landing in the wrong bucket, or business logic creeping into a component
  that belongs in `src/lib/`.
- **`@kud/duux` is the only device-logic boundary.** Auth, discovery,
  transport, and command encoding belong in the core library, not
  reimplemented or duplicated in this repo. If a change appears to hand-roll
  something the core already owns (session state, token storage, command
  strings), flag it and suggest extending `@kud/duux` instead.
- **Accessibility — glyph plus word, never colour alone.** Every on/off,
  connected/disconnected, or enum state must render as a glyph (`●`/`○`) and
  a literal word, with colour only ever reinforcing — never the sole carrier
  of meaning (the maintainer is colourblind). This is a hard rule; see
  `src/commands/devices.ts` (`deviceLabel`) and `src/commands/status.ts`
  (`boolLabel`) for the pattern. Flag any new status/state rendering that
  relies on colour alone.
- **Nerd Font glyphs as `\u{...}` escapes**, never raw PUA bytes pasted into
  source — see `src/lib/icons.ts`. Raw glyph bytes are silently mangled by
  editors and diff tools.
- **Exact dependency versions in `package.json`** — no `^` or `~` ranges, in
  `dependencies`, `devDependencies`, or `overrides`.
- **Design-rationale comments only.** Comments that restate the code,
  narrate a diff, or label a code section should be flagged for removal.
  Comments explaining _why_ a non-obvious approach was chosen, especially
  where getting it wrong is a real hazard, are welcome — see the reference
  examples in `src/lib/params.ts` and `src/lib/auth.ts`.
- **Provisional/unverified values stay labelled.** `src/lib/params.ts` marks
  ranges that aren't confirmed against a physical fan (e.g. the horosc/verosc
  boolean assumption, the timer's 24h ceiling) as provisional in a comment.
  New unverified constants should carry the same kind of note rather than
  being presented as confirmed.

## Suppression rules

Stay quiet about:

- Missing tests or missing lint config — this repo has no test suite and no
  linter by design. Never suggest adding `npm test` or a lint script, and
  never flag a PR for lacking test coverage.
- Ink/React layout choices (`Box` props, `columnGap`, `flexDirection`) that
  are stylistic rather than incorrect — these are terminal-UI layout calls,
  not application logic.
- `inquirer` prompt boilerplate in `src/commands/` — this is standard
  interactive-CLI setup, not something to simplify.
- Verbose but intentional rationale comments matching the design-rationale
  pattern above, even if long — density is not the problem, absence of
  reasoning is.
- Style nits already enforced by `tsc` (e.g. type-only import placement) —
  the type checker catches these; don't duplicate it in prose.

## Review Format

Every comment must carry a risk label, explain why it matters in this
codebase specifically, and propose a concrete fix.

### Risk labels (required on every comment)

```
🔥 blocking:  — must fix before merge (correctness, security, data integrity)
🌶️ concern:   — should fix, not a blocker (reliability, maintainability)
🧊 nitpick:   — optional (style, naming, minor improvement)
```

### Comment structure (required format)

```
<risk-label>: <one-line summary of the issue>

<motivation sentence — why this matters in this codebase specifically, not just generically>

<concrete suggestion — what to do, not just what's wrong>
```

Example:

```
🌶️ concern: new speed indicator uses colour alone to show low/high

This repo has a hard accessibility rule — every state must be a glyph plus
a word, never colour alone, because the maintainer is colourblind (see
`boolLabel` in src/commands/status.ts).

Add a glyph or word alongside the colour, e.g. render `"● low"` /
`"● high"` instead of just tinting the number.
```

A comment that only states "this could be a problem" without the motivation
sentence or a concrete suggestion does not meet this format — the reviewer
should skip flagging rather than post a half-formed comment.
