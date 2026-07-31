import chalk from "chalk"
import { sendCommand, getStatus } from "@kud/duux"

// Raw command passthrough — sendCommand() takes the already-built "tune set
// <param> <value>" string directly, bypassing @kud/duux's typed builders
// (commands.ts) entirely. That is the point: it is the one place able to
// send a value the typed builders would reject (e.g. `tune set horosc 3`),
// which is exactly what is needed to verify the API spec's open questions —
// whether horosc/verosc are really booleans, and the full `mode`
// enumeration — against a physical fan. A status readback follows so the
// fan's own response to the raw command is visible immediately.
const debug = async (command: string): Promise<void> => {
  process.stdout.write(chalk.gray(`→ ${command}\n`))

  await sendCommand(command)
  process.stdout.write(chalk.green("✔ sent\n\n"))

  const fan = await getStatus()
  process.stdout.write(chalk.bold("Fan reports:\n"))
  process.stdout.write(`${JSON.stringify(fan, null, 2)}\n`)
}

export { debug }
