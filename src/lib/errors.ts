// "Not_Allowed" from the cloud. Rare now that commands are addressed
// correctly, but if it does appear the raw API message is a dead end, so it
// carries a way forward with it.
const CLOUD_REFUSAL = /Not_Allowed/

const explainError = (message: string): string =>
  CLOUD_REFUSAL.test(message)
    ? `${message}\nIf this persists, run \`duux discover\` to refresh the fan's address, or \`duux doctor\` to check your setup.`
    : message

const isCloudRefusal = (message: string | null): boolean =>
  message !== null && CLOUD_REFUSAL.test(message)

export { explainError, isCloudRefusal }
