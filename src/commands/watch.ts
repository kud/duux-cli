import chalk from "chalk"
import { createSession, getCurrentDevice, type FanState } from "@kud/duux"
import { localTransport } from "../lib/transport.js"

// Only the fields that changed, so a watcher's output is a log of events
// rather than a repeated dump of everything.
const diff = (
  before: FanState | null,
  after: FanState,
): Array<[string, unknown]> => {
  if (!before) return [["connected", true]]
  return (Object.keys(after) as Array<keyof FanState>)
    .filter((key) => key !== "sensor")
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .map((key) => [key, after[key]])
}

const format = (value: unknown): string =>
  typeof value === "boolean" ? (value ? "on" : "off") : String(value)

const watch = async (opts: { json?: boolean } = {}): Promise<void> => {
  const device = getCurrentDevice()
  if (!device) {
    process.stderr.write(
      `${chalk.red("error:")} No fan selected. Run \`duux discover\`.\n`,
    )
    process.exitCode = 1
    return
  }

  if (!opts.json) {
    process.stdout.write(
      chalk.gray(`Watching ${device.displayName} — Ctrl-C to stop.\n\n`),
    )
  }

  let previous: FanState | null = null
  // The session's 30s default is right for a long-lived panel but useless for
  // a stream — a change made now would surface up to half a minute later.
  // Watching is explicitly an "I want to see it happen" mode, so it trades API
  // calls for latency.
  const session = createSession({
    transport: localTransport(),
    pollIntervalMs: 3_000,
  })

  session.on("change", (state) => {
    if (state.error && !opts.json) {
      process.stderr.write(chalk.red(`⚠ ${state.error}\n`))
      return
    }
    if (!state.fan) return

    const changes = diff(previous, state.fan)
    previous = state.fan
    if (changes.length === 0) return

    const at = new Date().toISOString()
    if (opts.json) {
      // One JSON object per line, so it can be piped straight into jq or read
      // incrementally by anything that consumes a stream.
      process.stdout.write(
        `${JSON.stringify({ at, device: device.displayName, changes: Object.fromEntries(changes) })}\n`,
      )
      return
    }

    for (const [key, value] of changes) {
      process.stdout.write(
        `${chalk.gray(at.slice(11, 19))}  ${chalk.cyan(key.padEnd(11))}${format(value)}\n`,
      )
    }
  })

  // Runs until interrupted; stop the session so the poll timer doesn't keep
  // the process alive after Ctrl-C.
  process.on("SIGINT", () => {
    session.stop()
    process.exit(0)
  })

  await new Promise(() => {})
}

export { watch }
