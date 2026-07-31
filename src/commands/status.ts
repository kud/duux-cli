import chalk from "chalk"
import { getStatus, getCurrentDevice, CONFIG_PATH } from "@kud/duux"

const header = () => `${chalk.bold("Duux")}${chalk.dim(" · status")}\n\n`

const label = (name: string, value: string, marker = "") =>
  `  ${chalk.gray(name.padEnd(12))}${value}${marker ? ` ${marker}` : ""}\n`

const ok = chalk.green("●")
const fail = chalk.red("●")

// on/off, connected/not, and every enum value below are rendered as plain
// words, never colour-only — colour reinforces the glyph, it never carries
// the meaning by itself.
const boolLabel = (value: boolean | null): string =>
  value === null ? "unknown" : value ? "on" : "off"

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
    const fan = await getStatus()
    process.stdout.write(label("Connection", "reachable", ok))
    process.stdout.write(label("Power", boolLabel(fan.power)))
    process.stdout.write(label("Speed", `${fan.speed}/30`))
    process.stdout.write(label("Mode", fan.mode ?? "unknown"))
    process.stdout.write(label("H-oscillation", boolLabel(fan.swing)))
    process.stdout.write(label("V-oscillation", boolLabel(fan.tilt)))
    process.stdout.write(
      label("Timer", fan.timer > 0 ? `${fan.timer}h` : "off"),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stdout.write(label("Connection", message, fail))
    process.stdout.write(
      label("Config", CONFIG_PATH, chalk.gray("(store location)")),
    )
    process.exitCode = 1
  }
}

export { status }
