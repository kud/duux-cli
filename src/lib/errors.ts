// Duux's cloud answers "Not_Allowed" for status and command requests on most
// accounts. That is the single most likely failure a user will hit, and the
// raw API message is a dead end — so it carries the way out with it.
const CLOUD_REFUSAL = /Not_Allowed/

const explainError = (message: string): string =>
  CLOUD_REFUSAL.test(message)
    ? `${message}\nDuux's cloud blocks fan control on most accounts. Run \`duux broker setup\` to control it over your own network instead.`
    : message

const isCloudRefusal = (message: string | null): boolean =>
  message !== null && CLOUD_REFUSAL.test(message)

export { explainError, isCloudRefusal }
