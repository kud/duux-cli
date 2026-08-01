import React, { useEffect, useState } from "react"
import { Box, Text, useApp, useInput, useStdout } from "ink"
import { getCurrentDevice, type Device, type FanMode } from "@kud/duux"
import { useSession } from "./hooks/use-session.js"
import { StatusBar } from "./components/status-bar.js"
import { ControlPanel, ROWS } from "./components/control-panel.js"
import { Presets } from "./components/presets.js"
import type { Preset } from "./lib/presets.js"
import { FAN_PARAMS, clampRange, type FanParamKey } from "./lib/params.js"
import { useDebouncedSend } from "./hooks/use-debounced-send.js"

const App = () => {
  const [device] = useState<Device | null>(() => getCurrentDevice())
  const [cursor, setCursor] = useState(0)
  const [lastAction, setLastAction] = useState("")
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
    setChildLock,
    setTimer,
  } = useSession()
  const { send } = useDebouncedSend()
  const [presetsOpen, setPresetsOpen] = useState(false)

  // Applied through the session rather than the preset command's own sender, so
  // the panel's optimistic values and status line update the same way they do
  // for a keypress. Sent immediately — a preset is one deliberate action, not a
  // burst worth debouncing.
  const applyPreset = (name: string, preset: Preset) => {
    if (preset.power !== undefined) void setPower(preset.power)
    if (preset.mode !== undefined) void setMode(preset.mode)
    if (preset.speed !== undefined) void setSpeed(preset.speed)
    if (preset.horosc !== undefined)
      void setOscillation("horizontal", preset.horosc)
    if (preset.verosc !== undefined)
      void setOscillation("vertical", preset.verosc)
    if (preset.night !== undefined) void setNightMode(preset.night)
    if (preset.lock !== undefined) void setChildLock(preset.lock)
    if (preset.timer !== undefined) void setTimer(preset.timer)
    setLastAction(`preset ${name}`)
  }

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
      send("speed", () => void setSpeed(next))
      remember(`speed ${next}`, String(next))
    } else if (row.key === "timer") {
      send("timer", () => void setTimer(next))
      remember(`timer ${next}h`, String(next))
    } else if (row.key === "horosc") {
      send("horosc", () => void setOscillation("horizontal", next))
      remember(next === 0 ? "h-osc off" : `h-osc ${next}`, String(next))
    } else if (row.key === "verosc") {
      send("verosc", () => void setOscillation("vertical", next))
      remember(next === 0 ? "v-osc off" : `v-osc ${next}`, String(next))
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
        send("power", () => void setPower(next))
        remember(`power ${next ? "on" : "off"}`, next ? "on" : "off")
        return
      case "night":
        send("night", () => void setNightMode(next))
        remember(`night ${next ? "on" : "off"}`, next ? "on" : "off")
        return
      case "lock":
        send("lock", () => void setChildLock(next))
        remember(`lock ${next ? "on" : "off"}`, next ? "on" : "off")
        return
    }
  }

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit()
      return
    }

    // The Presets panel owns all input while it is open.
    if (presetsOpen) return

    if (input === "p") {
      setPresetsOpen(true)
      return
    }

    if (input === "q") {
      exit()
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
  const contentWidth = Math.max(44, Math.min(88, columns - 8))
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
        ) : presetsOpen ? (
          <Presets
            width={contentWidth}
            onApply={applyPreset}
            onExit={() => setPresetsOpen(false)}
          />
        ) : (
          <ControlPanel
            width={contentWidth}
            fan={state.fan}
            cursor={cursor}
            optimistic={optimistic}
          />
        )}
      </Box>
    </Box>
  )
}

export { App }
