import { useEffect, useRef } from "react"
import type { FanParamKey } from "../lib/params.js"

// Holding an arrow key fires a keypress every few tens of milliseconds. Sending
// one command per press makes the fan lurch through every intermediate value
// on its way to the one you wanted — so the optimistic value updates on every
// press (the display stays instant) while only the last value in a burst is
// actually sent, once you stop.
const DEBOUNCE_MS = 1_200

type Pending = Map<FanParamKey, ReturnType<typeof setTimeout>>

const useDebouncedSend = () => {
  const timers = useRef<Pending>(new Map())

  useEffect(
    () => () => {
      for (const timer of timers.current.values()) clearTimeout(timer)
      timers.current.clear()
    },
    [],
  )

  // Debounced per parameter, not globally: nudging the speed should never
  // cancel a pending power toggle.
  const send = (key: FanParamKey, action: () => void): void => {
    const existing = timers.current.get(key)
    if (existing) clearTimeout(existing)

    timers.current.set(
      key,
      setTimeout(() => {
        timers.current.delete(key)
        action()
      }, DEBOUNCE_MS),
    )
  }

  return { send, DEBOUNCE_MS }
}

export { useDebouncedSend, DEBOUNCE_MS }
