import React from "react"
import { Box, Text } from "ink"
import type { SessionState } from "../hooks/use-session.js"
import type { Device } from "@kud/duux"

type Props = {
  device: Device | null
  state: SessionState
  lastAction: string
}

// Connection and power state are always a glyph + word pair (●/○ + text),
// never colour alone — colour only reinforces the distinction.
const StatusBar = ({ device, state, lastAction }: Props) => {
  const powerLabel =
    state.fan?.power === null || state.fan?.power === undefined
      ? "unknown"
      : state.fan.power
        ? "on"
        : "off"

  return (
    <Box flexDirection="column" marginBottom={1} rowGap={1}>
      <Box justifyContent="space-between" columnGap={2}>
        <Box columnGap={1}>
          <Text bold color="cyan">
            {device?.displayName ?? "Duux fan"}
          </Text>
          <Text color="gray">·</Text>
          <Text color={state.connected ? "green" : "yellow"}>
            {state.connected ? "● connected" : "○ connecting"}
          </Text>
        </Box>

        <Box columnGap={2}>
          <Text>
            <Text color="gray">power </Text>
            <Text color={state.fan?.power === false ? "yellow" : "white"}>
              {powerLabel}
            </Text>
          </Text>
          <Text>
            <Text color="gray">speed </Text>
            <Text>{state.fan ? `${state.fan.speed}/30` : "–"}</Text>
          </Text>
        </Box>
      </Box>

      <Box justifyContent="space-between" columnGap={2}>
        <Box>
          {lastAction && (
            <Text>
              <Text color="gray">last </Text>
              <Text>{lastAction}</Text>
            </Text>
          )}
        </Box>
        {state.error && <Text color="red">⚠ {state.error}</Text>}
      </Box>
    </Box>
  )
}

export { StatusBar }
