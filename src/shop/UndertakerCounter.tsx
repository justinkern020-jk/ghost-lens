import { useEffect, useState } from 'react'
import { PortraitFrame } from '../components/PortraitFrame'
import { OCCULT_CATALOG, type OccultItemId, type OccultItemDef } from './favorStore'
import type { DreadAudio } from '../audio/dreadAudio'

interface Props {
  open: boolean
  onClose: () => void
  insight: number
  owned: OccultItemId[]
  onBuy: (id: OccultItemId) => void
  /** Equipped / ready-to-use item for next fight (optional). */
  equipped: OccultItemId | null
  onEquip: (id: OccultItemId | null) => void
  /** Quiet post-hunt after the playground finale. */
  postGame?: boolean
  /** True only on Return (accept) ending — Keller took the glass. Must stay false after true-good cure (you keep it). */
  lensReturned?: boolean
  /** Shared dread/atmosphere audio (shop bell + melancholy bed). */
  audio?: DreadAudio
}

function ShopCardArt({ imageKey, name }: { imageKey: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      className="ut-item-art"
      src={`/shop-cards/${imageKey}.png`}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

function ItemRow({
  item,
  owned,
  insight,
  equipped,
  onBuy,
  onEquip,
}: {
  item: OccultItemDef
  owned: boolean
  insight: number
  equipped: boolean
  onBuy: () => void
  onEquip: () => void
}) {
  const canBuy = !owned && insight >= item.cost
  return (
    <li className={`undertaker-item ${owned ? 'owned' : ''}`}>
      <div className="ut-item-row">
        <ShopCardArt imageKey={item.imageKey} name={item.name} />
        <div className="ut-item-body">
          <div className="ut-item-head">
            <h3>{item.name}</h3>
            <span className="ut-cost">{owned ? 'In your keeping' : `${item.cost} Insight`}</span>
          </div>
          <p className="ut-epithet">{item.epithet}</p>
          <p className="ut-pitch">&ldquo;{item.pitch}&rdquo;</p>
          <p className="ut-effect">{item.effect}</p>
          <div className="ut-item-actions">
            {!owned ? (
              <button
                type="button"
                className="btn ut-buy"
                disabled={!canBuy}
                onClick={onBuy}
              >
                {canBuy ? 'Accept the measure' : insight < item.cost ? 'Insufficient Insight' : 'Sold'}
              </button>
            ) : (
              <button
                type="button"
                className={`btn ut-equip ${equipped ? 'on' : ''}`}
                onClick={onEquip}
              >
                {equipped ? 'Prepared for the hunt' : 'Prepare for the hunt'}
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export function UndertakerCounter({
  open,
  onClose,
  insight,
  owned,
  onBuy,
  equipped,
  onEquip,
  postGame = false,
  lensReturned = false,
  audio,
}: Props) {
  useEffect(() => {
    if (!open || !audio) return
    let cancelled = false
    void audio.ensure().then(() => {
      if (cancelled) return
      audio.playShopBell()
      audio.setMelancholy(true)
    })
    return () => {
      cancelled = true
      audio.setMelancholy(false)
    }
  }, [open, audio])

  if (!open) return null

  const handleClose = () => {
    audio?.setMelancholy(false)
    onClose()
  }

  return (
    <div className="undertaker-panel" role="dialog" aria-label="The Undertaker's Counter">
      <div className="undertaker-backdrop" aria-hidden />
      <div className="undertaker-scrim" aria-hidden />
      <header className="undertaker-header">
        <div>
          <p className="ut-kicker">AFTER-HOURS COUNTER</p>
          <h2>The Undertaker&apos;s Counter</h2>
          <p className="ut-sub">
            Insight on account: <strong>{insight}</strong>
            {equipped ? ` · Prepared: ${OCCULT_CATALOG.find((c) => c.id === equipped)?.name}` : ''}
          </p>
        </div>
        <button type="button" className="btn ghost-btn" onClick={handleClose}>
          Close the door
        </button>
      </header>

      <div className="undertaker-body">
        <PortraitFrame
          srcKey="undertaker"
          nameplate="The Undertaker"
          kicker="Proprietor · est. mourning"
          size="lg"
          className="ut-portrait-slot"
        />
        {postGame && (
          <p className="ut-farewell">
            {lensReturned
              ? '“The glass has gone home with the Austrian. You keep the paper. That is a fair division of grief.”'
              : '“You kept the lens. Bold. The Austrian will walk far in those shoes. I sell measures, not advice — but I would sleep lightly.”'}
          </p>
        )}
        <div className="undertaker-copy">
          <p className="ut-greeting">
            Good evening. The dead do not haggle, and neither do I. Bring Insight earned from
            sealed spirits — I keep quiet tools for those who hunt past dusk. Which tool for
            which hunger? Ask the living who still walk the edges; I sell, I do not tutor.
            Measure twice. Enter once.
          </p>
          <ul className="undertaker-catalog">
            {OCCULT_CATALOG.map((item) => {
              const isOwned = owned.includes(item.id)
              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  owned={isOwned}
                  insight={insight}
                  equipped={equipped === item.id}
                  onBuy={() => onBuy(item.id)}
                  onEquip={() => onEquip(equipped === item.id ? null : item.id)}
                />
              )
            })}
          </ul>
          <p className="ut-footer">
            Tools are spent in the field — one use per manifestation. Insight persists. I do not
            offer refunds; the living rarely return in the same condition.
          </p>
        </div>
      </div>
    </div>
  )
}
