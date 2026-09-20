import type { Capture } from '../types'

interface Props {
  captures: Capture[]
  open: boolean
  onClose: () => void
}

export function Gallery({ captures, open, onClose }: Props) {
  if (!open) return null
  return (
    <div className="gallery-panel" role="dialog" aria-label="Spirit gallery">
      <header className="gallery-header">
        <h2>Spirit Gallery</h2>
        <button type="button" className="btn ghost-btn" onClick={onClose}>
          Close
        </button>
      </header>
      {captures.length === 0 ? (
        <p className="gallery-empty">No spirits captured yet.</p>
      ) : (
        <ul className="gallery-grid">
          {captures.map((c) => (
            <li key={c.id} className="gallery-card">
              <img src={c.dataUrl} alt={`${c.target} capture`} />
              <div className="gallery-meta">
                <strong>{c.target}</strong>
                <span>
                  {new Date(c.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="mode-tag">{c.mode}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
