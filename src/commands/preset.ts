import chalk from "chalk"
import { getStatus, sendCommand } from "@kud/duux"
import {
  powerCommand,
  speedCommand,
  modeCommand,
  horizontalOscillationCommand,
  verticalOscillationCommand,
  nightModeCommand,
  childLockCommand,
  timerCommand,
} from "@kud/duux"
import { localTransport } from "../lib/transport.js"
import {
  allPresets,
  readPreset,
  writePreset,
  isBuiltIn,
  type Preset,
} from "../lib/presets.js"

// Ordered so the fan is powered on before anything is set on it, and the timer
// is last — setting a timer on a fan that is about to be reconfigured would
// start counting against the wrong state.
const COMMANDS: Array<[keyof Preset, (preset: Preset) => string | null]> = [
  ["power", (p) => (p.power === undefined ? null : powerCommand(p.power))],
  ["mode", (p) => (p.mode === undefined ? null : modeCommand(p.mode))],
  ["speed", (p) => (p.speed === undefined ? null : speedCommand(p.speed))],
  [
    "horosc",
    (p) =>
      p.horosc === undefined ? null : horizontalOscillationCommand(p.horosc),
  ],
  [
    "verosc",
    (p) =>
      p.verosc === undefined ? null : verticalOscillationCommand(p.verosc),
  ],
  ["night", (p) => (p.night === undefined ? null : nightModeCommand(p.night))],
  ["lock", (p) => (p.lock === undefined ? null : childLockCommand(p.lock))],
  ["timer", (p) => (p.timer === undefined ? null : timerCommand(p.timer))],
]

const describe = (preset: Preset): string =>
  Object.entries(preset)
    .map(([key, value]) => `${key} ${value}`)
    .join(", ")

const list = (): void => {
  const presets = allPresets()
  process.stdout.write(`${chalk.bold("Duux")}${chalk.dim(" · presets")}\n\n`)
  for (const [name, preset] of Object.entries(presets)) {
    const origin = isBuiltIn(name) ? "" : chalk.gray(" (yours)")
    process.stdout.write(
      `  ${chalk.cyan(name.padEnd(10))}${chalk.gray(describe(preset))}${origin}\n`,
    )
  }
  process.stdout.write(
    chalk.gray(
      `\n  duux preset <name>            apply one\n` +
        `  duux preset save <name>       save the fan's current state as a preset\n` +
        `  duux preset delete <name>     remove one you saved\n`,
    ),
  )
}

const apply = async (name: string): Promise<void> => {
  const preset = readPreset(name)
  if (!preset) {
    process.stderr.write(
      `${chalk.red("error:")} No preset named "${name}".\n` +
        chalk.gray("Run `duux preset list` to see what exists.\n"),
    )
    process.exitCode = 1
    return
  }

  const transport = localTransport()
  for (const [, build] of COMMANDS) {
    const command = build(preset)
    if (command) await sendCommand(command, transport)
  }

  process.stdout.write(
    chalk.green(`✔ Applied ${name}`) + chalk.gray(` — ${describe(preset)}\n`),
  )
}

// Capturing the fan's current state is the natural way to build a preset: get
// it how you want it by hand, then name it.
const save = async (name: string): Promise<void> => {
  if (isBuiltIn(name)) {
    process.stderr.write(
      `${chalk.red("error:")} "${name}" is a built-in preset name. Pick another.\n`,
    )
    process.exitCode = 1
    return
  }

  const fan = await getStatus(localTransport())
  const preset: Preset = {
    ...(fan.power !== null && { power: fan.power }),
    ...(fan.speed !== null && { speed: fan.speed }),
    ...(fan.mode !== null && { mode: fan.mode }),
    ...(fan.horosc !== null && { horosc: fan.horosc }),
    ...(fan.verosc !== null && { verosc: fan.verosc }),
    ...(fan.night !== null && { night: fan.night }),
    ...(fan.lock !== null && { lock: fan.lock }),
    ...(fan.timer !== null && { timer: fan.timer }),
  }

  writePreset(name, preset)
  process.stdout.write(
    chalk.green(`✔ Saved ${name}`) + chalk.gray(` — ${describe(preset)}\n`),
  )
}

const remove = (name: string): void => {
  if (isBuiltIn(name)) {
    process.stderr.write(
      `${chalk.red("error:")} "${name}" is built in and cannot be deleted.\n`,
    )
    process.exitCode = 1
    return
  }
  if (!readPreset(name)) {
    process.stderr.write(`${chalk.red("error:")} No preset named "${name}".\n`)
    process.exitCode = 1
    return
  }
  writePreset(name, null)
  process.stdout.write(chalk.green(`✔ Deleted ${name}\n`))
}

export { list, apply, save, remove }
