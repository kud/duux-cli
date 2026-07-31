import chalk from "chalk"
import {
  fullDiagnosis,
  firstProblem,
  brokerChecks,
  type Check,
  type Section,
} from "../lib/diagnostics.js"

// Glyph plus word, never colour alone — ✓/!/✗ carry the state on their own so
// the report reads correctly in monochrome or to a colourblind reader.
const MARKERS: Record<Check["state"], string> = {
  ok: chalk.green("✓"),
  warn: chalk.yellow("!"),
  fail: chalk.red("✗"),
}

const renderCheck = (check: Check): void => {
  process.stdout.write(
    `  ${MARKERS[check.state]} ${check.label.padEnd(24)}${
      check.detail ? chalk.gray(check.detail) : ""
    }\n`,
  )
}

const renderSections = (sections: Section[]): void => {
  for (const section of sections) {
    process.stdout.write(`\n${chalk.bold(section.title)}\n`)
    section.checks.forEach(renderCheck)
  }
}

const renderNextStep = (sections: Section[]): void => {
  const problem = firstProblem(sections)
  if (!problem) {
    process.stdout.write(`\n${chalk.green("Everything checks out.")}\n`)
    return
  }
  process.stdout.write(
    `\n${chalk.bold("Next:")} ${problem.label.toLowerCase()} — run ${chalk.cyan(problem.fix ?? "")}\n`,
  )
  if (problem.state === "fail") process.exitCode = 1
}

const doctor = async (): Promise<void> => {
  process.stdout.write(`${chalk.bold("Duux")}${chalk.dim(" · doctor")}\n`)
  const sections = await fullDiagnosis()
  renderSections(sections)
  renderNextStep(sections)
}

// The broker-only slice of the same report, for when that is the part being
// worked on and the account/fan sections are just noise.
const brokerDoctor = async (): Promise<void> => {
  process.stdout.write(`${chalk.bold("Duux")}${chalk.dim(" · broker check")}\n`)
  const sections: Section[] = [
    { title: "Control", checks: await brokerChecks() },
  ]
  renderSections(sections)
  renderNextStep(sections)
}

export { doctor, brokerDoctor }
