import React from "react"
import { Box, Text } from "ink"
import type { FanState } from "@kud/duux"
import { FAN_PARAMS, type FanParamKey } from "../lib/params.js"
import { iconFor } from "../lib/icons.js"
import { FooterHints, ProgressBar, ToggleSwitch } from "@kud/ink-ui"

type Row = {
  key: FanParamKey
  label: string
  value: (fan: FanState | null) => string | null
}

const numText = (value: number | null | undefined): string | null =>
  value === null || value === undefined ? null : String(value)

const boolText = (value: boolean | null | undefined): string | null =>
  value === null || value === undefined ? null : value ? "on" : "off"

const ROWS: Row[] = [
  { key: "power", label: "Power", value: (fan) => boolText(fan?.power) },
  {
    key: "speed",
    label: "Speed",
    value: (fan) => numText(fan?.speed),
  },
  { key: "mode", label: "Mode", value: (fan) => fan?.mode ?? null },
  {
    key: "horosc",
    label: "H-Oscillation",
    value: (fan) => numText(fan?.horosc),
  },
  {
    key: "verosc",
    label: "V-Oscillation",
    value: (fan) => numText(fan?.verosc),
  },
  {
    key: "night",
    label: "Night mode",
    value: (fan) => boolText(fan?.night),
  },
  {
    key: "lock",
    label: "Child lock",
    value: (fan) => boolText(fan?.lock),
  },
  {
    key: "timer",
    label: "Timer",
    value: (fan) => numText(fan?.timer),
  },
]

const BAR_WIDTH = 14

// One option in a set. Every pill is the same width whether or not it is the
// chosen one, so moving the selection never shifts the row — and the filled
// background carries the state as contrast rather than hue alone, which
// survives being read in monochrome.
const Pill = ({ label, selected }: { label: string; selected: boolean }) => (
  <Text
    bold={selected}
    color={selected ? "black" : "#8fa3ad"}
    backgroundColor={selected ? "cyan" : "#2b323d"}
  >
    {` ${label} `}
  </Text>
)

const RowView = ({
  row,
  fan,
  active,
  optimistic,
}: {
  row: Row
  fan: FanState | null
  active: boolean
  optimistic?: string
}) => {
  const param = FAN_PARAMS[row.key]
  const reported = row.value(fan)
  const rawValue = optimistic ?? reported ?? null
  const unconfirmed = optimistic !== undefined
  const icon = iconFor(row.key)

  const valueNode = (() => {
    if (rawValue === null) return <Text color="gray">n/a</Text>

    if (param.kind === "boolean") {
      const on = rawValue === "on"
      return (
        <ToggleSwitch
          on={on}
          label={on ? "on" : "off"}
          onColor="cyan"
        />
      )
    }

    if (param.kind === "enum") {
      return (
        <Box columnGap={1}>
          {param.options.map((option) => (
            <Pill key={option} label={option} selected={option === rawValue} />
          ))}
        </Box>
      )
    }

    const value = Number(rawValue)

    // A labelled range is a short list of named positions, so show them the
    // way the fan's own app does — every option visible, the active one
    // marked — rather than as a bar whose number means nothing on its own.
    if (param.labels) {
      return (
        <Box columnGap={1}>
          {param.labels.map((label, index) => (
            <Pill key={label} label={label} selected={index === value} />
          ))}
        </Box>
      )
    }

    return (
      <Box columnGap={1}>
        <ProgressBar
          value={
            ((value - param.min) / Math.max(1, param.max - param.min)) * 100
          }
          width={BAR_WIDTH}
          color="cyan"
          trackColor="#2b323d"
        />
        <Text>
          {value}
          {row.key === "timer" ? "h" : ""}/{param.max}
          {row.key === "timer" ? "h" : ""}
        </Text>
      </Box>
    )
  })()

  return (
    <Box columnGap={1}>
      <Text color={active ? "yellow" : "gray"}>{active ? "❯" : " "}</Text>
      {/* The cell is reserved for the whole column, not per row: rendering
          nothing when a glyph is missing collapses it and shifts that one row
          out of line with its neighbours. */}
      <Text color="cyan">{`${icon || " "} `}</Text>
      <Text bold={active} color={active ? "yellow" : undefined}>
        {row.label.padEnd(16)}
      </Text>
      {valueNode}
      {unconfirmed && <Text color="gray"> ·pending</Text>}
    </Box>
  )
}

const ControlPanel = ({
  width,
  fan,
  cursor,
  optimistic,
}: {
  width: number
  fan: FanState | null
  cursor: number
  optimistic: Partial<Record<FanParamKey, string>>
}) => (
  // No border: the panel already sits centred inside the screen frame, so a
  // second box around it is decoration rather than structure.
  <Box flexDirection="column" width={width} paddingX={2} paddingY={1}>
    <Text bold color="yellow">
      Fan control
    </Text>
    <Box flexDirection="column" marginTop={1} rowGap={1}>
      {ROWS.map((row, index) => (
        <RowView
          key={row.key}
          row={row}
          fan={fan}
          active={index === cursor}
          optimistic={optimistic[row.key]}
        />
      ))}
    </Box>
    <Box marginTop={2}>
      <FooterHints
        hints={[
          ["↑↓", "select"],
          ["←→", "adjust"],
          ["⇧←→", "adjust ×big"],
          ["↵/spc", "toggle/cycle"],
          ["p", "presets"],
          ["q", "quit"],
        ]}
      />
    </Box>
  </Box>
)

export { ControlPanel, ROWS }
export type { Row }
