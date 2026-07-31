import ora from "ora"
import chalk from "chalk"
import inquirer from "inquirer"
import {
  discover as discoverFans,
  writeTenantId,
  upsertDevice,
  getCurrentDevice,
  type Discovered,
} from "@kud/duux"
import { getStoredAccessToken } from "../lib/auth.js"

// CLI driver around @kud/duux's pure discover(): adds the spinner, persists
// the tenant + fan list, and an optional picker when more than one fan is
// found. discover() itself never touches config.ts (see its own comment),
// so all persistence happens here.
const discover = async (
  opts: { select?: boolean } = {},
): Promise<Discovered> => {
  const spinner = ora("Looking up your Duux account…").start()

  const accessToken = getStoredAccessToken()
  const result = await discoverFans(accessToken).catch((error: Error) => {
    spinner.fail(error.message)
    ;(error as { handled?: boolean }).handled = true
    throw error
  })

  writeTenantId(result.tenantId)

  if (result.devices.length === 0) {
    spinner.warn("Signed in, but no fans are registered on this account.")
    return result
  }

  spinner.succeed(`Found ${result.devices.length} fan(s):`)
  for (const device of result.devices) {
    process.stdout.write(`  ${chalk.cyan(device.displayName)}\n`)
    upsertDevice(
      { id: device.id, type: device.type, displayName: device.displayName },
      { makeCurrent: false },
    )
  }

  if (getCurrentDevice()) return result

  const shouldPick = opts.select ?? result.devices.length === 1

  if (!shouldPick && result.devices.length > 1) {
    process.stdout.write(
      chalk.gray("Run `duux switch` to choose which fan is active.\n"),
    )
    return result
  }

  const selected =
    result.devices.length === 1
      ? result.devices[0]!
      : await inquirer
          .prompt<{ id: number }>([
            {
              type: "list",
              name: "id",
              message: "Which fan do you want to use?",
              choices: result.devices.map((device) => ({
                name: device.displayName,
                value: device.id,
              })),
            },
          ])
          .then(({ id }) => result.devices.find((device) => device.id === id)!)

  upsertDevice({
    id: selected.id,
    type: selected.type,
    displayName: selected.displayName,
  })
  process.stdout.write(
    chalk.green(`✔ Active fan set to ${selected.displayName}\n`),
  )

  return result
}

export { discover }
