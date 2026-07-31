import chalk from "chalk"
import inquirer from "inquirer"
import {
  findDevice,
  getCurrentDevice,
  listDevices,
  setCurrentDevice,
  type Device,
} from "@kud/duux"

// Current vs not is marked by glyph (● filled vs ○ hollow) plus the literal
// word "(current)" — colour alone never carries the distinction (kud is
// colourblind).
const deviceLabel = (device: Device, isCurrent: boolean): string => {
  const marker = isCurrent ? chalk.green("●") : chalk.gray("○")
  const suffix = isCurrent ? chalk.green(" (current)") : ""
  return `${marker} ${device.displayName}${suffix}`
}

const listPairedDevices = (): void => {
  const devices = listDevices()

  if (devices.length === 0) {
    process.stdout.write(
      chalk.yellow("No fans known yet. Run `duux discover`.\n"),
    )
    return
  }

  const current = getCurrentDevice()
  for (const device of devices) {
    process.stdout.write(`${deviceLabel(device, device.id === current?.id)}\n`)
  }
}

const switchDevice = async (target?: string): Promise<void> => {
  const devices = listDevices()

  if (devices.length === 0) {
    process.stdout.write(
      chalk.yellow("No fans known yet. Run `duux discover`.\n"),
    )
    return
  }

  if (target) {
    const match = findDevice(target)
    if (!match) {
      process.stderr.write(
        `${chalk.red("error:")} No known fan matches "${target}".\n`,
      )
      listPairedDevices()
      process.exitCode = 1
      return
    }
    setCurrentDevice(match.id)
    process.stdout.write(
      chalk.green(`✔ Active fan set to ${match.displayName}\n`),
    )
    return
  }

  const current = getCurrentDevice()

  if (devices.length === 1) {
    process.stdout.write(
      `Only one fan known: ${deviceLabel(devices[0]!, true)}\n`,
    )
    return
  }

  const { id } = await inquirer.prompt<{ id: number }>([
    {
      type: "list",
      name: "id",
      message: "Switch to which fan?",
      default: current?.id,
      choices: devices.map((device) => ({
        name: deviceLabel(device, device.id === current?.id),
        value: device.id,
      })),
    },
  ])

  setCurrentDevice(id)
  const selected = devices.find((device) => device.id === id)!
  process.stdout.write(
    chalk.green(`✔ Active fan set to ${selected.displayName}\n`),
  )
}

export { switchDevice, listPairedDevices }
