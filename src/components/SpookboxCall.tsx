import { useEffect, useRef, useState } from 'react'
import { SPOOKBOX } from '../ngplus/spookbox'

interface Props {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

type Phase = 'idle' | 'sweeping' | 'contact' | 'done'

/**
 * Lite ITC minigame — Call a protector spirit through the Spookbox.
 * Brief sweep/listen, then stun the Pale Archivist.
 */
export function SpookboxCall({ open, onSuccess, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [noise, setNoise] = useState('····')
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  useEffect(() => {
    if (!open) {
      setPhase('idle')
      return
    }
    setPhase('idle')
  }, [open])

  useEffect(() => {
    if (phase !== 'sweeping') return
    const glyphs = ['·', '░', '▒', '▓', '█', '¦', '‡', '≈', '∿', '¤']
    const id = window.setInterval(() => {
      let s = ''
      for (let i = 0; i < 12; i++) s += glyphs[Math.floor(Math.random() * glyphs.length)]
      setNoise(s)
    }, 80)
    const done = window.setTimeout(() => {
      clearInterval(id)
      setPhase('contact')
      setNoise('PROTECTOR · LOCK')
      window.setTimeout(() => {
        setPhase('done')
        onSuccessRef.current()
      }, 900)
    }, 1600)
    return () => {
      clearInterval(id)
      clearTimeout(done)
    }
  }, [phase])

  if (!open) return null

  return (
    <div className="spookbox-call" role="dialog" aria-label="Spookbox ITC">
      <div className="spookbox-call-card">
        <p className="spookbox-call-kicker">{SPOOKBOX.name.toUpperCase()} · ITC</p>
        <div className="spookbox-dial" aria-hidden>
          <span className="spookbox-noise">{noise}</span>
        </div>
        {phase === 'idle' && (
          <>
            <p className="spookbox-call-copy">
              Sweep the static. Call a good protector. The Archivist will not take the
              final seal until something kinder holds it still.
            </p>
            <div className="epilogue-choices">
              <button
                type="button"
                className="btn capture-btn"
                onClick={() => setPhase('sweeping')}
              >
                Call protector
              </button>
              <button type="button" className="btn ghost-btn" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </>
        )}
        {phase === 'sweeping' && (
          <p className="spookbox-call-copy dim">Listening through the noise…</p>
        )}
        {phase === 'contact' && (
          <p className="spookbox-call-copy emphasis">A protector answers. The vault staggers.</p>
        )}
      </div>
    </div>
  )
}

/** Full-screen protector stun VFX flash over the Archivist fight. */
export function ProtectorStunVfx({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="protector-stun-vfx" aria-hidden>
      <div className="protector-ring" />
      <p className="protector-label">PROTECTOR HOLD</p>
    </div>
  )
}
