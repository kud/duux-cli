import { useEffect, useRef, useState } from "react"
import { createSession, type Session, type FanSessionState } from "@kud/duux"
import { localTransport } from "../lib/transport.js"

const initialState: FanSessionState = {
  deviceId: null,
  connected: false,
  fan: null,
  error: null,
}

// Thin React adapter over @kud/duux's framework-agnostic session: subscribe
// to `change`, mirror into React state, and forward the setter calls.
const useSession = () => {
  const [state, setState] = useState<FanSessionState>(initialState)
  const sessionRef = useRef<Session | null>(null)

  useEffect(() => {
    // Undefined when no local broker is configured, which leaves the session
    // on its default cloud transport.
    const session = createSession({ transport: localTransport() })
    sessionRef.current = session
    setState({ ...session.state })
    session.on("change", (next) => setState({ ...next }))
    return () => session.stop()
  }, [])

  const setPower = (on: boolean) => sessionRef.current?.setPower(on)
  const setSpeed = (speed: number) => sessionRef.current?.setSpeed(speed)
  const setMode = (mode: Parameters<Session["setMode"]>[0]) =>
    sessionRef.current?.setMode(mode)
  // Horizontal takes a 0-3 sweep preset, vertical a plain toggle — the core
  // narrows per axis, so the shared signature has to admit both.
  const setOscillation = (
    axis: "horizontal" | "vertical",
    on: number | boolean,
  ) => sessionRef.current?.setOscillation(axis, on)
  const setNightMode = (on: boolean) => sessionRef.current?.setNightMode(on)
  const setTimer = (hours: number) => sessionRef.current?.setTimer(hours)

  return {
    state,
    setPower,
    setSpeed,
    setMode,
    setOscillation,
    setNightMode,
    setTimer,
  }
}

export { useSession, type FanSessionState as SessionState }
