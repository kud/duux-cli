import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import { allPresets, isBuiltIn, type Preset } from "../lib/presets.js"
import { Hotkeys } from "./hotkeys.js"

const summarise = (preset: Preset): string =>
  Object.entries(preset)
    .map(([key, value]) =>
      typeof value === "boolean"
        ? value
          ? key
          : `no ${key}`
        : `${key} ${value}`,
    )
    .join(" · ")

// Self-contained input handling, like the control panel's own: App only
// decides whether this is mounted, never what the cursor inside it is doing.
const Presets = ({
  width,
  onApply,
  onExit,
}: {
  width: number
  onApply: (name: string, preset: Preset) => void
  onExit: () => void
}) => {
  const entries = Object.entries(allPresets())
  const [cursor, setCursor] = useState(0)

  useInput((_input, key) => {
    if (key.escape) {
      onExit()
      return
    }
    if (key.upArrow) {
      setCursor((c) => (c - 1 + entries.length) % entries.length)
      return
    }
    if (key.downArrow) {
      setCursor((c) => (c + 1) % entries.length)
      return
    }
    if (key.return) {
      const chosen = entries[cursor]
      if (chosen) onApply(chosen[0], chosen[1])
      onExit()
    }
  })

  return (
    <Box flexDirection="column" width={width} paddingX={2} paddingY={1}>
      <Text bold color="yellow">
        Presets
      </Text>
      <Box flexDirection="column" marginTop={1} rowGap={1}>
        {entries.map(([name, preset], index) => {
          const active = index === cursor
          return (
            <Box key={name} columnGap={1}>
              <Text color={active ? "yellow" : "gray"}>
                {active ? "❯" : " "}
              </Text>
              <Text bold={active} color={active ? "yellow" : undefined}>
                {name.padEnd(10)}
              </Text>
              <Text color="gray">{summarise(preset)}</Text>
              {!isBuiltIn(name) && <Text color="cyan">yours</Text>}
            </Box>
          )
        })}
      </Box>
      <Box marginTop={2}>
        <Hotkeys
          hints={[
            { key: "↑↓", label: "select" },
            { key: "↵", label: "apply" },
            { key: "esc", label: "close" },
          ]}
        />
      </Box>
    </Box>
  )
}

export { Presets }
