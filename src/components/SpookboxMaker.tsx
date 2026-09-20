import { useState } from 'react'
import { PortraitFrame } from './PortraitFrame'
import { KELLER_CHARM } from '../ngplus/kellerCharm'
import { SPOOKBOX } from '../ngplus/spookbox'

export type SpookboxMakerChoice = 'trade' | 'leave' | null

interface Props {
  open: boolean
  hasCharm: boolean
  alreadyHasBox: boolean
  onResolved: (choice: SpookboxMakerChoice) => void
  onClose: () => void
}

type Step = 'arrive' | 'pitch' | 'ask' | 'resolved'

/**
 * Separate UI screen — Spookbox Maker (Justin-coded mysterious character).
 * Portrait: /portraits/spookbox-maker.png
 * Appears only at dusk + workshop/garage/radio/toolbox (or ?forceSpookboxMaker=1).
 */
export function SpookboxMaker({
  open,
  hasCharm,
  alreadyHasBox,
  onResolved,
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>('arrive')
  const [choice, setChoice] = useState<SpookboxMakerChoice>(null)

  if (!open) return null

  const resolve = (c: 'trade' | 'leave') => {
    setChoice(c)
    setStep('resolved')
    const delay = c === 'trade' ? 3200 : 2400
    window.setTimeout(() => onResolved(c), delay)
  }

  return (
    <div className="epilogue-stranger spookbox-maker" role="dialog" aria-label="Spookbox Maker">
      <div className="epilogue-veil" aria-hidden />
      <div className="epilogue-card">
        <p className="epilogue-kicker">MYSTERIOUS · WORKBENCH</p>
        <PortraitFrame
          srcKey="spookbox-maker"
          altKeys={['maker', 'justin-maker']}
          nameplate="Spookbox Maker"
          kicker="Justin-coded · solder & static"
          size="lg"
          className="spookbox-maker-portrait"
        />

        {step === 'arrive' && (
          <>
            <p className="epilogue-line">
              He smells of flux and old batteries. Not Keller — younger hands, same dusk.
              A half-soldered box ticks on the bench like a second heart.
            </p>
            <button type="button" className="btn capture-btn" onClick={() => setStep('pitch')}>
              …
            </button>
          </>
        )}

        {step === 'pitch' && (
          <>
            <p className="epilogue-line">
              Built a <strong>{SPOOKBOX.name}</strong>. Sweeps the noise the way the lens
              sweeps the light. Might help when a vault files you under the wrong name.
            </p>
            <p className="epilogue-line dim">
              Protectors answer it. Not hungers. That&apos;s the trick — and the price.
            </p>
            <button type="button" className="btn capture-btn" onClick={() => setStep('ask')}>
              Continue
            </button>
          </>
        )}

        {step === 'ask' && (
          <>
            {alreadyHasBox ? (
              <>
                <p className="epilogue-line">
                  You already carry one of my boxes. The dial remembers your thumb.
                  I don&apos;t double-deal the same night.
                </p>
                <button type="button" className="btn ghost-btn" onClick={() => resolve('leave')}>
                  Step back
                </button>
              </>
            ) : (
              <>
                <p className="epilogue-line emphasis">
                  I want {KELLER_CHARM.name}. The Austrian&apos;s strap-silver. Fair trade
                  for a dial that calls the good ones.
                </p>
                {hasCharm ? (
                  <div className="epilogue-choices">
                    <button
                      type="button"
                      className="btn capture-btn"
                      onClick={() => resolve('trade')}
                    >
                      Trade the silver charm
                    </button>
                    <button
                      type="button"
                      className="btn ghost-btn"
                      onClick={() => resolve('leave')}
                    >
                      Keep the charm
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="epilogue-line cold">
                      No charm on your strap. The box stays cold. Come back when the hunter
                      has thanked you — or when silver remembers your name.
                    </p>
                    <button type="button" className="btn ghost-btn" onClick={() => resolve('leave')}>
                      Leave empty-handed
                    </button>
                  </>
                )}
              </>
            )}
          </>
        )}

        {step === 'resolved' && choice === 'trade' && (
          <>
            <p className="epilogue-line">
              Silver for static. He pockets the charm like a prayer and presses the{' '}
              {SPOOKBOX.name} into your palm. Warm. Wrong. Useful.
            </p>
            <p className="epilogue-line dim">
              Sweep. Listen. Call a protector when the vault will not take the final seal.
              Only way to land the finishing blow on the Pale Archivist.
            </p>
          </>
        )}

        {step === 'resolved' && choice === 'leave' && (
          <p className="epilogue-line cold">
            {hasCharm && !alreadyHasBox
              ? 'He shrugs. The box keeps ticking. Dusk does not wait for second thoughts.'
              : 'He turns back to the solder. The dusk takes his outline first.'}
          </p>
        )}

        {step === 'resolved' && (
          <button
            type="button"
            className="btn ghost-btn"
            style={{ marginTop: 12, width: '100%' }}
            onClick={onClose}
          >
            Back to the lens
          </button>
        )}
      </div>
    </div>
  )
}
