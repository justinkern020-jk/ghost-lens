/**
 * Hidden collectibles / lore scraps — unlocked when real-world objects
 * tied to a particular spirit are sustained in frame (CLIP). Deeper than
 * polaroid trapped-notes. Persist once; no spam.
 */

import type { SpiritKind } from '../types'
import { getSave, patchSave } from '../save/gameSave'

export interface LoreCollectible {
  id: string
  /** Spirit this scrap deepens. */
  ghost: SpiritKind
  /** CLIP labels that can unlock this entry. */
  labels: readonly string[]
  /** Short relic title. */
  title: string
  /** Subtle toast when found. */
  toast: string
  /** Extra lore — denser than polaroid trapped-note. */
  lore: string
  /** Basename under /relics/{imageKey}.png */
  imageKey: string
}

export const LORE_COLLECTIBLES: LoreCollectible[] = [
  {
    id: 'wilted_offering',
    ghost: 'tombstone',
    labels: ['wilted flowers', 'flowers', 'iron fence', 'angel statue', 'obituary'],
    title: 'Wilted Offering',
    toast: 'Brown petals remember a schedule.',
    imageKey: 'wilted-offering',
    lore:
      'Laid at the stone each seventh day until the stems forgot green. The Unburied learned closing by the iron latch and the scent of water leaving the bloom. The angel kept its blank vigil over soil that would not finish its work.\n\nDevotion, when it rots on schedule, becomes a map.',
  },
  {
    id: 'notice_of_absence',
    ghost: 'tombstone',
    labels: ['newspaper', 'paper', 'tombstone'],
    title: 'Notice of Absence',
    toast: 'A column omits what still walks.',
    imageKey: 'notice-of-absence',
    lore:
      'Ink compressed a life into three inches and a date. What it left out set its jaw wrong in the dark and waited for cover that never came. Paper yellows in honest light.\n\nThe name is gone. The omission is not.',
  },
  {
    id: 'reception_leftover',
    ghost: 'ring',
    labels: ['bouquet', 'champagne glass', 'wine glass', 'jewelry box', 'wedding dress'],
    title: 'Reception Leftover',
    toast: 'Flat champagne. Warm knuckle.',
    imageKey: 'reception-leftover',
    lore:
      'The toast went dull before the hand stopped reaching. White cloth in a box still holds the aisle better than anyone living. The Vow That Stayed is no romance — a contract with no surviving signer, heat lingering where the band once sat.\n\nForever was practiced until it wore a groove.',
  },
  {
    id: 'empty_jewelry',
    ghost: 'ring',
    labels: ['jewelry box', 'ring box', 'necklace'],
    title: 'Empty Jewelry',
    toast: "Velvet keeps the circle's shape.",
    imageKey: 'empty-jewelry',
    lore:
      'Lift the lid: perfume, apology, and the hollow of a ring. Whoever owned the metal rehearsed forever until the word cut a channel. Hungers learn channels the way rivers learn stone.\n\nThe box is empty. The shape remains.',
  },
  {
    id: 'nursery_hush',
    ghost: 'doll',
    labels: ['toy chest', 'crib', 'music box', "child's shoe", 'teddy bear'],
    title: 'Nursery Hush',
    toast: 'Quiet meant for children opens wrong.',
    imageKey: 'nursery-hush',
    lore:
      'The crib answers when nothing rocks it. The music box ends a half-step flat. Porcelain Audience counted lids and doors in rooms like this until stillness became a posture for hunting. The shoe beneath the chest is never the size you brace for.\n\nHush was the first lesson. Listening was the second.',
  },
  {
    id: 'windup_stare',
    ghost: 'doll',
    labels: ['music box', 'dollhouse', 'toy'],
    title: 'Wind-Up Stare',
    toast: 'A key turns once in the margin.',
    imageKey: 'windup-stare',
    lore:
      'Wind the stem. Look away. Looking back is when the painted mouth almost learns. Ball joints keep ledger of every adult hand that set them true. It does not want play.\n\nIt wants a better reference for your face.',
  },
  {
    id: 'pier_edge',
    ghost: 'lake',
    labels: ['pier', 'boat', 'fishing rod', 'reeds', 'life vest', 'wet shoes'],
    title: 'Pier Edge',
    toast: 'Cold water signs the page.',
    imageKey: 'pier-edge',
    lore:
      'Boards end where excuses thin. After storms, reeds hold hair-shaped absences. A vest on a hook means someone argued with depth and lost the argument\'s outline. What the Water Kept still rises in emulsion because up is a rumor.\n\nThe lake under the grain misses the hole you made.',
  },
  {
    id: 'rod_and_silence',
    ghost: 'lake',
    labels: ['fishing rod', 'tackle box', 'boat'],
    title: 'Rod and Silence',
    toast: 'A line goes taut in memory only.',
    imageKey: 'rod-and-silence',
    lore:
      'They spoke to drown out the water\'s reply. The drowned pale kept the jokes and none of the endings. Wet shoes by a door confess: someone returned incomplete.\n\nDo not hang the polaroid where morning finds the grain.',
  },
  {
    id: 'empty_chair',
    ghost: 'trial',
    labels: ['chair', 'empty chair', 'park bench'],
    title: 'Empty Chair',
    toast: 'Weight without a sitter.',
    imageKey: 'empty-chair',
    lore:
      'The Thin One was barely more than a hollow above the seat — a smear of sitting, polite as a stain. Paper holds it the way cloth holds wine. Learn the shutter on something that waits.\n\nThe thicker ones will not.',
  },
  {
    id: 'thin_shadow',
    ghost: 'trial',
    labels: ['shadow', 'silhouette', 'doorway'],
    title: 'Thin Shadow',
    toast: 'A silhouette that almost had a name.',
    imageKey: 'thin-shadow',
    lore:
      'In doorways it practiced being almost — almost hunger, almost a title. Threshold light cut it to outline and it learned outline was enough. Keep it with the sealed if you wish.\n\nIt will not open their doors. It only shows you where doors are.',
  },
  {
    id: 'amalgam_token',
    ghost: 'boss',
    labels: ['padlock', 'chain', 'threshold', 'doorway', 'keyring'],
    title: 'Amalgam Token',
    toast: 'Four hungers, one latch.',
    imageKey: 'amalgam-token',
    lore:
      'Dirt, vow, porcelain, and lake agreed on a single grievance and braided into a lock that fits no single key. The Threshold Warden wears what you collected like a coat of refusals. You walked four seals and called the hunt finished.\n\nThe latch remembers your pulse better than you do.',
  },
  {
    id: 'fourfold_ash',
    ghost: 'boss',
    labels: ['ash', 'urn', 'burnt candle', 'incense'],
    title: 'Fourfold Ash',
    toast: 'Four refusals, one urn.',
    imageKey: 'fourfold-ash',
    lore:
      'Burnt down from four small graves of light. Incense that once marked separate vigils now shares a single mouth of smoke. The Warden is what gathers when the dead stop arguing.\n\nPaper yellows. Ash does not forget who stacked it.',
  },
  {
    id: 'crepe_ribbon',
    ghost: 'demon',
    labels: ['black ribbon', 'mourning ribbon', 'crepe paper'],
    title: 'Crepe Ribbon',
    toast: 'Mourning cloth for a seat that should be empty.',
    imageKey: 'crepe-ribbon',
    lore:
      'Black crepe meant for doors that lost a child — tied instead to chains that move with no weight. The Empty Seat wore the scale of something small so you would hesitate. The ribbon frays where grief was measured in days.\n\nIt is still counting.',
  },
  {
    id: 'empty_swing_chain',
    ghost: 'demon',
    labels: ['swing', 'swing set', 'chain', 'playground'],
    title: 'Empty Swing Chain',
    toast: 'Metal remembers a pulse.',
    imageKey: 'empty-swing-chain',
    lore:
      'Night playgrounds keep no laughter — only the hymn of links and a shape too tall for the slide. You laid four polaroids like a rite and called it bravery. Frost burned into the seal. There is no recess from this.\n\nIf chains sound in a quiet room, do not check which seat is empty.',
  },
  {
    id: 'cipher_margin',
    ghost: 'secret',
    labels: ['handwritten letter', 'notebook', 'ledger', 'parchment'],
    title: 'Cipher Margin',
    toast: 'Notes in a hand that indexed the dead.',
    imageKey: 'cipher-margin',
    lore:
      'Margins filled with letters that never belonged to the living — C, R, Y, P, T — a path for hunters who return what they borrow. The Pale Archivist filed names the vault still misses. Your light was an unauthorized stamp.\n\nNow the ledger lists you in emulsion.',
  },
  {
    id: 'pale_index',
    ghost: 'secret',
    labels: ['library card', 'index card', 'filing cabinet', 'bookshelf'],
    title: 'Pale Index',
    toast: 'A shelf that remembers wrong returns.',
    imageKey: 'pale-index',
    lore:
      'Crypt air tastes of old paper. Bones counted like overdue volumes. Being trapped in a photograph is only another shelf — indexed under light you did not authorize. Do not open near morning.\n\nThe card is blank on both sides. The filing is not.',
  },
]

export function loadUnlockedCollectibles(): Set<string> {
  return new Set(getSave().collectibles)
}

export function saveUnlockedCollectibles(unlocked: Set<string>): void {
  patchSave({ collectibles: [...unlocked] }, { toast: 'Relic logged.' })
}

export function allCollectibleLabels(): string[] {
  const s = new Set<string>()
  for (const c of LORE_COLLECTIBLES) {
    for (const l of c.labels) s.add(l)
  }
  return [...s]
}

export function collectibleForLabel(
  label: string,
  unlocked: Set<string>,
): LoreCollectible | null {
  for (const c of LORE_COLLECTIBLES) {
    if (unlocked.has(c.id)) continue
    if ((c.labels as readonly string[]).includes(label)) return c
  }
  return null
}

export function findCollectible(id: string): LoreCollectible | undefined {
  return LORE_COLLECTIBLES.find((c) => c.id === id)
}

export function collectiblesForGhost(
  ghost: SpiritKind,
  unlocked: Set<string>,
): LoreCollectible[] {
  return LORE_COLLECTIBLES.filter((c) => c.ghost === ghost && unlocked.has(c.id))
}
