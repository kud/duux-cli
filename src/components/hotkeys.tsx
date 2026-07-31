import React from "react"
import { Box, Text } from "ink"

type Hint = { key: string; label: string }

// Footer hotkey legend — key glyph in white, description in gray.
const Hotkeys = ({ hints }: { hints: Hint[] }) => (
  <Box columnGap={2}>
    {hints.map((hint) => (
      <Text key={`${hint.key} ${hint.label}`}>
        <Text color="white" bold>
          {hint.key}
        </Text>
        <Text color="gray">{` ${hint.label}`}</Text>
      </Text>
    ))}
  </Box>
)

export { Hotkeys }
export type { Hint }
