import chalk from "chalk"
import { getStatus, getCurrentDevice, CONFIG_PATH } from "@kud/duux"
import { localTransport } from "../lib/transport.js"
import { FAN_PARAMS } from "../lib/params.js"
import { explainError } from "../lib/errors.js"

const header = () => `${chalk.bold("Duux")}${chalk.dim(" · status")}\n\n`

const label = (name: string, value: string, marker = "") =>
  `  ${chalk.gray(name.padEnd(15))}${value}${marker ? ` ${marker}` : ""}\n`

const HOROSC_LABELS = FAN_PARAMS.horosc.labels ?? []
const VEROSC_LABELS = FAN_PARAMS.verosc.labels ?? []

const ok = chalk.green("●")
const fail = chalk.red("●")

// on/off, connected/not, and every enum value below are rendered as plain
// words, never colour-only — colour reinforces the glyph, it never carries
// the meaning by itself.
const boolLabel = (value: boolean | null): string =>
  value === null ? "unknown" : value ? "on" : "off"

// Oscillation is a sweep angle, so report the angle — "preset 1" says nothing
// the fan actually does. Labels mirror src/lib/params.ts.
const sweepLabel = (value: number | null, labels: readonly string[]): string =>
  value === null ? "unknown" : (labels[value] ?? String(value))

const status = async (): Promise<void> => {
  process.stdout.write(header())

  const device = getCurrentDevice()
  if (!device) {
    process.stdout.write(label("Status", "no fan selected", fail))
    process.stdout.write(
      label("Next", "run `duux discover` to find and select a fan"),
    )
    process.exitCode = 1
    return
  }

  process.stdout.write(label("Fan", device.displayName))

  try {
    const fan = await getStatus(localTransport())
    process.stdout.write(label("Connection", "reachable", ok))
    process.stdout.write(label("Power", boolLabel(fan.power)))
    process.stdout.write(label("Speed", fan.speed === null ? "unknown" : `${fan.speed}/30`))
    process.stdout.write(label("Mode", fan.mode ?? "unknown"))
    process.stdout.write(label("H-oscillation", sweepLabel(fan.horosc, HOROSC_LABELS)))
    process.stdout.write(label("V-oscillation", sweepLabel(fan.verosc, VEROSC_LABELS)))
    process.stdout.write(label("Night mode", boolLabel(fan.night)))
    process.stdout.write(label("Child lock", boolLabel(fan.lock)))
    process.stdout.write(
      label("Timer", fan.timer ? `${fan.timer}h` : "off"),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const [reason, ...guidance] = explainError(message).split("\n")
    process.stdout.write(label("Connection", reason ?? message, fail))
    for (const hint of guidance) {
      process.stdout.write(`  ${chalk.yellow(hint)}\n`)
    }
    process.stdout.write(
      label("Config", CONFIG_PATH, chalk.gray("(store location)")),
    )
    process.exitCode = 1
  }
}

export { status }
