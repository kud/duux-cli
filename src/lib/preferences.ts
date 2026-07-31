import { readPreferences, writePreferences } from "@kud/duux"

// Icon style is a TUI-only concern, so it lives in the CLI — a typed view
// over @kud/duux's opaque preferences bag, not part of the headless core.
type IconStyle = "nerd" | "text"

const DEFAULT_ICON_STYLE: IconStyle = "text"
const ICON_STYLES: IconStyle[] = ["text", "nerd"]

const isIconStyle = (value: unknown): value is IconStyle =>
  typeof value === "string" && ICON_STYLES.includes(value as IconStyle)

const readIconStyle = (): IconStyle => {
  const stored = readPreferences()["iconStyle"]
  return isIconStyle(stored) ? stored : DEFAULT_ICON_STYLE
}

const writeIconStyle = (iconStyle: IconStyle): void => {
  writePreferences({ iconStyle })
}

export { readIconStyle, writeIconStyle, DEFAULT_ICON_STYLE, ICON_STYLES }
export type { IconStyle }
