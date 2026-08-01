import chalk from "chalk"
import {
  renameSensor,
  getCurrentDevice,
  upsertDevice,
  sensorLabel,
} from "@kud/duux"
import { getStoredAccessToken } from "../lib/auth.js"

// Renames the fan on Duux's side, so the change shows in the app too — this is
// the same edit the app's own rename makes. The local store is updated from the
// API's response rather than from what was asked for, so `duux devices` can
// never disagree with what Duux actually recorded.
const rename = async (name: string): Promise<void> => {
  const device = getCurrentDevice()
  if (!device) {
    process.stderr.write(
      `${chalk.red("error:")} No fan selected. Run \`duux discover\`.\n`,
    )
    process.exitCode = 1
    return
  }

  const trimmed = name.trim()
  if (!trimmed) {
    process.stderr.write(`${chalk.red("error:")} The name cannot be empty.\n`)
    process.exitCode = 1
    return
  }

  const previous = device.displayName
  const updated = await renameSensor(getStoredAccessToken(), device.id, trimmed)

  upsertDevice({
    id: updated.id,
    type: updated.type,
    displayName: sensorLabel(updated),
    mac: updated.deviceId,
  })

  process.stdout.write(
    chalk.green(`✔ Renamed ${previous} to ${sensorLabel(updated)}\n`),
  )
}

export { rename }
