import { readFileSync } from "node:fs"
import { createMqttTransport, type Transport } from "@kud/duux"
import { readBroker } from "./broker.js"
import { CA_PATH } from "./broker-paths.js"

// A local broker is served with a certificate you generated yourself, so the
// pinned Cloudgarden one in @kud/duux is wrong for it. Read yours if it is
// where `duux broker` puts it; otherwise let the connection fail loudly rather
// than silently trusting anything.


const readLocalCa = (): string | undefined => {
  try {
    return readFileSync(CA_PATH, "utf8")
  } catch {
    return undefined
  }
}

// Returns undefined when no broker is configured, which leaves every caller on
// @kud/duux's default cloud transport.
const localTransport = (): Transport | undefined => {
  const broker = readBroker()
  if (!broker) return undefined

  return createMqttTransport({
    host: broker.host,
    port: broker.port,
    ca: readLocalCa(),
  })
}

export { localTransport }
