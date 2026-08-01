import { readPreferences, writePreferences } from "@kud/duux"
import type { FanMode } from "@kud/duux"

// A named combination applied in one go. The Duux app has timers and schedules
// but no way to say "put the fan how I like it for sleeping" — this is the
// thing a CLI can offer that a phone app structurally can't, because it can be
// invoked by anything: a shell alias, a cron entry, a focus-mode hook.
type Preset = {
  power?: boolean
  speed?: number
  mode?: FanMode
  horosc?: number
  verosc?: number
  night?: boolean
  lock?: boolean
  timer?: number
}

const BUILT_IN: Record<string, Preset> = {
  sleep: {
    power: true,
    speed: 3,
    mode: "natural",
    night: true,
    horosc: 0,
    timer: 8,
  },
  quiet: { power: true, speed: 5, mode: "natural", night: false, horosc: 1 },
  boost: { power: true, speed: 30, mode: "normal", night: false, horosc: 2 },
  away: { power: false },
}

const isPreset = (value: unknown): value is Preset =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const customPresets = (): Record<string, Preset> => {
  const stored = readPreferences()["presets"]
  if (!isPreset(stored)) return {}
  return Object.fromEntries(
    Object.entries(stored as Record<string, unknown>).filter(([, preset]) =>
      isPreset(preset),
    ),
  ) as Record<string, Preset>
}

// Custom wins: a preset you defined yourself should override a built-in of the
// same name rather than being silently ignored.
const allPresets = (): Record<string, Preset> => ({
  ...BUILT_IN,
  ...customPresets(),
})

const readPreset = (name: string): Preset | null => allPresets()[name] ?? null

const writePreset = (name: string, preset: Preset | null): void => {
  const custom = customPresets()
  if (preset === null) delete custom[name]
  else custom[name] = preset
  writePreferences({ presets: custom })
}

const isBuiltIn = (name: string): boolean => name in BUILT_IN

export { allPresets, readPreset, writePreset, isBuiltIn, BUILT_IN }
export type { Preset }
