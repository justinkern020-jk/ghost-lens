/**
 * Hidden collectibles / lore scraps — unlocked when real-world objects
 * tied to a particular ghost are sustained in frame (CLIP). Deeper than
 * polaroid trapped-notes. Persist once; no spam.
 */

import type { TargetType } from '../types'
import { getSave, patchSave } from '../save/gameSave'

export interface LoreCollectible {
  id: string
  /** Ghost this scrap deepens. */
  ghost: TargetType
  /** CLIP labels that can unlock this entry. */
  labels: readonly string[]
  /** Short relic title. */
  title: string
  /** Subtle toast when found. */
  toast: string
  /** Extra lore — deeper than polaroid trapped-note. */
  lore: string
}

export const LORE_COLLECTIBLES: LoreCollectible[] = [
  {
    id: 'wilted_offering',
    ghost: 'tombstone',
    labels: ['wilted flowers', 'flowers', 'iron fence', 'angel statue', 'obituary'],
    title: 'Wilted Offering',
    toast: 'A scrap of grave-memory settles into the journal.',
    lore:
      'They leave flowers until the stems go brown and still call it devotion. The Unburied learned the schedule of visitors by the smell of dying petals and the clang of the iron fence at closing. An angel statue watched with blank eyes while the dirt unfinished its work — and unfinished work is what still walks.',
  },
  {
    id: 'notice_of_absence',
    ghost: 'tombstone',
    labels: ['newspaper', 'paper', 'tombstone'],
    title: 'Notice of Absence',
    toast: 'Ink that outlived a name finds you.',
    lore:
      'Obituaries compress a life into columns. What they omit is the jaw that set wrong in the dark and the soil that never quite covered the throat. Paper yellows; the Unburied does not. Keep the clipping face-down if you must keep it at all.',
  },
  {
    id: 'reception_leftover',
    ghost: 'ring',
    labels: ['bouquet', 'champagne glass', 'wine glass', 'jewelry box', 'wedding dress'],
    title: 'Reception Leftover',
    toast: 'Something from a vow that stayed slips into your keeping.',
    lore:
      'Champagne goes flat before the hand stops reaching. White fabric in a box remembers the aisle better than the living do. The Vow That Stayed is not romantic — it is a contract with no surviving signer, still warm at the knuckle where the band used to sit.',
  },
  {
    id: 'empty_jewelry',
    ghost: 'ring',
    labels: ['jewelry box', 'ring box', 'necklace'],
    title: 'Empty Jewelry Box',
    toast: 'A velvet hollow remembers metal.',
    lore:
      'The box still holds the shape of a circle. Lift the lid and the air tastes like perfume and apology. Whoever owned the band practiced saying forever until the word wore a groove — and grooves are how hungers learn to return.',
  },
  {
    id: 'nursery_hush',
    ghost: 'doll',
    labels: ['toy chest', 'crib', 'music box', "child's shoe", 'teddy bear'],
    title: 'Nursery Hush',
    toast: 'A quiet meant for children opens the wrong way.',
    lore:
      'Cribs creak when nothing rocks them. Music boxes finish their tune a half-step flat. Porcelain Audience practiced being still in rooms like this — counting openings of lids and doors — until stillness became a hunting posture. The shoe under the chest is never the size you expect.',
  },
  {
    id: 'windup_stare',
    ghost: 'doll',
    labels: ['music box', 'dollhouse', 'toy'],
    title: 'Wind-Up Stare',
    toast: 'A mechanism clicks once in your notes.',
    lore:
      'Wind the key and look away. Looking back is when the painted smile almost changes. Ball joints keep a ledger of every adult hand that adjusted them. The doll does not want to be played with. It wants a better reference for your face.',
  },
  {
    id: 'pier_edge',
    ghost: 'lake',
    labels: ['pier', 'boat', 'fishing rod', 'reeds', 'life vest', 'wet shoes'],
    title: 'Pier Edge',
    toast: 'Cold water writes itself into the journal.',
    lore:
      'Piers end where excuses begin. Reeds hold hair-shaped silhouettes after storms. A life vest on a hook means someone argued with depth and lost the argument’s shape. What the Water Kept still rises in photographs because up is a rumor — and the lake under the emulsion misses the hole you made.',
  },
  {
    id: 'rod_and_silence',
    ghost: 'lake',
    labels: ['fishing rod', 'tackle box', 'boat'],
    title: 'Rod and Silence',
    toast: 'A line goes taut in memory only.',
    lore:
      'Fishermen talk to keep from hearing the water talk back. The drowned pale learned their jokes and kept none of the punchlines. Wet shoes by a door are a confession: someone came home incomplete. Do not hang the polaroid where morning reaches the grain.',
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
  ghost: TargetType,
  unlocked: Set<string>,
): LoreCollectible[] {
  return LORE_COLLECTIBLES.filter((c) => c.ghost === ghost && unlocked.has(c.id))
}
