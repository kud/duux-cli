import chalk from "chalk"
import inquirer from "inquirer"
import { readBroker, writeBroker, DEFAULT_PORT } from "../lib/broker.js"
import { CA_PATH, CONF_PATH } from "../lib/broker-paths.js"
import {
  detectLanAddress,
  hasMosquitto,
  generateCertificate,
  writeBrokerConfig,
  certificateExists,
  DUUX_HOST,
} from "../lib/broker-setup.js"

const show = (): void => {
  const broker = readBroker()
  if (!broker) {
    process.stdout.write(
      `${chalk.gray("○")} No local broker — using the Duux cloud.\n\n` +
        chalk.gray(
          "  Duux's cloud refuses fan control on most accounts. Running a broker on\n" +
            "  your own network gets round that entirely.\n\n",
        ) +
        `  Run ${chalk.cyan("duux broker setup")} to get started.\n`,
    )
    return
  }
  process.stdout.write(
    `${chalk.green("●")} Local broker ${chalk.cyan(`${broker.host}:${broker.port}`)}\n` +
      chalk.gray(`  certificate: ${CA_PATH}\n`) +
      `\n  Run ${chalk.cyan("duux broker check")} to test it end to end.\n`,
  )
}

const setup = async (): Promise<void> => {
  process.stdout.write(
    `${chalk.bold("Duux")}${chalk.dim(" · broker setup")}\n\n`,
  )
  process.stdout.write(
    chalk.gray(
      "  Duux's cloud refuses fan control on most accounts. Your fan connects out\n" +
        `  to ${DUUX_HOST} — so if you run a broker here and point\n` +
        "  that name at this machine, the fan talks to you instead.\n\n",
    ),
  )

  const detected = detectLanAddress()
  const { address } = await inquirer.prompt<{ address: string }>([
    {
      type: "input",
      name: "address",
      message: "This machine's address on your network:",
      default: detected ?? undefined,
      validate: (value: string) =>
        /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim()) || "Enter an IPv4 address",
    },
  ])

  const { portInput } = await inquirer.prompt<{ portInput: string }>([
    {
      type: "input",
      name: "portInput",
      message: "Port the fan connects on:",
      default: String(DEFAULT_PORT),
      validate: (value: string) => {
        const parsed = Number(value.trim())
        return (
          (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) ||
          "Enter a port between 1 and 65535"
        )
      },
    },
  ])
  const port = Number(portInput.trim())

  if (certificateExists()) {
    const { regenerate } = await inquirer.prompt<{ regenerate: boolean }>([
      {
        type: "confirm",
        name: "regenerate",
        message:
          "Replace the existing certificate? Only needed if this machine's address changed",
        default: false,
      },
    ])
    if (regenerate) generateCertificate(address.trim())
  } else {
    generateCertificate(address.trim())
  }

  writeBrokerConfig(port)
  writeBroker({ host: address.trim(), port })

  process.stdout.write(`\n${chalk.green("✔ Ready.")} Three steps left:\n\n`)

  process.stdout.write(
    `  ${chalk.bold("1.")} Start the broker\n` +
      (hasMosquitto() ? "" : chalk.gray("     brew install mosquitto\n")) +
      chalk.cyan(`     sudo mosquitto -c ${CONF_PATH} -v\n`) +
      chalk.gray(`     (sudo only because ${port} is a privileged port)\n\n`),
  )

  process.stdout.write(
    `  ${chalk.bold("2.")} Redirect the hostname on your router, Pi-hole or AdGuard\n` +
      chalk.cyan(`     ${DUUX_HOST}  →  ${address.trim()}\n`) +
      chalk.gray(
        "     This must apply to the fan's DNS, not just this Mac.\n\n",
      ),
  )

  process.stdout.write(
    `  ${chalk.bold("3.")} Power-cycle the fan\n` +
      chalk.gray(
        "     It only looks the hostname up when it connects. Unplug it, wait,\n" +
          "     plug it back in.\n\n",
      ),
  )

  process.stdout.write(`Then run ${chalk.cyan("duux broker check")}.\n`)
}

const setHost = (target: string, opts: { port?: string }): void => {
  const port = opts.port ? Number(opts.port) : DEFAULT_PORT
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    process.stderr.write(
      `${chalk.red("error:")} Invalid port "${opts.port}".\n`,
    )
    process.exitCode = 1
    return
  }
  writeBroker({ host: target, port })
  process.stdout.write(chalk.green(`✔ Local broker set to ${target}:${port}\n`))
}

const clear = (): void => {
  writeBroker(null)
  process.stdout.write(
    chalk.green("✔ Local broker cleared — back to the Duux cloud.\n"),
  )
}

export { show, setup, setHost, clear }
