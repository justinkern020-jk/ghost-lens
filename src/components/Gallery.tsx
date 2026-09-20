import { useState } from 'react'
import type { Capture } from '../types'

interface Props {
  captures: Capture[]
  open: boolean
  onClose: () => void
  uniqueCount: number
  bossUnlocked: boolean
  bossDefeated: boolean
  playgroundUnlocked?: boolean
  demonDefeated?: boolean
}

export function Gallery({
  captures,
  open,
  onClose,
  uniqueCount,
  bossUnlocked,
  bossDefeated,
  playgroundUnlocked = false,
  demonDefeated = false,
}: Props) {
  const [selected, setSelected] = useState<Capture | null>(null)

  if (!open) return null

  const isEndgame = (c: Capture) =>
    c.isDemon || c.target === 'demon' || c.isBoss || c.target === 'boss'

  return (
    <div className="gallery-panel" role="dialog" aria-label="Polaroid inventory">
      <header className="gallery-header">
        <div>
          <h2>Polaroid Inventory</h2>
          <p className="gallery-sub">
            {uniqueCount}/4 sealed
            {bossUnlocked && !bossDefeated ? ' · Warden listening' : ''}
            {bossDefeated ? ' · Warden sealed' : ''}
            {playgroundUnlocked && !demonDefeated ? ' · Playground waiting' : ''}
            {demonDefeated ? ' · Demon sealed' : ''}
          </p>
        </div>
        <button type="button" className="btn ghost-btn" onClick={onClose}>
          Close
        </button>
      </header>

      {captures.length === 0 ? (
        <p className="gallery-empty">No spirits trapped yet. Capture to fill the stack.</p>
      ) : (
        <ul className="polaroid-grid">
          {captures.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={`polaroid-card ${c.isBoss || c.target === 'boss' ? 'boss-polaroid' : ''} ${c.isDemon || c.target === 'demon' ? 'demon-polaroid' : ''} ${c.isTrial || c.target === 'trial' ? 'trial-polaroid' : ''}`}
                style={{ ['--tilt' as string]: `${((i * 7) % 11) - 5}deg` }}
                onClick={() => setSelected(c)}
              >
                <img src={c.dataUrl} alt={`${c.lore.name} polaroid`} />
                <span className="polaroid-caption">{c.lore.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div
          className="lore-sheet"
          role="dialog"
          aria-label="Spirit lore"
          onClick={() => setSelected(null)}
        >
          <article
            className={`lore-card ${selected.isBoss || selected.target === 'boss' ? 'boss-lore' : ''} ${selected.isDemon || selected.target === 'demon' ? 'demon-lore' : ''} ${selected.isTrial || selected.target === 'trial' ? 'trial-lore' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              className="lore-still"
              src={selected.dataUrl}
              alt={selected.lore.name}
            />
            <div className="lore-body">
              <p className="lore-kicker">
                {selected.isDemon || selected.target === 'demon'
                  ? 'DEMON SEALED'
                  : selected.isBoss || selected.target === 'boss'
                    ? 'BOSS SEALED'
                    : selected.isTrial || selected.target === 'trial'
                      ? 'TRIAL · LESSER ECHO'
                      : selected.target.toUpperCase()}
                {' · '}
                {new Date(selected.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <h3>{selected.lore.name}</h3>
              <p className="lore-epithet">{selected.lore.epithet}</p>
              <blockquote className="lore-note">&ldquo;{selected.lore.trappedNote}&rdquo;</blockquote>
              <p className="lore-mode">
                Trapped via {selected.mode === 'webxr' ? 'WebXR anchor' : 'overlay lens'}
                {selected.loreVariant > 0 ? ` · variation ${selected.loreVariant + 1}` : ''}
                {isEndgame(selected) ? ' · endgame seal' : ''}
              </p>
              <button
                type="button"
                className="btn ghost-btn"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  )
}
