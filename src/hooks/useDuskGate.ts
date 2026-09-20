import { useCallback, useEffect, useState } from 'react'
import {
  evaluateDuskNow,
  isForceDusk,
  requestCoords,
  setForceDusk as persistForceDusk,
  type DuskStatus,
} from '../dusk/duskGate'

export function useDuskGate() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [status, setStatus] = useState<DuskStatus>(() => evaluateDuskNow(null))
  const [forceDusk, setForceDuskState] = useState(() => isForceDusk())
  const [geoPending, setGeoPending] = useState(true)

  const refresh = useCallback(() => {
    setStatus(evaluateDuskNow(coords))
    setForceDuskState(isForceDusk())
  }, [coords])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const c = await requestCoords()
      if (cancelled) return
      setCoords(c)
      setGeoPending(false)
      setStatus(evaluateDuskNow(c))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Re-check every 30s (clock rolls into/out of dusk)
  useEffect(() => {
    const id = window.setInterval(() => {
      setStatus(evaluateDuskNow(coords))
    }, 30_000)
    return () => clearInterval(id)
  }, [coords])

  useEffect(() => {
    setStatus(evaluateDuskNow(coords))
  }, [coords, forceDusk])

  const setForceDusk = useCallback(
    (on: boolean) => {
      persistForceDusk(on)
      try {
        const url = new URL(window.location.href)
        if (on) url.searchParams.set('forceDusk', '1')
        else url.searchParams.delete('forceDusk')
        window.history.replaceState({}, '', url.toString())
      } catch {
        /* ignore */
      }
      setForceDuskState(on)
      // Re-read after URL mutate
      setStatus(evaluateDuskNow(coords))
    },
    [coords],
  )

  const toggleForceDusk = useCallback(() => {
    setForceDusk(!isForceDusk())
  }, [setForceDusk])

  return {
    status,
    allowed: status.allowed,
    forceDusk,
    setForceDusk,
    toggleForceDusk,
    geoPending,
    refresh,
  }
}
