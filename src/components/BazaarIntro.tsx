import { useState } from 'react'
import { PortraitFrame } from './PortraitFrame'

export type BazaarIntroChoice = 'listen' | 'skip'

interface Props {
  open: boolean
  /** Called when the intro finishes (listen or skip). Always marks complete upstream. */
  onComplete: (choice: BazaarIntroChoice) => void
}

type Step =
  | 'enter'
  | 'notice'
  | 'offer'
  | 'skip'
  | 'tale1'
  | 'tale2'
  | 'tale3'
  | 'tale4'

/**
 * Cold-open: Kern's Bizarre Bazaar — Rod Serling–cadence frame tale.
 * Separate stylized UI (not AR). Portrait: /portraits/bazaar-host.png
 */
export function BazaarIntro({ open, onComplete }: Props) {
  const [step, setStep] = useState<Step>('enter')

  if (!open) return null

  const finish = (choice: BazaarIntroChoice) => {
    onComplete(choice)
  }

  return (
    <div className="bazaar-intro" role="dialog" aria-label="Kern's Bizarre Bazaar">
      <div className="bazaar-veil" aria-hidden />
      <div className="bazaar-grain" aria-hidden />
      <div className="bazaar-card">
        <p className="bazaar-kicker">KERN&apos;S BIZARRE BAZAAR</p>
        <p className="bazaar-subtitle">A cold open · before the hunt</p>

        <PortraitFrame
          srcKey="bazaar-host"
          altKeys={['proprietor', 'serling-host', 'kern']}
          nameplate="The Proprietor"
          kicker="Dust · glass · measured irony"
          size="lg"
          className="bazaar-portrait-slot"
        />

        {step === 'enter' && (
          <>
            <p className="bazaar-line">
              Consider, if you will, a shop that sells what other shops refuse to
              name. Dust. Glass. Things that remember who held them last.
            </p>
            <p className="bazaar-line dim">
              The bell above the door does not ring so much as… clear its throat.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('notice')}
            >
              Step inside
            </button>
          </>
        )}

        {step === 'notice' && (
          <>
            <p className="bazaar-line">
              Ah. You&apos;ve found it — the camera in the display case. Most
              customers look past it. You did not.
            </p>
            <p className="bazaar-line dim">
              Good. Or unfortunate. In this establishment, those words share a
              coat rack.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('offer')}
            >
              …
            </button>
          </>
        )}

        {step === 'offer' && (
          <>
            <p className="bazaar-line emphasis">
              There&apos;s an interesting story about that camera… if you&apos;d
              care to hear it.
            </p>
            <div className="bazaar-choices">
              <button
                type="button"
                className="btn capture-btn bazaar-btn"
                onClick={() => setStep('tale1')}
              >
                Listen
              </button>
              <button
                type="button"
                className="btn ghost-btn bazaar-btn"
                onClick={() => setStep('skip')}
              >
                Not now
              </button>
            </div>
          </>
        )}

        {step === 'skip' && (
          <>
            <p className="bazaar-line">
              As you wish. Some doors open whether we knock or not.
            </p>
            <p className="bazaar-line dim">
              Take care how you aim the glass. Dusk is seldom empty-handed.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => finish('skip')}
            >
              Leave the bazaar
            </button>
          </>
        )}

        {step === 'tale1' && (
          <>
            <p className="bazaar-line">
              Submitted for your approval: an heir. The precise relation hardly
              matters. What matters is the will.
            </p>
            <p className="bazaar-line dim">
              An eccentric uncle — collector of hungers and hunter-circle
              oddments — has died under circumstances the papers declined to
              print.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('tale2')}
            >
              Continue
            </button>
          </>
        )}

        {step === 'tale2' && (
          <>
            <p className="bazaar-line">
              He left behind no fortune of consequence. No land. Only a single
              instrument: a camera whose lens was ground for seeing what polite
              daylight prefers to deny.
            </p>
            <p className="bazaar-line dim">
              They say he acquired the glass through darker channels than the
              auction houses admit. Quiet rooms. Quieter sellers.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('tale3')}
            >
              Continue
            </button>
          </>
        )}

        {step === 'tale3' && (
          <>
            <p className="bazaar-line">
              Men who hunt hungers still ask after such pieces. One of them —
              an Austrian of dry manners and wet boots — will want it returned,
              in time. That is a story for later.
            </p>
            <p className="bazaar-line dim">
              Tonight, that glass rests where you found it — in the case.
              The heir belongs to the telling. You who walked in are only
              here to hear it.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('tale4')}
            >
              Continue
            </button>
          </>
        )}

        {step === 'tale4' && (
          <>
            <p className="bazaar-line">
              Dusk is coming. The hungers already know the smell of that glass.
              You may call the instrument <em>Ghost Lens</em>.
            </p>
            <p className="bazaar-line emphasis">
              The dead already have a name for it.
            </p>
            <p className="bazaar-line dim serling-signoff">
              — and so, our story begins.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => finish('listen')}
            >
              Step into dusk
            </button>
          </>
        )}
      </div>
    </div>
  )
}
