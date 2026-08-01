// Nerd Font glyphs, written as \u{} escapes so raw PUA bytes never end up in
// source (editors and diff tools silently mangle them). Prefer the plain Font
// Awesome range: the higher Material and Octicon planes come and go between
// Nerd Font releases, and a glyph that is missing renders as an empty box.
const ICONS: Record<string, string> = {
  power: "\u{f011}",
  speed: "\u{f0e7}",
  mode: "\u{f085}",
  horosc: "\u{f021}",
  verosc: "\u{f021}",
  night: "\u{f186}",
  lock: "\u{f023}",
  timer: "\u{f017}",
}

const iconFor = (action: string): string => ICONS[action] ?? ""

export { iconFor }
