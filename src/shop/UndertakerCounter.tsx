import { PortraitFrame } from '../components/PortraitFrame'
import { OCCULT_CATALOG, type OccultItemId, type OccultItemDef } from './favorStore'

interface Props {
  open: boolean
  onClose: () => void
  favor: number
  owned: OccultItemId[]
  onBuy: (id: OccultItemId) => void
  /** Equipped / ready-to-use item for next fight (optional). */
  equipped: OccultItemId | null
  onEquip: (id: OccultItemId | null) => void
  /** Quiet post-hunt after the playground finale. */
  postGame?: boolean
  /** True if Herr Keller took the lens back. */
  lensReturned?: boolean
}


function ItemRow({
  item,
  owned,
  favor,
  equipped,
  onBuy,
  onEquip,
}: {
  item: OccultItemDef
  owned: boolean
  favor: number
  equipped: boolean
  onBuy: () => void
  onEquip: () => void
}) {
  const canBuy = !owned && favor >= item.cost
  return (
    <li className={`undertaker-item ${owned ? 'owned' : ''}`}>
      <div className="ut-item-head">
        <h3>{item.name}</h3>
        <span className="ut-cost">{owned ? 'In your keeping' : `${item.cost} Favor`}</span>
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
            {canBuy ? 'Accept the measure' : favor < item.cost ? 'Insufficient Favor' : 'Sold'}
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
    </li>
  )
}

export function UndertakerCounter({
  open,
  onClose,
  favor,
  owned,
  onBuy,
  equipped,
  onEquip,
  postGame = false,
  lensReturned = false,
}: Props) {
  if (!open) return null

  return (
    <div className="undertaker-panel" role="dialog" aria-label="The Undertaker's Counter">
      <header className="undertaker-header">
        <div>
          <p className="ut-kicker">AFTER-HOURS COUNTER</p>
          <h2>The Undertaker&apos;s Counter</h2>
          <p className="ut-sub">
            Favor on account: <strong>{favor}</strong>
            {equipped ? ` · Prepared: ${OCCULT_CATALOG.find((c) => c.id === equipped)?.name}` : ''}
          </p>
        </div>
        <button type="button" className="btn ghost-btn" onClick={onClose}>
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
            Good evening. The dead do not haggle, and neither do I. Bring Favor earned from
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
                  favor={favor}
                  equipped={equipped === item.id}
                  onBuy={() => onBuy(item.id)}
                  onEquip={() => onEquip(equipped === item.id ? null : item.id)}
                />
              )
            })}
          </ul>
          <p className="ut-footer">
            Tools are spent in the field — one use per manifestation. Favor persists. I do not
            offer refunds; the living rarely return in the same condition.
          </p>
        </div>
      </div>
    </div>
  )
}
