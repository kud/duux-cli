import { execFileSync } from "node:child_process"
import { mkdirSync, writeFileSync, existsSync, chmodSync } from "node:fs"
import { networkInterfaces } from "node:os"
import { join } from "node:path"
import { BROKER_DIR, CA_PATH, KEY_PATH, CONF_PATH } from "./broker-paths.js"

const OPENSSL_CONF_PATH = join(BROKER_DIR, "openssl.cnf")
const DUUX_HOST = "collector3.cloudgarden.nl"

// The address the fan will be told to connect to, so it has to be this
// machine's LAN address — not a loopback, and not a virtual interface the
// router can't route to.
const detectLanAddress = (): string | null => {
  const candidates = Object.entries(networkInterfaces())
    .filter(([name]) => /^(en|eth|wl)/.test(name))
    .flatMap(([, addresses]) => addresses ?? [])
    .filter((address) => address.family === "IPv4" && !address.internal)
  return candidates[0]?.address ?? null
}

// Scanning PATH rather than shelling out to `command -v`: spawning a shell
// with concatenated arguments is deprecated in Node, and this needs no shell.
const hasMosquitto = (): boolean =>
  (process.env["PATH"] ?? "")
    .split(":")
    .filter(Boolean)
    .some((dir) => existsSync(join(dir, "mosquitto")))

// Cloudgarden's own certificate leaves its hostname out of the SAN list, which
// is why nothing can verify it. Ours lists it, so duux-cli verifies the local
// broker normally with no hostname bypass.
const opensslConfig = (address: string): string => `[req]
distinguished_name = dn
x509_extensions    = v3
prompt             = no

[dn]
C  = NL
O  = duux-cli local broker
CN = ${DUUX_HOST}

[v3]
subjectAltName   = DNS:${DUUX_HOST}, DNS:localhost, IP:127.0.0.1, IP:${address}
basicConstraints = critical, CA:TRUE
keyUsage         = critical, digitalSignature, keyCertSign, keyEncipherment
`

const mosquittoConfig = (port: number): string => `# duux-cli local broker.
# The fan dials mqtts://${DUUX_HOST}:${port}. Point that hostname at this
# machine by DNS and the fan connects here instead of Duux's cloud.

listener ${port}
protocol mqtt

cafile   ${CA_PATH}
certfile ${CA_PATH}
keyfile  ${KEY_PATH}

# The fan presents no credentials, so anonymous access is required for it to
# connect at all. Keep this broker on the LAN.
allow_anonymous true

log_type all
log_dest stdout
`

const generateCertificate = (address: string): void => {
  mkdirSync(BROKER_DIR, { recursive: true })
  writeFileSync(OPENSSL_CONF_PATH, opensslConfig(address))
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-nodes",
      "-newkey",
      "rsa:2048",
      "-days",
      "3650",
      "-keyout",
      KEY_PATH,
      "-out",
      CA_PATH,
      "-config",
      OPENSSL_CONF_PATH,
    ],
    { stdio: "pipe" },
  )
  chmodSync(KEY_PATH, 0o600)
}

const writeBrokerConfig = (port: number): void => {
  writeFileSync(CONF_PATH, mosquittoConfig(port))
}

const certificateExists = (): boolean =>
  existsSync(CA_PATH) && existsSync(KEY_PATH)

export {
  detectLanAddress,
  hasMosquitto,
  generateCertificate,
  writeBrokerConfig,
  certificateExists,
  DUUX_HOST,
  OPENSSL_CONF_PATH,
}
