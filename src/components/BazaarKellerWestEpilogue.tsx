import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  /** Called when the Keller West origin epilogue finishes (final card dismissed). */
  onComplete: () => void
}

type Step =
  | 'frame'
  | 'boom'
  | 'gunslinger'
  | 'father'
  | 'jah'
  | 'serling'
  | 'card'

interface PanelProps {
  src: string
  alt: string
}

/** Cabals panel under /epilogue-west/ — silent miss if art not present yet. */
function WestPanel({ src, alt }: PanelProps) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
  }, [src])
  if (failed) {
    return (
      <div className="west-panel west-panel-missing" aria-hidden>
        <span>{src}</span>
      </div>
    )
  }
  return (
    <img
      className="west-panel"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Once-only mid-1800s American West boom-town epilogue after the first true-good
 * clear while NG+ is in play (Keller lycanthropy cure / demon-polaroid trade).
 *
 * Frame: the human holding the phone is the bazaar visitor. Young Keller / the
 * camera origin is fiction the proprietor tells — do not collapse visitor into heir.
 * Thematically encapsulates Ghost Lens: the plate that steals souls.
 */
export function BazaarKellerWestEpilogue({ open, onComplete }: Props) {
  const [step, setStep] = useState<Step>('frame')

  useEffect(() => {
    if (!open) setStep('frame')
  }, [open])

  if (!open) return null

  return (
    <div
      className="bazaar-intro bazaar-keller-west"
      role="dialog"
      aria-label="Kern's Bizarre Bazaar — West Keller origin"
    >
      <div className="bazaar-veil" aria-hidden />
      <div className="bazaar-grain" aria-hidden />
      <div className="bazaar-card">
        <p className="bazaar-kicker">KERN&apos;S BIZARRE BAZAAR</p>
        <p className="bazaar-subtitle">
          {step === 'card'
            ? 'An origin · glass that remembers'
            : 'An epilogue · after the cure'}
        </p>

        {step === 'frame' && (
          <>
            <p className="bazaar-line">
              Soft light on the shelves again. The proprietor sets a dust-soft plate
              on the counter — not for sale. For the telling.
            </p>
            <p className="bazaar-line dim">
              You who walked into Kern&apos;s Bizarre Bazaar — customer, guest, the one
              holding the glass — are still only that. What follows is not your life.
              It is a story he owes the evening: how a certain Austrian first learned
              what a camera could take.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('boom')}
            >
              Listen
            </button>
          </>
        )}

        {step === 'boom' && (
          <>
            <WestPanel
              src="/epilogue-west/west-boom-town.png"
              alt="American West boom town — mid-1800s"
            />
            <p className="bazaar-line">
              Mid-century. A boom town of timber fronts and alkali dust. A German
              photographer has set his tripod where the street thins — attempting to
              photograph Native Americans who will not hold still for the plate, or
              for him.
            </p>
            <p className="bazaar-line dim">
              The bellows breathe. The town watches the watching.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('gunslinger')}
            >
              …
            </button>
          </>
        )}

        {step === 'gunslinger' && (
          <>
            <WestPanel
              src="/epilogue-west/west-gunslinger.png"
              alt="Gunslinger in the boom town"
            />
            <p className="bazaar-line">
              A gunslinger tips his hat without kindness. Spits once into the dust.
            </p>
            <p className="bazaar-line emphasis">
              &ldquo;Don&apos;t bother. They think it steals their souls.&rdquo;
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('father')}
            >
              …
            </button>
          </>
        )}

        {step === 'father' && (
          <>
            <WestPanel
              src="/epilogue-west/west-young-keller.png"
              alt="Young Keller beside his father"
            />
            <p className="bazaar-line">
              At the photographer&apos;s elbow: a boy. Young Keller — the son who will
              one day wear a kinder moon and a crueller one.
            </p>
            <p className="bazaar-line dim">
              The father considers the street, the glass, the refusal.
            </p>
            <p className="bazaar-line emphasis">&ldquo;Interesting.&rdquo;</p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('jah')}
            >
              …
            </button>
          </>
        )}

        {step === 'jah' && (
          <>
            <WestPanel
              src="/epilogue-west/west-young-keller.png"
              alt="Young Keller smiles"
            />
            <p className="bazaar-line">
              Young Keller smiles — small, already measuring the world through a
              future frame.
            </p>
            <p className="bazaar-line emphasis">&ldquo;Jah, very.&rdquo;</p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={() => setStep('serling')}
            >
              …
            </button>
          </>
        )}

        {step === 'serling' && (
          <>
            <WestPanel
              src="/epilogue-west/west-serling.png"
              alt="The bazaar host — Serling cadence"
            />
            <p className="bazaar-line">
              Dust settles on the counter again. The proprietor folds his hands the
              way a host folds an evening closed.
            </p>
            <p className="bazaar-line emphasis">
              &ldquo;Perhaps they were right.&rdquo;
            </p>
            <p className="bazaar-line dim serling-signoff">
              — a boom-town plate; a boy who learned the shutter; a lens that still
              keeps what it takes.
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
              ORIGIN · GHOST LENS
            </p>
            <h2 className="bazaar-west-end-title">WEST · THE PLATE REMEMBERS</h2>
            <p className="bazaar-line dim" style={{ textAlign: 'center' }}>
              Herr Keller&apos;s first lesson was not the moon.
            </p>
            <p
              className="bazaar-line dim"
              style={{ textAlign: 'center', marginTop: 12 }}
            >
              You who listened are still the customer. The heir in the tale never
              stood where you stand. The glass between you and the story is the same
              glass that opened the evening.
            </p>
            <button
              type="button"
              className="btn capture-btn bazaar-btn"
              onClick={onComplete}
            >
              Leave the telling
            </button>
          </>
        )}
      </div>
    </div>
  )
}
