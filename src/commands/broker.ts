import chalk from "chalk"
import { readBroker, writeBroker, DEFAULT_PORT } from "../lib/broker.js"
import { CA_PATH } from "../lib/transport.js"

const show = (): void => {
  const broker = readBroker()
  if (!broker) {
    process.stdout.write(
      `${chalk.gray("○")} No local broker — using the Duux cloud.\n` +
        chalk.gray(
          "  The cloud refuses control for most accounts. Run `duux broker <host>` after\n" +
            "  setting one up; see plans/local-broker.md.\n",
        ),
    )
    return
  }
  process.stdout.write(
    `${chalk.green("●")} Local broker ${chalk.cyan(`${broker.host}:${broker.port}`)}\n` +
      chalk.gray(`  certificate: ${CA_PATH}\n`),
  )
}

const broker = (target?: string, opts: { port?: string } = {}): void => {
  if (!target) {
    show()
    return
  }

  if (target === "clear" || target === "off") {
    writeBroker(null)
    process.stdout.write(
      chalk.green("✔ Local broker cleared — back to the Duux cloud.\n"),
    )
    return
  }

  const port = opts.port ? Number(opts.port) : DEFAULT_PORT
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    process.stderr.write(
      `${chalk.red("error:")} Invalid port "${opts.port}".\n`,
    )
    process.exitCode = 1
    return
  }

  writeBroker({ host: target, port })
  process.stdout.write(
    chalk.green(`✔ Local broker set to ${target}:${port}\n`) +
      chalk.gray(
        `  Reading its certificate from ${CA_PATH}\n` +
          "  The fan must resolve collector3.cloudgarden.nl to this broker — see\n" +
          "  plans/local-broker.md — and be power-cycled afterwards.\n",
      ),
  )
}

export { broker }
