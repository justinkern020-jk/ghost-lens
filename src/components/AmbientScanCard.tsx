import type { AmbientScanEntry } from '../lore/ambientScans'

interface Props {
  entry: AmbientScanEntry
  onDismiss: () => void
}

/** Brief inspect overlay — diegetic Ghost Lens reading of a mundane object. */
export function AmbientScanCard({ entry, onDismiss }: Props) {
  return (
    <div
      className="ambient-scan-card"
      role="dialog"
      aria-label={`Lens reading: ${entry.title}`}
      onClick={onDismiss}
    >
      <article className="ambient-scan-panel" onClick={(e) => e.stopPropagation()}>
        <p className="ambient-scan-kicker">THE LENS SEES</p>
        <h3 className="ambient-scan-title">{entry.title}</h3>
        <p className="ambient-scan-reading">{entry.reading}</p>
        {entry.clue && (
          <p className={`ambient-scan-clue clue-${entry.clue.kind}`}>
            <span className="ambient-scan-clue-label">A softer murmur</span>
            {entry.clue.text}
          </p>
        )}
        <button type="button" className="btn ghost-btn" onClick={onDismiss}>
          Look away
        </button>
      </article>
    </div>
  )
}
