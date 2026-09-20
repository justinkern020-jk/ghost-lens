import { useCallback, useEffect, useState } from 'react'
import {
  evaluateMoonNow,
  isForceFullMoon,
  setForceFullMoon as persistForceFullMoon,
  type MoonStatus,
} from '../moon/moonPhase'

export function useMoonGate() {
  const [status, setStatus] = useState<MoonStatus>(() => evaluateMoonNow())
  const [forceFullMoon, setForceFullMoonState] = useState(() => isForceFullMoon())

  const refresh = useCallback(() => {
    setStatus(evaluateMoonNow())
    setForceFullMoonState(isForceFullMoon())
  }, [])

  // Re-check every 60s (local calendar day / clock)
  useEffect(() => {
    const id = window.setInterval(() => {
      setStatus(evaluateMoonNow())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setStatus(evaluateMoonNow())
  }, [forceFullMoon])

  const setForceFullMoon = useCallback((on: boolean) => {
    persistForceFullMoon(on)
    try {
      const url = new URL(window.location.href)
      if (on) url.searchParams.set('forceFullMoon', '1')
      else url.searchParams.delete('forceFullMoon')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setForceFullMoonState(on)
    setStatus(evaluateMoonNow())
  }, [])

  const toggleForceFullMoon = useCallback(() => {
    setForceFullMoon(!isForceFullMoon())
  }, [setForceFullMoon])

  return {
    status,
    canSeal: status.canSeal,
    isFullMoon: status.isFullMoon,
    forceFullMoon,
    setForceFullMoon,
    toggleForceFullMoon,
    refresh,
  }
}
