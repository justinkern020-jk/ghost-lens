import { useEffect, useState } from 'react'
import { PortraitFrame } from './PortraitFrame'

interface Props {
  open: boolean
  /** Called when the Smile epilogue finishes (final card dismissed). */
  onComplete: () => void
}

type Step =
  | 'return'
  | 'apology'
  | 'door'
  | 'smile'
  | 'flash'
  | 'sting'
  | 'card'

/**
 * Meta ending after the second true-good (cure Keller) clear of the framed tale.
 * Frame story: the player is a bazaar customer / listener — not the heir who hunts.
 * The playable hunt was the proprietor's story; the sting captures the audience.
 * Same visual language as BazaarIntro — Serling host, measured irony, final sting.
 */
export function BazaarSmileEpilogue({ open, onComplete }: Props) {
  const [step, setStep] = useState<Step>('return')

  useEffect(() => {
    if (!open) {
      setStep('return')
      return
    }
    if (step !== 'flash') return
    const t = window.setTimeout(() => setStep('sting'), 900)
    return () => window.clearTimeout(t)
  }, [open, step])

  if (!open) return null

  return (
    <div
      className={`bazaar-intro bazaar-smile ${step === 'flash' ? 'bazaar-smile-flashing' : ''}`}
      role="dialog"
      aria-label="Kern's Bizarre Bazaar — Smile"
    >
      <div className="bazaar-veil" aria-hidden />
      <div className="bazaar-grain" aria-hidden />
      {step === 'flash' && <div className="bazaar-shutter-flash" aria-hidden />}
      <div className="bazaar-card">
        <p className="bazaar-kicker">KERN&apos;S BIZARRE BAZAAR</p>
        <p className="bazaar-subtitle">
          {step === 'card' ? 'A closing · for the listener' : 'An epilogue · after the tale'}
        </p>

        {step !== 'card' && (
          <PortraitFrame
            srcKey="bazaar-host"
            altKeys={['proprietor', 'serling-host', 'kern']}
            nameplate="The Proprietor"
            kicker="Dust · glass · measured irony"
            size="lg"
            className="bazaar-portrait-slot"
          />
        )}

        {step === 'return' && (
          <>
            <p className="bazaar-line">
              And so the tale ends where it began: among shelves that sell what
              polite shops refuse to name. Dust. Glass. A bell that clears its throat.
            </p>
            <p className="bazaar-line dim">
              You are still here — a customer, a listener — exactly as you were when
              the proprietor first noticed your eye on the display case.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('apology')}
            >
              …
            </button>
          </>
        )}

        {step === 'apology' && (
          <>
            <p className="bazaar-line">
              Forgive me. I have taken up rather a great deal of your time —
              more than a courteous host ought to claim from a guest who only
              meant to browse.
            </p>
            <p className="bazaar-line dim">
              The heir, the hungers, Herr Keller and his kinder moon — that was
              their story. Yours, I think, ought to be going.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('door')}
            >
              Continue
            </button>
          </>
        )}

        {step === 'door' && (
          <>
            <p className="bazaar-line">
              The door is where a visitor leaves a shop. Hinges. Threshold. Ordinary
              mercy.
            </p>
            <p className="bazaar-line dim">
              He waits, hands folded, as if the next courtesy were already framed.
            </p>
            <div className="bazaar-choices">
              <button
                type="button"
                className="btn capture-btn bazaar-btn"
                onClick={() => setStep('smile')}
              >
                Leave / step toward the door
              </button>
            </div>
          </>
        )}

        {step === 'smile' && (
          <>
            <p className="bazaar-line">
              You turn toward the street. Behind you, glass shifts in the case —
              the same camera that opened the evening&apos;s entertainment.
            </p>
            <p className="bazaar-line emphasis bazaar-smile-word">Smile.</p>
            <p className="bazaar-line dim">
              Soft. Almost kind. The sort of instruction one gives a listener before
              the portrait — or a specimen before the plate.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('flash')}
            >
              …
            </button>
          </>
        )}

        {step === 'flash' && (
          <>
            <p className="bazaar-line dim" aria-live="polite">
              A shutter. White. The Ghost Lens answers — aimed not at the heir of
              the tale, but at the one who stayed to hear it.
            </p>
          </>
        )}

        {step === 'sting' && (
          <>
            <p className="bazaar-line">
              Consider, if you will, a shop that sells stories the way other shops
              sell salt. The heir who cured the wolf — twice — was never standing
              where you stand. That was theater. Bait. A frame for an audience.
            </p>
            <p className="bazaar-line dim">
              The hungers in the tale were real enough. So was the glass. What the
              proprietor needed was not another hunter — only someone patient enough
              to listen until the shutter found them.
            </p>
            <p className="bazaar-line emphasis">
              You — the visitor, the listener — were a ghost all along.
            </p>
            <p className="bazaar-line dim serling-signoff">
              — the tale was bait; the lens kept the audience.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('card')}
            >
              …
            </button>
          </>
        )}

        {step === 'card' && (
          <>
            <p className="bazaar-kicker" style={{ marginTop: 24 }}>
              META ENDING · GHOST LENS
            </p>
            <h2 className="bazaar-smile-end-title">THE END · CAPTURED</h2>
            <p className="bazaar-line dim" style={{ textAlign: 'center' }}>
              SMILE
            </p>
            <p className="bazaar-line dim" style={{ textAlign: 'center', marginTop: 12 }}>
              The proprietor puts the listener&apos;s photograph away. The bell does
              not ring. Somewhere a crypt files a customer under glass — and under
              courtesy.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={onComplete}
            >
              Leave the bazaar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
