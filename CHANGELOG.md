# Changelog

All notable changes to this project are documented here.

---

## 0.4.0 — 2026-08-01

### Highlights

- **`duux status` and the interactive TUI now work.** Live state — power, speed, mode, both oscillation axes, night mode and timer — reads from your fan, and commands reach it. This never needed a local broker: `@kud/duux` was calling the wrong endpoints, sending commands to the numeric sensor id instead of the device's MAC address and looking for state at a path that doesn't serve it. Requires `@kud/duux@0.4.0`.
- **Night mode now shows its real state** instead of a permanent `n/a`. The library had documented it as impossible to read back; the fan reports it.
- **Vertical oscillation is an adjustable 0–2 preset** (off / 45° / 100°), matching horizontal's 0–3. It was a toggle, which made two of its three positions unreachable.

### Fixes

- **A configured local broker no longer hangs the CLI.** With a broker set but not serving your fan, `duux status` blocked indefinitely printing nothing at all — it now fails after ten seconds saying which topic it waited on.
- Discovery records each fan's MAC address, which is what commands are addressed by. Fans saved before this are detected and prompt you to run `duux discover` again rather than failing obscurely.
- Fixed the `status` label column being too narrow, which ran "H-oscillation" straight into its value.

Note the local broker remains supported and documented for running without the cloud entirely — it is now an option rather than a requirement.

---

## 0.3.1 — 2026-08-01

### Fixes

- **The generated Mosquitto config now starts.** Started with `sudo` to bind port 443, Mosquitto drops privileges to `nobody` by default, which cannot read the broker's private key — it sits at mode 600 inside your home directory, so the broker died on startup with an OpenSSL permission error. The config now drops to your own user instead, which keeps the key's permissions as tight as they were rather than loosening them to suit the daemon.

---

## 0.3.0 — 2026-08-01

### Highlights

- **`duux doctor` — one command that checks your whole setup.** Walks account, fan and control path in the order they actually depend on each other, then names the single next thing to fix rather than leaving you to work it out from a wall of output.

- **`duux broker setup` — guided setup for local control.** Detects your machine's network address, generates a TLS certificate for `collector3.cloudgarden.nl` (with the hostname correctly in its SAN list, so the CLI verifies it normally rather than bypassing the check), writes a Mosquitto config, and prints the three steps only you can do: start the broker, redirect the hostname on your router, power-cycle the fan. Previously all of this was manual.
- **`duux broker check` — diagnoses the whole path.** Walks the same chain the fan has to walk, in order — broker configured, certificate present, Mosquitto installed, broker reachable, DNS redirected — so the first failure shown is the thing actually blocking control rather than a downstream symptom.
- **New documentation page, "Local control"**, explaining why Duux's cloud refuses control, how MQTT and the DNS redirect work, and what to do when the fan doesn't connect.

### Fixes

- **The `Not_Allowed` error now tells you what to do about it.** Both `duux status` and the TUI previously showed the raw API refusal with no way forward; they now point at `duux broker setup`.
- **Cancelling a prompt with Ctrl-C exits quietly** instead of printing "User force closed the prompt" as an error.
- Replaced a shell-out for detecting Mosquitto with a plain PATH scan, removing a Node deprecation warning about passing arguments to a shell.

Also note the command surface changed shape: `duux broker <host>` is now `duux broker set <host>`, alongside the new `setup`, `check` and existing `clear`.

---

## 0.2.0 — 2026-07-31

### Highlights

- **New: `duux broker` — control the fan through a local MQTT broker.** Duux's cloud refuses control for most accounts (both the status and command endpoints answer `Not_Allowed`), and their own broker rejects any credentials obtainable from the API. The way through is to run an MQTT broker on your own network and redirect `collector3.cloudgarden.nl` to it by DNS — the fan is the client, so it connects to you instead of Duux, and no permission is needed from anyone. `duux broker <host>` points the CLI at it, `duux broker` shows the current setting, `duux broker clear` goes back to the cloud. When set, `duux status`, `duux debug` and the interactive TUI all route through it.
- **New: `plans/local-broker.md`** documents the full setup — a self-signed certificate (generated for you at `~/.config/duux/broker/`, with the hostname correctly in its SAN list), a Mosquitto config, the DNS redirect, and the power-cycle the fan needs to pick it up. It also lists the open protocol questions this unblocks.

---

## 0.1.3 — 2026-07-31

### Highlights

- **Horizontal oscillation is now a sweep-angle control, not a toggle.** The fan's `horosc` parameter takes four positions — 0 (off) through 3 — but the TUI modelled it as on/off, so presets 2 and 3 were unreachable. It's now an arrow-adjustable 0–3 range row, and `duux status` reports it as "sweep N of 3" instead of on/off. Requires `@kud/duux@0.3.0`.

### Fixes

- Fixed the Speed icon rendering as an empty box in Nerd Font mode. The glyph used (U+F72E) isn't present in current Nerd Font builds; it now uses the plain Font Awesome bolt (U+F0E7), which is.
- Fixed the status bar wrapping mid-phrase. A long error message stole width from the "last action" indicator, splitting it across two lines. The indicator now holds its width and long errors truncate instead.
- Range rows no longer collide with their values. The progress bar was wide enough that a row carrying the pending-change marker overflowed its panel, squashing the gaps and misaligning that row against the others. The bar is narrower and the marker shorter.

---

## 0.1.2 — 2026-07-31

### Fixes

- **`duux discover` works again.** It previously crashed for everyone with `Cannot read properties of undefined (reading 'find')`. The cause was in the core library, `@kud/duux`, which read the account's tenant from a v4 API field that no longer exists; discovery has since moved to the v5 API, which needs no tenant at all. Fixed by upgrading to `@kud/duux@0.2.0`.
- **Fans with no custom name now display correctly.** A Duux fan has no `displayName` until you rename it in the Duux app, and the CLI used to print nothing for those. It now falls back to the factory identifier (e.g. `DUUX.1.356505`) via the core's new `sensorLabel()` helper.
- **Failures from the Duux API are now reported instead of swallowed.** The API answers a refused request with HTTP 200 and the reason in the body, which the core previously read as success. `duux status` against a device the account can't read now says exactly that, naming the endpoint and the reason.
- Known limitation: live control (`duux status` and the interactive TUI) still doesn't work against Cloudgarden's cloud — it refuses status and command requests for this account with `Not_Allowed`, and the MQTT alternative needs broker credentials that aren't obtainable from the REST API. `discover`, `devices`, `switch`, and `prefs` all work.

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
