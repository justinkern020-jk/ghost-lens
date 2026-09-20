import { useEffect, useState } from 'react'

export type FinalePhase =
  | 'idle'
  | 'drop'
  | 'crack'
  | 'reach'
  | 'pull'
  | 'seal'
  | 'silence'
  | 'done'

/** Climactic timing — full attention, scare-forward. Epilogue follows silence. */
export const FINALE_TIMING = {
  dropMs: 1600,
  crackMs: 1400,
  reachMs: 1600,
  pullMs: 1800,
  sealMs: 1600,
  silenceMs: 3200,
} as const

const PHASE_ORDER: FinalePhase[] = [
  'drop',
  'crack',
  'reach',
  'pull',
  'seal',
  'silence',
  'done',
]

interface Props {
  active: boolean
  polaroidUrl: string | null
  onPhase?: (phase: FinalePhase) => void
  /** Fires after silence — hand off to epilogue stranger. */
  onComplete?: () => void
}

/**
 * End-of-game climax: polaroid drops → ground opens → hell hands drag it under →
 * lingering silence. HUD should be locked while active. Epilogue follows.
 */
export function DemonFinale({ active, polaroidUrl, onPhase, onComplete }: Props) {
  const [phase, setPhase] = useState<FinalePhase>('idle')

  useEffect(() => {
    if (!active) {
      setPhase('idle')
      return
    }
    let cancelled = false
    let timer: number | null = null
    let idx = 0

    const advance = () => {
      if (cancelled) return
      const next = PHASE_ORDER[idx]
      idx += 1
      setPhase(next)
      onPhase?.(next)
      if (next === 'done') {
        onComplete?.()
        return
      }
      const wait =
        next === 'drop'
          ? FINALE_TIMING.dropMs
          : next === 'crack'
            ? FINALE_TIMING.crackMs
            : next === 'reach'
              ? FINALE_TIMING.reachMs
              : next === 'pull'
                ? FINALE_TIMING.pullMs
                : next === 'seal'
                  ? FINALE_TIMING.sealMs
                  : FINALE_TIMING.silenceMs
      timer = window.setTimeout(advance, wait)
    }

    timer = window.setTimeout(advance, 500)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [active, onPhase, onComplete])

  if (!active || phase === 'idle' || phase === 'done') return null

  return (
    <div
      className={`demon-finale-overlay phase-${phase}`}
      role="presentation"
      aria-label="Endgame finale"
    >
      <div className="finale-veil" aria-hidden />
      <div className="finale-ground" aria-hidden />
      <div className="finale-crack" aria-hidden />

      {(phase === 'drop' ||
        phase === 'crack' ||
        phase === 'reach' ||
        phase === 'pull') &&
        polaroidUrl && (
          <div className="finale-polaroid">
            <img src={polaroidUrl} alt="" />
            <span className="finale-polaroid-cap">THE EMPTY SEAT</span>
          </div>
        )}

      {(phase === 'reach' || phase === 'pull') && (
        <>
          <div className="finale-hand hand-l" aria-hidden>
            <span className="finger f1" />
            <span className="finger f2" />
            <span className="finger f3" />
            <span className="finger f4" />
            <span className="thumb" />
            <span className="palm" />
          </div>
          <div className="finale-hand hand-r" aria-hidden>
            <span className="finger f1" />
            <span className="finger f2" />
            <span className="finger f3" />
            <span className="finger f4" />
            <span className="thumb" />
            <span className="palm" />
          </div>
        </>
      )}

      {(phase === 'seal' || phase === 'silence') && (
        <div className="finale-smoke" aria-hidden />
      )}

      {phase === 'silence' && (
        <p className="finale-lore">
          The seat is empty. The photograph is not yours anymore.
        </p>
      )}
    </div>
  )
}
