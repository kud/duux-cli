import { readAuthMeta, readToken } from "@kud/duux"

// @kud/duux's own access-token resolution (context.ts's getAccessToken) is
// deliberately not part of its public surface — sendCommand/getStatus/
// createSession resolve it internally, so most callers never need this.
// discovery.ts's discover() is the one exception: it is a *pure* function
// that takes an accessToken argument rather than resolving one itself, and
// the CLI's `discover` command has no other way to obtain that token than
// by composing the two primitives config.ts and keychain.ts do export
// (readAuthMeta, readToken). This mirrors context.ts's logic rather than
// reimplementing auth — no request is made, no token is generated, it only
// reads what login already stored. See the scaffold report: @kud/duux
// exporting getAccessToken (or discover() resolving it internally the way
// getStatus() does) would remove the need for this file entirely.
const getStoredAccessToken = (): string => {
  const authMeta = readAuthMeta()
  if (!authMeta)
    throw new Error("Not signed in to Duux. Run `duux auth` first.")

  const token = readToken(authMeta.account)
  if (!token) {
    throw new Error(
      `No Duux credentials found in the Keychain for ${authMeta.account}. Run \`duux auth\` again.`,
    )
  }

  if (Date.now() >= authMeta.expiresAt) {
    throw new Error("Duux session has expired. Run `duux auth` again.")
  }

  return token.accessToken
}

export { getStoredAccessToken }
