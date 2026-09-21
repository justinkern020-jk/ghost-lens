import { useState } from 'react'

interface Props {
  /** Primary CTA — enter existing intro / boot hub flow. */
  onBegin: () => void
  /** Small skip for returning players (same destination as Begin). */
  onSkip?: () => void
  /** Show the skip control (returning players / intro already seen). */
  showSkip?: boolean
}

/**
 * Cabals-style full-bleed title card before bazaar intro / boot hub.
 * Art: /title-screen.png is 9:16 (GHOST LENS lettering baked in);
 * /title-screen-landscape.png is the wide fallback. Cream/gold CSS backup if art fails.
 */
export function TitleSplash({ onBegin, onSkip, showSkip = false }: Props) {
  const [artFailed, setArtFailed] = useState(false)

  return (
    <div
      className={`title-splash ${artFailed ? 'title-splash-fallback' : 'title-splash-has-art'}`}
      role="dialog"
      aria-label="Ghost Lens"
    >
      {!artFailed && (
        <picture>
          <source
            media="(orientation: landscape) and (min-width: 700px)"
            srcSet="/title-screen-landscape.png"
          />
          <img
            className="title-splash-art"
            src="/title-screen.png"
            alt=""
            aria-hidden
            onError={() => setArtFailed(true)}
          />
        </picture>
      )}
      <div className="title-splash-scrim" aria-hidden />
      <div className="title-splash-grain" aria-hidden />

      {showSkip && (
        <button
          type="button"
          className="btn ghost-btn title-splash-skip"
          onClick={() => (onSkip ?? onBegin)()}
        >
          Skip
        </button>
      )}

      <div className="title-splash-inner">
        {/* Art already carries title + tagline — only show CSS copy as fallback. */}
        {artFailed && (
          <>
            <p className="title-splash-kicker">FIELD INSTRUMENT</p>
            <h1 className="title-splash-title">GHOST LENS</h1>
            <p className="title-splash-tagline">
              A field instrument for what photographs should not keep
            </p>
          </>
        )}
        <button
          type="button"
          className="btn capture-btn title-splash-begin"
          onClick={onBegin}
        >
          Enter the bazaar
        </button>
      </div>
    </div>
  )
}
