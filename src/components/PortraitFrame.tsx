import { useState } from 'react'

interface Props {
  /** Basename under /portraits/ without extension, e.g. "undertaker" or "herr-keller". */
  srcKey: string
  /** Optional fallback keys tried in order if primary 404s. */
  altKeys?: string[]
  /** Nameplate under / beside the frame. */
  nameplate: string
  /** Small kicker above the name. */
  kicker?: string
  /** CSS size variant. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Labeled portrait slot for UI panels (shop / strangers / epilogue).
 * Not AR — separate screen art. Loads `/portraits/{key}.png`; on miss,
 * shows a tasteful silhouette placeholder with the nameplate.
 */
export function PortraitFrame({
  srcKey,
  altKeys = [],
  nameplate,
  kicker,
  size = 'md',
  className = '',
}: Props) {
  const candidates = [`/portraits/${srcKey}.png`, ...altKeys.map((k) => `/portraits/${k}.png`)]
  const [idx, setIdx] = useState(0)
  const [failed, setFailed] = useState(false)

  const src = !failed && idx < candidates.length ? candidates[idx] : null

  return (
    <figure className={`portrait-frame size-${size} ${failed || !src ? 'placeholder' : 'has-art'} ${className}`}>
      <div className="portrait-mat">
        {src ? (
          <img
            src={src}
            alt={nameplate}
            className="portrait-img"
            onError={() => {
              if (idx + 1 < candidates.length) setIdx((i) => i + 1)
              else setFailed(true)
            }}
          />
        ) : (
          <div className="portrait-silhouette" aria-hidden>
            <span className="ps-hat" />
            <span className="ps-head" />
            <span className="ps-shoulders" />
            <span className="ps-slot-label">AI art slot</span>
          </div>
        )}
      </div>
      <figcaption className="portrait-nameplate">
        {kicker && <span className="portrait-kicker">{kicker}</span>}
        <span className="portrait-name">{nameplate}</span>
        {(failed || !src) && (
          <span className="portrait-path">/portraits/{srcKey}.png</span>
        )}
      </figcaption>
    </figure>
  )
}

/** Map stranger clue id → portrait basename. */
export function strangerPortraitKey(clueId: string): string {
  return `stranger-${clueId}`
}

/** Optional friendly aliases Justin may drop by prop name. */
export function strangerPortraitAliases(clueId: string): string[] {
  const map: Record<string, string[]> = {
    wet_threshold: ['stranger-candle', 'stranger-umbrella'],
    grave_measure: ['stranger-church', 'stranger-cross'],
    vacant_glass: ['stranger-mirror', 'stranger-book'],
    vow_thread: ['stranger-bouquet', 'stranger-flowers'],
    empty_seat: ['stranger-swing', 'stranger-clock'],
  }
  return map[clueId] ?? []
}
