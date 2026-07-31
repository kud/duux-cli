import type { IconStyle } from "./preferences.js"

// Nerd Font glyphs are written as \u{} escapes so raw PUA bytes never end up
// in source (editors and diff tools silently mangle them).
const ICONS: Record<string, string> = {
  power: "\u{f011}",
  // U+F72E rendered as a missing-glyph box on a current Nerd Font; U+F0E7 is
  // plain Font Awesome and present in every build. Prefer the FA range here —
  // the higher Material/Octicon planes are the ones that come and go between
  // Nerd Font releases.
  speed: "\u{f0e7}",
  mode: "\u{f085}",
  horosc: "\u{f021}",
  verosc: "\u{f021}",
  night: "\u{f186}",
  timer: "\u{f017}",
  settings: "\u{f013}",
  connected: "\u{f00c}",
  disconnected: "\u{f00d}",
}

const iconFor = (action: string, style: IconStyle): string =>
  style === "text" ? "" : (ICONS[action] ?? "")

export { iconFor }
