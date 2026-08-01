import { FAN_MODE_VALUES, type FanMode } from "@kud/duux"

// Single source of truth the whole TUI reads from, instead of literals
// scattered across components. @kud/duux does not (yet) export a command
// metadata table — mode is genuinely driven by its FAN_MODE_VALUES export,
// but speed/timer ranges and the horosc/verosc boolean assumption are not
// exported anywhere in the core, so they are pinned here as the one place
// to widen when they're confirmed against a physical fan. See each
// param's comment for what is verified versus assumed.

type RangeParam = {
  kind: "range"
  min: number
  max: number
  step: number
  bigStep: number
  // Human labels per position, where the number alone says nothing. The
  // oscillation presets are sweep angles — "60°" is what the fan does, "2 of
  // 3" is only where it sits in a list.
  labels?: readonly string[]
}

type BooleanParam = { kind: "boolean" }

type EnumParam<T extends string> = { kind: "enum"; options: readonly T[] }

type FanParam = RangeParam | BooleanParam | EnumParam<FanMode>

// Speed: confirmed 1-30 by the API spec and pinned by @kud/duux's own
// speedCommand RangeError — the one range value that is actually verified.
const SPEED: RangeParam = {
  kind: "range",
  min: 1,
  max: 30,
  step: 1,
  bigStep: 5,
}

// Mode: driven entirely by the core's own enumeration. Widening FAN_MODE_VALUES
// in @kud/duux is a one-line change that flows through here with no edit needed.
const MODE: EnumParam<FanMode> = {
  kind: "enum",
  options: Object.keys(FAN_MODE_VALUES) as FanMode[],
}

// Horizontal oscillation ("horosc"): a four-position sweep-angle preset, 0
// (off) to 3 — confirmed against the Home Assistant integrations built on the
// same MQTT protocol, and enforced by @kud/duux's horoscCommand RangeError.
// This was modelled as a boolean until that confirmation arrived, which threw
// away presets 2 and 3.
const HOROSC: RangeParam = {
  kind: "range",
  min: 0,
  max: 3,
  step: 1,
  bigStep: 3,
  labels: ["off", "30°", "60°", "90°"],
}

// Vertical oscillation ("verosc"): a three-position tilt preset, 0 (off) /
// 1 (45°) / 2 (100°). Confirmed the same way as horosc, and corroborated by a
// real state payload reporting it as an integer.
const VEROSC: RangeParam = {
  kind: "range",
  min: 0,
  max: 2,
  step: 1,
  bigStep: 2,
  labels: ["off", "45°", "100°"],
}

const NIGHT: BooleanParam = { kind: "boolean" }
const LOCK: BooleanParam = { kind: "boolean" }

// Timer: the API spec gives no upper bound, only "hours" as a non-negative
// integer. 24 is an unverified UI ceiling, not a value the API rejects above
// — confirm the fan's real maximum and adjust here.
const TIMER: RangeParam = {
  kind: "range",
  min: 0,
  max: 24,
  step: 1,
  bigStep: 3,
}

const FAN_PARAMS = {
  power: { kind: "boolean" } satisfies BooleanParam,
  speed: SPEED,
  mode: MODE,
  horosc: HOROSC,
  verosc: VEROSC,
  night: NIGHT,
  lock: LOCK,
  timer: TIMER,
} as const

type FanParamKey = keyof typeof FAN_PARAMS

const clampRange = (param: RangeParam, value: number): number =>
  Math.min(param.max, Math.max(param.min, value))

export { FAN_PARAMS, clampRange }
export type { FanParam, RangeParam, BooleanParam, EnumParam, FanParamKey }
