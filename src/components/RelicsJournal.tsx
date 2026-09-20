import { useState } from 'react'
import { LORE_COLLECTIBLES, type LoreCollectible } from '../lore/collectibles'
import type { SpiritKind } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  unlockedIds: Set<string>
}

/** Display order for journal sections (main four, then late game). */
const SPIRIT_SECTION_ORDER: SpiritKind[] = [
  'tombstone',
  'ring',
  'doll',
  'lake',
  'trial',
  'boss',
  'demon',
  'secret',
]

const GHOST_TITLE: Record<SpiritKind, string> = {
  tombstone: 'The Unburied',
  ring: 'The Vow That Stayed',
  doll: 'Porcelain Audience',
  lake: 'What the Water Kept',
  trial: 'The Thin One',
  boss: 'Threshold Warden',
  demon: 'The Empty Seat',
  secret: 'Pale Archivist',
}

/**
 * Cabals haunt bestiary art under /ghost-cards/{key}.png
 * boss → warden, secret → archivist; others match SpiritKind.
 */
const GHOST_CARD_KEY: Record<SpiritKind, string> = {
  tombstone: 'tombstone',
  ring: 'ring',
  doll: 'doll',
  lake: 'lake',
  trial: 'trial',
  boss: 'warden',
  demon: 'demon',
  secret: 'archivist',
}

function RelicImage({ imageKey, title }: { imageKey: string; title: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      className="rj-thumb"
      src={`/relics/${imageKey}.png`}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function HauntBestiaryCard({ kind, title }: { kind: SpiritKind; title: string }) {
  const [failed, setFailed] = useState(false)
  const cardKey = GHOST_CARD_KEY[kind]
  if (failed) return null
  return (
    <figure className="rj-haunt-card">
      <img
        className="rj-haunt-card-art"
        src={`/ghost-cards/${cardKey}.png`}
        alt={`${title} — Cabals haunt card`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <figcaption className="rj-haunt-card-cap">Bestiary · {cardKey}</figcaption>
    </figure>
  )
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
        SPIRIT_SECTION_ORDER.map((ghost) => {
          const scraps = unlocked.filter((c) => c.ghost === ghost)
          if (scraps.length === 0) return null
          return (
            <section key={ghost} className="rj-section">
              <h3>
                {GHOST_TITLE[ghost]}{' '}
                <span className="rj-ghost-tag">{ghost}</span>
              </h3>
              <HauntBestiaryCard kind={ghost} title={GHOST_TITLE[ghost]} />
              <ul className="rj-list">
                {scraps.map((c: LoreCollectible) => (
                  <li key={c.id} className="rj-entry">
                    <div className="rj-entry-row">
                      <RelicImage imageKey={c.imageKey} title={c.title} />
                      <div className="rj-entry-body">
                        <h4>{c.title}</h4>
                        <p className="rj-lore">{c.lore}</p>
                      </div>
                    </div>
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
