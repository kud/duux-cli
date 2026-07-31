import React, { useEffect, useState } from "react"
import { Box, Text, useApp, useInput, useStdout } from "ink"
import { getCurrentDevice, type Device, type FanMode } from "@kud/duux"
import { useSession } from "./hooks/use-session.js"
import { StatusBar } from "./components/status-bar.js"
import { ControlPanel, ROWS } from "./components/control-panel.js"
import { Preferences } from "./components/preferences.js"
import { readIconStyle } from "./lib/preferences.js"
import { FAN_PARAMS, clampRange, type FanParamKey } from "./lib/params.js"

const App = () => {
  const [device] = useState<Device | null>(() => getCurrentDevice())
  const [cursor, setCursor] = useState(0)
  const [lastAction, setLastAction] = useState("")
  const [settingsMode, setSettingsMode] = useState(false)
  const [iconStyle, setIconStyle] = useState(() => readIconStyle())
  const [optimistic, setOptimistic] = useState<
    Partial<Record<FanParamKey, string>>
  >({})
  const { exit } = useApp()
  const { stdout } = useStdout()
  const {
    state,
    setPower,
    setSpeed,
    setMode,
    setOscillation,
    setNightMode,
    setTimer,
  } = useSession()

  // A pending local value outranks the fan's reported one until the fan
  // confirms it. The session only refreshes `fan` on a poll (30s) or an MQTT
  // push — never on a setter — so reading `reported` first makes every press
  // within one round trip compute from the same stale base, and holding an
  // arrow to ramp the speed lands one step instead of many.
  const row = ROWS[cursor]!
  const param = FAN_PARAMS[row.key]
  const reported = row.value(state.fan)
  const currentValue = optimistic[row.key] ?? reported ?? null

  useEffect(() => {
    setOptimistic((prev) => {
      const pending = Object.entries(prev).filter(
        ([key, value]) =>
          ROWS.find((candidate) => candidate.key === key)?.value(state.fan) !==
          value,
      )
      return pending.length === Object.keys(prev).length
        ? prev
        : (Object.fromEntries(pending) as Partial<Record<FanParamKey, string>>)
    })
  }, [state.fan])

  const remember = (label: string, value?: string) => {
    setLastAction(label)
    if (value !== undefined) {
      setOptimistic((prev) => ({ ...prev, [row.key]: value }))
    }
  }

  const adjustRange = (direction: 1 | -1, big: boolean) => {
    if (param.kind !== "range") return
    const base = currentValue !== null ? Number(currentValue) : param.min
    const step = big ? param.bigStep : param.step
    const next = clampRange(param, base + direction * step)
    if (row.key === "speed") {
      void setSpeed(next)
      remember(`speed ${next}`, String(next))
    } else if (row.key === "timer") {
      void setTimer(next)
      remember(`timer ${next}h`, String(next))
    } else if (row.key === "horosc") {
      void setOscillation("horizontal", next)
      remember(next === 0 ? "h-osc off" : `h-osc ${next}`, String(next))
    }
  }

  const cycleEnum = (direction: 1 | -1) => {
    if (param.kind !== "enum") return
    const options = param.options
    const currentIndex = Math.max(
      0,
      options.indexOf((currentValue as FanMode) ?? options[0]!),
    )
    const next =
      options[(currentIndex + direction + options.length) % options.length]!
    void setMode(next)
    remember(`mode ${next}`, next)
  }

  const toggleBoolean = () => {
    if (param.kind !== "boolean") return
    const on = currentValue === "on"
    const next = !on
    switch (row.key) {
      case "power":
        void setPower(next)
        remember(`power ${next ? "on" : "off"}`, next ? "on" : "off")
        return
      case "verosc":
        void setOscillation("vertical", next)
        remember(`v-osc ${next ? "on" : "off"}`, next ? "on" : "off")
        return
      case "night":
        void setNightMode(next)
        remember(`night ${next ? "on" : "off"}`, next ? "on" : "off")
        return
    }
  }

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit()
      return
    }

    // The Preferences panel owns all input while it is open.
    if (settingsMode) return

    if (input === "q") {
      exit()
      return
    }

    if (input === "o") {
      setSettingsMode(true)
      setLastAction("preferences")
      return
    }

    if (key.upArrow) {
      setCursor((c) => (c - 1 + ROWS.length) % ROWS.length)
      return
    }
    if (key.downArrow) {
      setCursor((c) => (c + 1) % ROWS.length)
      return
    }

    if (key.leftArrow || key.rightArrow) {
      const direction = key.leftArrow ? -1 : 1
      if (param.kind === "range") adjustRange(direction, key.shift)
      else if (param.kind === "enum") cycleEnum(direction)
      return
    }

    if (key.return || input === " ") {
      if (param.kind === "boolean") toggleBoolean()
      else if (param.kind === "enum") cycleEnum(1)
      return
    }
  })

  const columns = stdout.columns ?? 80
  const contentWidth = Math.max(40, Math.min(64, columns - 6))
  const tooNarrow = columns < 46

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="gray"
      borderDimColor
      width={columns}
      height={stdout.rows}
      paddingX={2}
      paddingY={1}
    >
      <StatusBar device={device} state={state} lastAction={lastAction} />
      <Box flexGrow={1} alignItems="center" justifyContent="center">
        {tooNarrow ? (
          <Text color="yellow">Resize terminal to at least 46 columns.</Text>
        ) : settingsMode ? (
          <Preferences
            width={contentWidth}
            iconStyle={iconStyle}
            setIconStyle={setIconStyle}
            onExit={() => setSettingsMode(false)}
            onStatus={setLastAction}
          />
        ) : (
          <ControlPanel
            width={contentWidth}
            fan={state.fan}
            cursor={cursor}
            iconStyle={iconStyle}
            optimistic={optimistic}
          />
        )}
      </Box>
    </Box>
  )
}

export { App }
