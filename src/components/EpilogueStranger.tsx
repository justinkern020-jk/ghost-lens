import { useState } from 'react'
import { PortraitFrame } from './PortraitFrame'

export type EpilogueChoice = 'accept' | 'refuse' | null

interface Props {
  open: boolean
  onResolved: (choice: EpilogueChoice) => void
}

type Step = 'arrive' | 'praise' | 'ask' | 'resolved'

/**
 * Epilogue UI screen (not AR): Van Helsing–type Austrian hunter — Herr Keller.
 * Congratulates the hunt, then calmly asks for his camera back.
 * Portrait slot: /portraits/herr-keller.png
 */
export function EpilogueStranger({ open, onResolved }: Props) {
  const [step, setStep] = useState<Step>('arrive')
  const [choice, setChoice] = useState<EpilogueChoice>(null)

  if (!open) return null

  const resolve = (c: 'accept' | 'refuse') => {
    setChoice(c)
    setStep('resolved')
    window.setTimeout(() => onResolved(c), c === 'accept' ? 2800 : 3200)
  }

  return (
    <div className="epilogue-stranger" role="dialog" aria-label="Herr Keller">
      <div className="epilogue-veil" aria-hidden />
      <div className="epilogue-card">
        <p className="epilogue-kicker">EPILOGUE · OLD WORLD</p>
        <PortraitFrame
          srcKey="herr-keller"
          altKeys={['keller', 'van-helsing']}
          nameplate="Herr Keller"
          kicker="Austrian · hunter of hungers"
          size="lg"
          className="keller-portrait-slot"
        />

        {step === 'arrive' && (
          <>
            <p className="epilogue-line">
              Ah. So. You are still standing. Gut. I watched from a little
              distance — one does not interrupt a proper seal.
            </p>
            <button
              type="button"
              className="btn capture-btn"
              onClick={() => setStep('praise')}
            >
              …
            </button>
          </>
        )}

        {step === 'praise' && (
          <>
            <p className="epilogue-line">
              You hunted well. Dirt, vow, porcelain, lake — and the empty seat
              besides. Few keep their pulse long enough for the playground.
              Fewer still bring the photographs home in the correct order.
            </p>
            <p className="epilogue-line dim">
              I am… pleased. In the dry way. You understand.
            </p>
            <button
              type="button"
              className="btn capture-btn"
              onClick={() => setStep('ask')}
            >
              Continue
            </button>
          </>
        )}

        {step === 'ask' && (
          <>
            <p className="epilogue-line">
              Now then. Calmly. I will ask for what was always mine.
            </p>
            <p className="epilogue-line emphasis">
              May I have my camera back?
            </p>
            <p className="epilogue-line dim">
              Ghost Lens — ja, that is the name you gave it — was my instrument
              before it was your evening. The hungers know its glass. I would
              like it returned.
            </p>
            <div className="epilogue-choices">
              <button
                type="button"
                className="btn capture-btn"
                onClick={() => resolve('accept')}
              >
                Return the lens
              </button>
              <button
                type="button"
                className="btn ghost-btn"
                onClick={() => resolve('refuse')}
              >
                Refuse
              </button>
            </div>
          </>
        )}

        {step === 'resolved' && choice === 'accept' && (
          <p className="epilogue-line">
            Danke. You have good manners for someone who has looked into empty
            seats. Keep the polaroids. The Favor, too — the Undertaker settles
            his own accounts. I take only the glass. Auf Wiedersehen… for now.
          </p>
        )}

        {step === 'resolved' && choice === 'refuse' && (
          <p className="epilogue-line cold">
            So. You keep what you did not forge. Interesting. I will not take it
            from your hands — that would be crude. But the hungers remember who
            holds the lens. And I… I have a long memory, and very comfortable
            shoes. We will speak again. Perhaps when the dusk is less kind.
          </p>
        )}
      </div>
    </div>
  )
}

/** Quiet THE END card after Keller resolves. */
export function EndTitleCard({
  open,
  refused,
  onDismiss,
}: {
  open: boolean
  refused: boolean
  onDismiss?: () => void
}) {
  if (!open) return null
  return (
    <div className="finale-endcard-root" role="dialog" aria-label="The End">
      <div className="finale-endcard">
        <p className="finale-end-kicker">PLAYGROUND · SEALED</p>
        <h2 className="finale-end-title">THE END</h2>
        <p className="finale-end-epilogue">
          {refused
            ? 'The photographs remain. The lens remains. Somewhere, comfortable shoes are walking.'
            : 'You brought the photographs home. The glass went with the man who named the dusk. Do not check which seat is empty.'}
        </p>
        {onDismiss && (
          <button type="button" className="btn ghost-btn" onClick={onDismiss}>
            Linger a while
          </button>
        )}
      </div>
    </div>
  )
}
