import type { StrangerClue } from '../shop/strangerClues'
import {
  PortraitFrame,
  strangerPortraitAliases,
  strangerPortraitKey,
} from './PortraitFrame'

interface Props {
  clue: StrangerClue | null
  onDismiss: () => void
}

/**
 * Separate UI panel — mysterious stranger whisper.
 * Portrait slot for AI art; not an AR person in the camera world.
 */
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
        <PortraitFrame
          srcKey={strangerPortraitKey(clue.id)}
          altKeys={strangerPortraitAliases(clue.id)}
          nameplate={clue.stranger}
          kicker="Edge-walker · not the shop"
          size="md"
          className="stranger-portrait-slot"
        />
        <blockquote className="stranger-whisper">&ldquo;{clue.whisper}&rdquo;</blockquote>
        <p className="stranger-aside">They are already gone. The words stay.</p>
        <button type="button" className="btn ghost-btn" onClick={onDismiss}>
          Look away
        </button>
      </article>
    </div>
  )
}
