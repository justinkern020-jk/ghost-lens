import { useEffect, useState } from 'react'

export type WerewolfPhase =
  | 'idle'
  | 'form'
  | 'howl'
  | 'lunge'
  | 'eat'
  | 'blackout'
  | 'done'

/** Timed to match ar/WerewolfScene.ts */
export const WEREWOLF_TIMING = {
  formMs: 1800,
  howlMs: 1200,
  lungeMs: 900,
  eatMs: 1100,
  blackoutMs: 800,
} as const

const PHASE_ORDER: WerewolfPhase[] = [
  'form',
  'howl',
  'lunge',
  'eat',
  'blackout',
  'done',
]

interface Props {
  active: boolean
  onPhase?: (phase: WerewolfPhase) => void
  onComplete?: () => void
}

/**
 * Screen-space Keller → werewolf attack (used when no WebXR, and as
 * visual backup alongside the AR scene). Stylized uncanny — not cute.
 */
export function WerewolfAttack({ active, onPhase, onComplete }: Props) {
  const [phase, setPhase] = useState<WerewolfPhase>('idle')

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
        next === 'form'
          ? WEREWOLF_TIMING.formMs
          : next === 'howl'
            ? WEREWOLF_TIMING.howlMs
            : next === 'lunge'
              ? WEREWOLF_TIMING.lungeMs
              : next === 'eat'
                ? WEREWOLF_TIMING.eatMs
                : WEREWOLF_TIMING.blackoutMs
      timer = window.setTimeout(advance, wait)
    }

    timer = window.setTimeout(advance, 200)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [active, onPhase, onComplete])

  if (!active || phase === 'idle' || phase === 'done') return null

  return (
    <div
      className={`werewolf-attack-overlay phase-${phase}`}
      role="presentation"
      aria-label="Herr Keller transforms"
    >
      <div className="ww-veil" aria-hidden />
      <div className="ww-vignette" aria-hidden />

      {(phase === 'form' || phase === 'howl') && (
        <div className="ww-keller-silhouette" aria-hidden>
          <span className="ww-hat" />
          <span className="ww-head" />
          <span className="ww-coat" />
        </div>
      )}

      {phase !== 'blackout' && (
        <div className={`ww-beast phase-${phase}`} aria-hidden>
          <span className="ww-ear ear-l" />
          <span className="ww-ear ear-r" />
          <span className="ww-skull" />
          <span className="ww-snout" />
          <span className="ww-fang fang-l" />
          <span className="ww-fang fang-r" />
          <span className="ww-eye eye-l" />
          <span className="ww-eye eye-r" />
          <span className="ww-jaw" />
          <span className="ww-spine" />
          <span className="ww-claw claw-l" />
          <span className="ww-claw claw-r" />
        </div>
      )}

      {phase === 'form' && (
        <p className="ww-caption">The hunter sheds his manners.</p>
      )}
      {phase === 'howl' && (
        <p className="ww-caption cold">Something older than Austria answers.</p>
      )}
      {phase === 'lunge' && (
        <p className="ww-caption danger">He takes what was always his.</p>
      )}
      {phase === 'eat' && <p className="ww-caption danger">…</p>}
      {phase === 'blackout' && <div className="ww-blackout" aria-hidden />}
    </div>
  )
}
