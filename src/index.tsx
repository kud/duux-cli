#!/usr/bin/env node
import { readFileSync } from "node:fs"
import { Command } from "commander"
import { render } from "ink"
import React from "react"
import chalk from "chalk"
import inquirer from "inquirer"
import { readAuthMeta, getCurrentDevice } from "@kud/duux"
import { App } from "./app.js"
import { auth } from "./commands/auth.js"
import { discover } from "./commands/discover.js"
import { status } from "./commands/status.js"
import { debug } from "./commands/debug.js"
import { switchDevice, listPairedDevices } from "./commands/devices.js"
import { prefs } from "./commands/prefs.js"
import { broker } from "./commands/broker.js"

// Read the version from package.json so the CLI never drifts from the release.
// Resolves from both src/ (dev) and dist/ (published) — each is one level under root.
const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string }

const program = new Command()
  .name("duux")
  .description("Control your Duux Whisper Flex 2 smart fan")
  .version(version)

program
  .command("auth")
  .alias("login")
  .description("Sign in to Duux (passwordless email code)")
  .action(auth)

program
  .command("discover")
  .description("Fetch known fans from the Duux cloud and save them")
  .option("-s, --select", "Select and save a fan as active")
  .action(async (opts: { select?: boolean }) => {
    await discover({ select: opts.select })
  })

program
  .command("devices")
  .description("List known fans")
  .action(listPairedDevices)

program
  .command("switch")
  .argument("[device]", "Fan name or id to make active")
  .description("Switch the active fan")
  .action(switchDevice)

program
  .command("status")
  .description("Show the current fan's state")
  .action(status)

program
  .command("prefs")
  .description("Edit preferences: icon style")
  .action(prefs)

program
  .command("broker")
  .argument("[host]", 'Broker host, or "clear" to go back to the cloud')
  .option("-p, --port <port>", "Broker port", "443")
  .description("Show or set the local MQTT broker used to reach the fan")
  .action((host: string | undefined, opts: { port?: string }) => {
    broker(host, opts)
  })

program
  .command("debug")
  .argument("<command>", 'Raw command, e.g. "tune set horosc 3"')
  .description("Send a raw command to the current fan and print its state")
  .action(debug)

const ensureReady = async (): Promise<boolean> => {
  if (!readAuthMeta()) {
    const { shouldAuth } = await inquirer.prompt<{ shouldAuth: boolean }>([
      {
        type: "confirm",
        name: "shouldAuth",
        message: "Not signed in to Duux yet. Sign in now?",
        default: true,
      },
    ])
    if (!shouldAuth) return false
    await auth()
    if (!readAuthMeta()) return false
  }

  if (!getCurrentDevice()) {
    const { shouldDiscover } = await inquirer.prompt<{
      shouldDiscover: boolean
    }>([
      {
        type: "confirm",
        name: "shouldDiscover",
        message: "No fan selected yet. Discover fans now?",
        default: true,
      },
    ])
    if (!shouldDiscover) return false
    await discover({ select: true })
    if (!getCurrentDevice()) return false
  }

  return true
}

const run = async (): Promise<void> => {
  if (process.argv.length <= 2) {
    if (!(await ensureReady())) process.exit(0)
    render(<App />, { alternateScreen: true })
  } else {
    await program.parseAsync(process.argv)
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  // Commands that already reported the failure (e.g. auth, via its spinner)
  // mark it handled; everything else prints one clean line, never a stack trace.
  const alreadyShown =
    error instanceof Error && (error as { handled?: boolean }).handled
  if (!alreadyShown) process.stderr.write(chalk.red(`error: ${message}\n`))
  process.exit(1)
})
