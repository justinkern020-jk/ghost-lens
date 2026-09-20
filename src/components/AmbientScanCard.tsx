import { useState } from 'react'
import type { AmbientScanEntry } from '../lore/ambientScans'

interface Props {
  entry: AmbientScanEntry
  onDismiss: () => void
}

function AmbientCardArt({ imageKey, title }: { imageKey: string; title: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      className="ambient-scan-art"
      src={`/ambient-cards/${imageKey}.png`}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

/** Full Cabals-style item card — diegetic Ghost Lens reading of a mundane object. */
export function AmbientScanCard({ entry, onDismiss }: Props) {
  return (
    <div
      className="ambient-scan-card"
      role="dialog"
      aria-label={`Lens reading: ${entry.title}`}
      onClick={onDismiss}
    >
      <article className="ambient-scan-panel" onClick={(e) => e.stopPropagation()}>
        <p className="ambient-scan-kicker">THE LENS SEES · ITEM CARD</p>
        <AmbientCardArt imageKey={entry.imageKey} title={entry.title} />
        <div className="ambient-scan-body">
          <h3 className="ambient-scan-title">{entry.title}</h3>
          <p className="ambient-scan-reading">{entry.reading}</p>
        </div>
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
