import { homedir } from "node:os"
import { join } from "node:path"

// Split out from transport.ts and broker-setup.ts so both can share these
// without importing each other's node:child_process dependency.
const BROKER_DIR = join(homedir(), ".config", "duux", "broker")
const CA_PATH = join(BROKER_DIR, "ca.crt")
const KEY_PATH = join(BROKER_DIR, "broker.key")
const CONF_PATH = join(BROKER_DIR, "mosquitto.conf")

export { BROKER_DIR, CA_PATH, KEY_PATH, CONF_PATH }
