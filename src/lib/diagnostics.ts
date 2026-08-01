import { createConnection } from "node:net"
import { resolve4 } from "node:dns/promises"
import {
  readAuthMeta,
  readToken,
  listDevices,
  getCurrentDevice,
} from "@kud/duux"
import { readBroker } from "./broker.js"
import { CA_PATH, CONF_PATH } from "./broker-paths.js"
import { certificateExists, hasMosquitto, DUUX_HOST } from "./broker-setup.js"

type CheckState = "ok" | "warn" | "fail"

type Check = {
  label: string
  state: CheckState
  detail?: string
  // The command that resolves this check, shown as the next action when it is
  // the first thing failing.
  fix?: string
}

type Section = {
  title: string
  checks: Check[]
}

const accountChecks = (): Check[] => {
  const meta = readAuthMeta()
  if (!meta) {
    return [
      { label: "Signed in", state: "fail", fix: "duux auth" },
      { label: "Credentials", state: "fail", detail: "not signed in" },
    ]
  }

  const expired = Date.now() >= meta.expiresAt
  const token = readToken(meta.account)

  return [
    { label: "Signed in", state: "ok", detail: meta.account },
    token
      ? { label: "Credentials in Keychain", state: "ok" }
      : {
          label: "Credentials in Keychain",
          state: "fail",
          detail: "missing",
          fix: "duux auth",
        },
    expired
      ? {
          label: "Session valid",
          state: "fail",
          detail: "expired",
          fix: "duux auth",
        }
      : {
          label: "Session valid",
          state: "ok",
          detail: `until ${new Date(meta.expiresAt).toLocaleDateString()}`,
        },
  ]
}

const deviceChecks = (): Check[] => {
  const devices = listDevices()
  const current = getCurrentDevice()

  if (devices.length === 0) {
    return [
      {
        label: "Fans known",
        state: "fail",
        detail: "none",
        fix: "duux discover",
      },
    ]
  }

  return [
    { label: "Fans known", state: "ok", detail: `${devices.length}` },
    current
      ? { label: "Active fan", state: "ok", detail: current.displayName }
      : {
          label: "Active fan",
          state: "fail",
          detail: "none selected",
          fix: "duux switch",
        },
  ]
}

const canConnect = (host: string, port: number): Promise<boolean> =>
  new Promise((done) => {
    const socket = createConnection({ host, port, timeout: 3000 })
    const finish = (reachable: boolean) => {
      socket.destroy()
      done(reachable)
    }
    socket.on("connect", () => finish(true))
    socket.on("error", () => finish(false))
    socket.on("timeout", () => finish(false))
  })

// Ordered as the fan itself has to traverse them, so the first failure is the
// thing genuinely blocking control rather than a downstream symptom.
const brokerChecks = async (): Promise<Check[]> => {
  const broker = readBroker()

  if (!broker) {
    return [
      {
        label: "Control path",
        state: "ok",
        detail: "Duux cloud",
      },
    ]
  }

  const checks: Check[] = [
    {
      label: "Control path",
      state: "ok",
      detail: `local broker ${broker.host}:${broker.port}`,
    },
    certificateExists()
      ? { label: "Certificate", state: "ok", detail: CA_PATH }
      : {
          label: "Certificate",
          state: "fail",
          detail: "missing",
          fix: "duux broker setup",
        },
    hasMosquitto()
      ? { label: "Mosquitto installed", state: "ok" }
      : {
          label: "Mosquitto installed",
          state: "warn",
          detail: "not on PATH",
          fix: "brew install mosquitto",
        },
  ]

  const reachable = await canConnect(broker.host, broker.port)
  checks.push(
    reachable
      ? { label: "Broker reachable", state: "ok" }
      : {
          label: "Broker reachable",
          state: "fail",
          detail: "nothing listening",
          fix: `sudo mosquitto -c ${CONF_PATH} -v`,
        },
  )

  // The fan resolves this, not us — but if it doesn't point at the broker from
  // here either, the rewrite almost certainly isn't in place.
  try {
    const [address] = await resolve4(DUUX_HOST)
    checks.push(
      address === broker.host
        ? {
            label: "DNS redirect",
            state: "ok",
            detail: `${DUUX_HOST} → ${address}`,
          }
        : {
            label: "DNS redirect",
            state: "warn",
            detail: `points at ${address}, expected ${broker.host}`,
            fix: `add a DNS rewrite: ${DUUX_HOST} → ${broker.host}`,
          },
    )
  } catch {
    checks.push({
      label: "DNS redirect",
      state: "warn",
      detail: `cannot resolve ${DUUX_HOST}`,
    })
  }

  return checks
}

const fullDiagnosis = async (): Promise<Section[]> => [
  { title: "Account", checks: accountChecks() },
  { title: "Fan", checks: deviceChecks() },
  { title: "Control", checks: await brokerChecks() },
]

const firstProblem = (sections: Section[]): Check | undefined =>
  sections
    .flatMap((section) => section.checks)
    .find((check) => check.state !== "ok" && check.fix !== undefined)

export {
  accountChecks,
  deviceChecks,
  brokerChecks,
  fullDiagnosis,
  firstProblem,
}
export type { Check, CheckState, Section }
