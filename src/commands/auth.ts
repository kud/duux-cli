import inquirer from "inquirer"
import ora from "ora"
import chalk from "chalk"
import { requestLoginCode, exchangeLoginCode, readAuthMeta } from "@kud/duux"

// The passwordless flow: request a one-time code by email, then exchange it
// for a token pair. @kud/duux handles the OAuth2/PKCE mechanics and persists
// the result (Keychain for the tokens, config.json for the account/expiry) —
// this file is only the interactive shell around it.
const auth = async (): Promise<void> => {
  const existing = readAuthMeta()
  if (existing) {
    const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
      {
        type: "confirm",
        name: "proceed",
        message: `Already signed in as ${existing.account}. Sign in again?`,
        default: false,
      },
    ])
    if (!proceed) return
  }

  const { email } = await inquirer.prompt<{ email: string }>([
    { type: "input", name: "email", message: "Duux account email:" },
  ])

  const requestSpinner = ora("Requesting a login code…").start()
  const result = await requestLoginCode(email).catch((error: Error) => {
    requestSpinner.fail(error.message)
    ;(error as { handled?: boolean }).handled = true
    throw error
  })

  if (!result.success) {
    requestSpinner.fail(result.message || "Duux rejected that email address.")
    return
  }
  requestSpinner.succeed(`Login code sent to ${email}.`)

  const { code } = await inquirer.prompt<{ code: string }>([
    { type: "input", name: "code", message: "Code from the email:" },
  ])

  const exchangeSpinner = ora("Signing in…").start()
  await exchangeLoginCode(code).catch((error: Error) => {
    exchangeSpinner.fail(error.message)
    ;(error as { handled?: boolean }).handled = true
    throw error
  })
  exchangeSpinner.succeed("Signed in.")

  process.stdout.write(
    chalk.gray("Run `duux discover` to find and select your fan.\n"),
  )
}

export { auth }
