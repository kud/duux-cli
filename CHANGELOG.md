# Changelog

All notable changes to this project are documented here.

---

## 0.1.1 — 2026-07-31

### Highlights

- First release of duux-cli, a terminal control panel for the Duux Whisper Flex 2 smart fan — an interactive TUI for power, speed, mode, oscillation, night mode, and timer, plus passwordless sign-in, multi-fan switching, a scriptable `status` command, and a raw `debug` passthrough for probing undocumented parameters. ([359bdae](https://github.com/kud/duux-cli/commit/359bdaead58da38b361c5dc841c5c35b4803b1dd))
- Added the project's visual identity — an icon, favicon, mono and colour lockups, and a brand sheet — so duux-cli has a consistent mark across the README, npm, and the docs site. ([6f685ac](https://github.com/kud/duux-cli/commit/6f685ac95776086032a69151b4e0cad9dc2cb2bb))

### Fixes

- Holding an arrow key to ramp fan speed now actually ramps it. Previously every key press within one network round trip recalculated from the same stale reading from the fan, so holding the key nudged the speed by a single step instead of climbing steadily; the TUI now trusts your latest input over the fan's last reported state until it confirms, and the `(unconfirmed)` indicator now applies to every row awaiting confirmation, not just night mode. ([a4ba693](https://github.com/kud/duux-cli/commit/a4ba6932dc29da9d3b0644f34edf46c6180e3e51))

### Security

- Patched a low-severity esbuild advisory (arbitrary file read via the dev server on Windows) pulled in transitively through tsup, which needed an explicit `overrides` entry since tsup pins an esbuild range that excludes the fix. ([36fab8f](https://github.com/kud/duux-cli/commit/36fab8f6a922ca7982441a7d89c23b75f1ba0103))

<details>
<summary>Internal (3 commits)</summary>

- Added CI, licence, and README/docs scaffolding, and Copilot review instructions for the repo.

</details>

---
