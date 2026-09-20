interface Props {
  onRetry: () => void
  /** Return to boot hub without retrying the hunt. */
  onLeave?: () => void
  /** Special refuse-path death after Keller’s werewolf attack. */
  hunterDeath?: boolean
}

/** Blackout game-over: flatline + "Died of fright" (or hunter’s due). */
export function DeathScreen({ onRetry, onLeave, hunterDeath = false }: Props) {
  return (
    <div
      className={`death-screen ${hunterDeath ? 'hunter-death' : ''}`}
      role="alertdialog"
      aria-labelledby="death-title"
    >
      <div className="death-flatline" aria-hidden>
        <svg viewBox="0 0 320 40" preserveAspectRatio="none">
          <polyline
            className="flatline-path"
            points="0,20 80,20 95,8 110,32 125,20 320,20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <line className="flatline-hold" x1="125" y1="20" x2="320" y2="20" />
        </svg>
      </div>
      <p className="death-bpm">BPM — — —</p>
      <h1 id="death-title">Died of fright</h1>
      <p className="death-sub">
        {hunterDeath
          ? 'The hunter takes his due.'
          : 'The entity reached you. Capture sooner next time.'}
      </p>
      <button type="button" className="btn capture-btn death-retry" onClick={onRetry}>
        Retry
      </button>
      {onLeave && (
        <button type="button" className="btn ghost-btn leave-hunt-btn" onClick={onLeave}>
          Leave hunt
        </button>
      )}
    </div>
  )
}
