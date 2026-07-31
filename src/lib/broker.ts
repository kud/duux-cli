import { readPreferences, writePreferences } from "@kud/duux"

// Cloudgarden refuses the cloud control endpoints (/data/{id}/status and
// /sensor/{id}/commands both answer "Not_Allowed"), so the working route is to
// run an MQTT broker on the local network, point collector3.cloudgarden.nl at
// it by DNS, and let the fan connect to you instead of Duux. The fan is the
// client; you become its broker. See plans/local-broker.md for the setup.
type BrokerConfig = {
  host: string
  port: number
}

const DEFAULT_PORT = 443

const readBroker = (): BrokerConfig | null => {
  const stored = readPreferences()["broker"]
  if (stored === null || typeof stored !== "object" || Array.isArray(stored)) {
    return null
  }
  const { host, port } = stored as Partial<BrokerConfig>
  if (typeof host !== "string" || host.trim() === "") return null
  return { host, port: typeof port === "number" ? port : DEFAULT_PORT }
}

const writeBroker = (broker: BrokerConfig | null): void => {
  writePreferences({ broker })
}

export { readBroker, writeBroker, DEFAULT_PORT }
export type { BrokerConfig }
