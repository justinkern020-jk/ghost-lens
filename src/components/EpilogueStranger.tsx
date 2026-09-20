import { useState } from 'react'
import { PortraitFrame } from './PortraitFrame'
import { KELLER_CHARM } from '../ngplus/kellerCharm'

export type EpilogueChoice = 'accept' | 'refuse' | 'trade' | null

interface Props {
  open: boolean
  /** True-good-ending path: player kept the demon polaroid and can trade it. */
  tradeMode?: boolean
  onResolved: (choice: EpilogueChoice) => void
}

type Step = 'arrive' | 'praise' | 'ask' | 'tradeAsk' | 'resolved'

/**
 * Epilogue UI (not AR): Austrian Van Helsing–type — Herr Keller.
 * Normal: asks for his camera back (Return / Refuse).
 * True end: offers to trade the kept demon polaroid to cure his lycanthropy.
 * Portrait: /portraits/herr-keller.png
 */
export function EpilogueStranger({ open, tradeMode = false, onResolved }: Props) {
  const [step, setStep] = useState<Step>('arrive')
  const [choice, setChoice] = useState<EpilogueChoice>(null)

  if (!open) return null

  const resolve = (c: 'accept' | 'refuse' | 'trade') => {
    setChoice(c)
    setStep('resolved')
    const delay = c === 'refuse' ? 2200 : c === 'trade' ? 3600 : 3000
    window.setTimeout(() => onResolved(c), delay)
  }

  return (
    <div className="epilogue-stranger" role="dialog" aria-label="Herr Keller">
      <div className="epilogue-veil" aria-hidden />
      <div className="epilogue-card">
        <p className="epilogue-kicker">
          {tradeMode ? 'TRUE ENDING · OLD WORLD' : 'EPILOGUE · OLD WORLD'}
        </p>
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
              {tradeMode
                ? 'Ah. You kept something the ground wanted. Brave — or foolish. With me, those are often the same coat.'
                : 'Ah. So. You are still standing. Gut. I watched from a little distance — one does not interrupt a proper seal.'}
            </p>
            <button
              type="button"
              className="btn capture-btn"
              onClick={() => setStep(tradeMode ? 'tradeAsk' : 'praise')}
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
            <p className="epilogue-line emphasis">May I have my camera back?</p>
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

        {step === 'tradeAsk' && (
          <>
            <p className="epilogue-line">
              The Empty Seat’s photograph still sits in your hand. Hell did not
              take it. That means the seal is incomplete — and so am I.
            </p>
            <p className="epilogue-line dim">
              I will not lie: the moon has been… unkind. Boots that fit a man
              do not always fit what walks after midnight. A demon print, freely
              given, can quiet an older curse. Mine.
            </p>
            <p className="epilogue-line emphasis">
              Will you trade the demon polaroid — and cure what the hunt made of
              me?
            </p>
            <div className="epilogue-choices">
              <button
                type="button"
                className="btn capture-btn"
                onClick={() => resolve('trade')}
              >
                Trade the demon photo
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
          <>
            <p className="epilogue-line">
              Danke. You have good manners for someone who has looked into empty
              seats. Keep the polaroids. The Insight, too — the Undertaker settles
              his own accounts. I take only the glass.
            </p>
            <p className="epilogue-line emphasis">
              Take this — {KELLER_CHARM.name}. A silver charm from my strap.
              Hungers hesitate a half-step longer for those who return what was
              borrowed.
            </p>
            <p className="epilogue-line dim">
              Auf Wiedersehen… for now. If you hunt again, the photographs may
              speak in letters. Listen.
            </p>
          </>
        )}

        {step === 'resolved' && choice === 'trade' && (
          <>
            <p className="epilogue-line">
              You place the Empty Seat into his gloved hand. For a moment the air
              smells of playground iron and wet stone — then only of tobacco and
              wool.
            </p>
            <p className="epilogue-line emphasis">
              The change leaves him. Shoulders settle. Eyes stay human. He laughs
              once, quiet, almost embarrassed.
            </p>
            <p className="epilogue-line">
              Gut. Gut. Keep the Ghost Lens. You have earned the glass — and my
              name as something other than a warning. The moon can find another
              fool. Not this one.
            </p>
            <p className="epilogue-line dim">
              He tips his hat with living fingers. No comfortable shoes walking
              away hungry. Only a hunter going home.
            </p>
          </>
        )}

        {step === 'resolved' && choice === 'refuse' && !tradeMode && (
          <p className="epilogue-line cold">
            So. You keep what you did not forge. Interesting. I will not argue
            with hands. I will… change the terms.
          </p>
        )}

        {step === 'resolved' && choice === 'refuse' && tradeMode && (
          <p className="epilogue-line cold">
            You keep the demon print. You keep the curse on my bones. Very well.
            The moon does not negotiate — and neither, tonight, do I.
          </p>
        )}
      </div>
    </div>
  )
}

/** Quiet THE END card after Keller resolves (non-werewolf paths). */
export function EndTitleCard({
  open,
  refused,
  trueGood,
  onDismiss,
}: {
  open: boolean
  refused: boolean
  trueGood?: boolean
  onDismiss?: () => void
}) {
  if (!open) return null
  return (
    <div className="finale-endcard-root" role="dialog" aria-label="The End">
      <div className="finale-endcard">
        <p className="finale-end-kicker">
          {trueGood ? 'TRUE ENDING · CURED' : 'PLAYGROUND · SEALED'}
        </p>
        <h2 className="finale-end-title">{trueGood ? 'A QUIET MOON' : 'THE END'}</h2>
        <p className="finale-end-epilogue">
          {trueGood
            ? 'You gave away the Empty Seat and kept the man. The lens stays. The wolf does not. Somewhere a crypt still files your name under kindness.'
            : refused
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
