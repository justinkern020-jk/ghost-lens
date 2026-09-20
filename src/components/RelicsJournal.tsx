import { LORE_COLLECTIBLES, type LoreCollectible } from '../lore/collectibles'
import { TARGET_LABELS, type TargetType } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  unlockedIds: Set<string>
}

const GHOST_TITLE: Record<TargetType, string> = {
  tombstone: 'The Unburied',
  ring: 'The Vow That Stayed',
  doll: 'Porcelain Audience',
  lake: 'What the Water Kept',
}

export function RelicsJournal({ open, onClose, unlockedIds }: Props) {
  if (!open) return null

  const unlocked = LORE_COLLECTIBLES.filter((c) => unlockedIds.has(c.id))

  return (
    <div className="relics-journal" role="dialog" aria-label="Lore relics">
      <header className="rj-header">
        <div>
          <p className="rj-kicker">FIELD RELICS</p>
          <h2>Lore / Relics</h2>
          <p className="rj-sub">
            {unlocked.length}/{LORE_COLLECTIBLES.length} scraps recovered
          </p>
        </div>
        <button type="button" className="btn ghost-btn" onClick={onClose}>
          Close
        </button>
      </header>

      {unlocked.length === 0 ? (
        <p className="rj-empty">
          No relics yet. Frame objects that remember the dead — wilted flowers, a jewelry
          box, a crib, a pier — and hold steady.
        </p>
      ) : (
        TARGET_LABELS.map((ghost) => {
          const scraps = unlocked.filter((c) => c.ghost === ghost)
          if (scraps.length === 0) return null
          return (
            <section key={ghost} className="rj-section">
              <h3>
                {GHOST_TITLE[ghost]}{' '}
                <span className="rj-ghost-tag">{ghost}</span>
              </h3>
              <ul className="rj-list">
                {scraps.map((c: LoreCollectible) => (
                  <li key={c.id} className="rj-entry">
                    <h4>{c.title}</h4>
                    <p className="rj-lore">{c.lore}</p>
                  </li>
                ))}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}
