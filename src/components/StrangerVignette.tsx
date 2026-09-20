import type { StrangerClue } from '../shop/strangerClues'

interface Props {
  clue: StrangerClue | null
  onDismiss: () => void
}

/** Period vignette — mysterious stranger whisper, not a quest log. */
export function StrangerVignette({ clue, onDismiss }: Props) {
  if (!clue) return null

  return (
    <div
      className="stranger-vignette"
      role="dialog"
      aria-label="Mysterious stranger"
      onClick={onDismiss}
    >
      <article className="stranger-card" onClick={(e) => e.stopPropagation()}>
        <p className="stranger-kicker">A STRANGER DRAWS NEAR</p>
        <div className="stranger-silhouette" aria-hidden>
          <div className="str-hat" />
          <div className="str-head" />
          <div className="str-coat" />
        </div>
        <h3>{clue.stranger}</h3>
        <blockquote className="stranger-whisper">&ldquo;{clue.whisper}&rdquo;</blockquote>
        <p className="stranger-aside">They are already gone. The words stay.</p>
        <button type="button" className="btn ghost-btn" onClick={onDismiss}>
          Look away
        </button>
      </article>
    </div>
  )
}
