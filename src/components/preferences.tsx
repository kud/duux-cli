import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import { writeIconStyle, type IconStyle } from "../lib/preferences.js"
import { Hotkeys } from "./hotkeys.js"

type Option = { value: IconStyle; label: string; hint: string }

const ICON_STYLE_OPTIONS: Option[] = [
  {
    value: "text",
    label: "Text only",
    hint: "labels, no icons (most portable)",
  },
  {
    value: "nerd",
    label: "Nerd Font",
    hint: "single-width glyphs (needs a Nerd Font)",
  },
]

// The interactive Preferences editor, shared by the in-panel view (opened
// with "o") and the standalone `duux prefs` command. Self-contained input
// handling, unlike ControlPanel — App only decides whether it is mounted at
// all, it never needs to know the cursor inside it.
const Preferences = ({
  width,
  iconStyle,
  setIconStyle,
  onExit,
  onStatus,
}: {
  width: number
  iconStyle: IconStyle
  setIconStyle: (style: IconStyle) => void
  onExit: () => void
  onStatus?: (message: string) => void
}) => {
  const [cursor, setCursor] = useState(() =>
    Math.max(
      0,
      ICON_STYLE_OPTIONS.findIndex((option) => option.value === iconStyle),
    ),
  )

  useInput((_input, key) => {
    if (key.escape) {
      onExit()
      return
    }
    if (key.upArrow) {
      setCursor(
        (c) => (c - 1 + ICON_STYLE_OPTIONS.length) % ICON_STYLE_OPTIONS.length,
      )
      return
    }
    if (key.downArrow) {
      setCursor((c) => (c + 1) % ICON_STYLE_OPTIONS.length)
      return
    }
    if (key.return) {
      const chosen = ICON_STYLE_OPTIONS[cursor]!.value
      writeIconStyle(chosen)
      setIconStyle(chosen)
      onStatus?.(`icons: ${chosen}`)
      onExit()
    }
  })

  return (
    <Box
      borderStyle="round"
      borderColor="yellow"
      flexDirection="column"
      width={width}
      paddingX={2}
      paddingY={1}
    >
      <Text bold>Preferences</Text>
      <Box flexDirection="column" marginTop={1}>
        {ICON_STYLE_OPTIONS.map((option, index) => {
          const active = index === cursor
          const saved = option.value === iconStyle
          return (
            <Box key={option.value} columnGap={1}>
              <Text color={active ? "yellow" : "gray"}>
                {active ? "❯" : " "}
              </Text>
              <Text color={saved ? "green" : undefined}>
                {saved ? "●" : "○"}
              </Text>
              <Text bold={active} color={active ? "yellow" : undefined}>
                {option.label}
              </Text>
              <Text color="gray">{option.hint}</Text>
            </Box>
          )
        })}
      </Box>
      <Box marginTop={1}>
        <Hotkeys
          hints={[
            { key: "↑↓", label: "move" },
            { key: "↵", label: "save" },
            { key: "esc", label: "close" },
          ]}
        />
      </Box>
    </Box>
  )
}

export { Preferences }
