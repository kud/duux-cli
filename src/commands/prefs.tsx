import React, { useState } from "react"
import { render, useApp } from "ink"
import { Preferences } from "../components/preferences.js"
import { readIconStyle, type IconStyle } from "../lib/preferences.js"

// Standalone Preferences editor — the same panel reachable with "o" from the
// control panel, launched straight from the shell. It needs no fan
// connection: every change is a local config write, so it sits outside the
// auth/discovery gate.
const PreferencesApp = () => {
  const { exit } = useApp()
  const [iconStyle, setIconStyle] = useState<IconStyle>(() => readIconStyle())

  return (
    <Preferences
      width={40}
      iconStyle={iconStyle}
      setIconStyle={setIconStyle}
      onExit={exit}
    />
  )
}

const prefs = async (): Promise<void> => {
  const { waitUntilExit } = render(<PreferencesApp />)
  await waitUntilExit()
}

export { prefs }
