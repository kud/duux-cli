import React from "react"
import { Box, Text } from "ink"
import type { FanState } from "@kud/duux"
import { FAN_PARAMS, type FanParamKey } from "../lib/params.js"
import { iconFor } from "../lib/icons.js"
import type { IconStyle } from "../lib/preferences.js"
import { Hotkeys } from "./hotkeys.js"

type Row = {
  key: FanParamKey
  label: string
  // FanState's field names don't match the command param names 1:1
  // (horosc → swing, verosc → tilt), and "night" has no reported field at
  // all — see the scaffold report: @kud/duux exposes no way to read back
  // confirmed night-mode state, only to set it.
  value: (fan: FanState | null) => string | null
}

const boolText = (value: boolean | null | undefined): string | null =>
  value === null || value === undefined ? null : value ? "on" : "off"

const ROWS: Row[] = [
  { key: "power", label: "Power", value: (fan) => boolText(fan?.power) },
  {
    key: "speed",
    label: "Speed",
    value: (fan) => (fan ? String(fan.speed) : null),
  },
  { key: "mode", label: "Mode", value: (fan) => fan?.mode ?? null },
  {
    key: "horosc",
    label: "H-Oscillation",
    value: (fan) => boolText(fan?.swing),
  },
  {
    key: "verosc",
    label: "V-Oscillation",
    value: (fan) => boolText(fan?.tilt),
  },
  {
    // Not observable — FanState has no "night" field, only the command
    // exists (see @kud/duux's commands.ts nightModeCommand). Shown as
    // "n/a" rather than guessed.
    key: "night",
    label: "Night mode",
    value: () => null,
  },
  {
    key: "timer",
    label: "Timer",
    value: (fan) => (fan ? String(fan.timer) : null),
  },
]

const BAR_WIDTH = 20

const RangeBar = ({
  min,
  max,
  value,
}: {
  min: number
  max: number
  value: number
}) => {
  const ratio = (value - min) / Math.max(1, max - min)
  const filled = Math.round(Math.max(0, Math.min(1, ratio)) * BAR_WIDTH)
  return (
    <Text>
      <Text color="cyan">{"█".repeat(filled)}</Text>
      <Text color="gray">{"░".repeat(BAR_WIDTH - filled)}</Text>
    </Text>
  )
}

const RowView = ({
  row,
  fan,
  active,
  iconStyle,
  optimistic,
}: {
  row: Row
  fan: FanState | null
  active: boolean
  iconStyle: IconStyle
  optimistic?: string
}) => {
  const param = FAN_PARAMS[row.key]
  const reported = row.value(fan)
  const rawValue = reported ?? optimistic ?? null
  const unconfirmed = reported === null && optimistic !== undefined
  const icon = iconFor(row.key, iconStyle)

  const valueNode = (() => {
    if (rawValue === null) return <Text color="gray">n/a</Text>

    if (param.kind === "boolean") {
      const on = rawValue === "on"
      return <Text color={on ? "green" : "gray"}>{on ? "● on" : "○ off"}</Text>
    }

    if (param.kind === "enum") {
      return (
        <Box columnGap={1}>
          {param.options.map((option) => (
            <Text
              key={option}
              bold={option === rawValue}
              color={option === rawValue ? "yellow" : "gray"}
            >
              {option === rawValue ? `[${option}]` : option}
            </Text>
          ))}
        </Box>
      )
    }

    const value = Number(rawValue)
    return (
      <Box columnGap={1}>
        <RangeBar min={param.min} max={param.max} value={value} />
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
      {icon ? <Text color="cyan">{`${icon} `}</Text> : null}
      <Text bold={active} color={active ? "yellow" : undefined}>
        {row.label.padEnd(14)}
      </Text>
      {valueNode}
      {unconfirmed && <Text color="gray"> (unconfirmed)</Text>}
    </Box>
  )
}

const ControlPanel = ({
  width,
  fan,
  cursor,
  iconStyle,
  optimistic,
}: {
  width: number
  fan: FanState | null
  cursor: number
  iconStyle: IconStyle
  optimistic: Partial<Record<FanParamKey, string>>
}) => (
  <Box
    flexDirection="column"
    borderStyle="round"
    borderColor="gray"
    width={width}
    paddingX={2}
    paddingY={1}
  >
    <Text bold>Fan control</Text>
    <Box flexDirection="column" marginTop={1} rowGap={0}>
      {ROWS.map((row, index) => (
        <RowView
          key={row.key}
          row={row}
          fan={fan}
          active={index === cursor}
          iconStyle={iconStyle}
          optimistic={optimistic[row.key]}
        />
      ))}
    </Box>
    <Box marginTop={1}>
      <Hotkeys
        hints={[
          { key: "↑↓", label: "select" },
          { key: "←→", label: "adjust" },
          { key: "⇧←→", label: "adjust ×big" },
          { key: "↵/spc", label: "toggle/cycle" },
          { key: "o", label: "prefs" },
          { key: "q", label: "quit" },
        ]}
      />
    </Box>
  </Box>
)

export { ControlPanel, ROWS }
export type { Row }
