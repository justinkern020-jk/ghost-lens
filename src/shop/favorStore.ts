/** Favor currency + owned occult tools — persisted in localStorage.
 *  Items are NOT universal: each mainly works vs one haunt. Matchups are
 *  never spelled out in the shop — mysterious strangers whisper the keys.
 */

import type { SpiritKind } from '../types'

export type OccultItemId =
  | 'salt_line'
  | 'iron_nail'
  | 'silver_mirror'
  | 'hush_charm'
  | 'black_crepe'

export interface OccultItemDef {
  id: OccultItemId
  name: string
  epithet: string
  /** Cryptic undertaker sales copy — never names the matchup. */
  pitch: string
  cost: number
  /** Vague utility line for the catalog (still not a wiki). */
  effect: string
  /** Which spirit kinds this item is effective against. */
  strongVs: SpiritKind[]
}

export const OCCULT_CATALOG: OccultItemDef[] = [
  {
    id: 'salt_line',
    name: 'Salt Line',
    epithet: 'coarse · unbroken pour',
    pitch:
      'A measured pour for wet thresholds. Families swear by it when something drips that should not. I do not ask what they heard under the floorboards.',
    cost: 3,
    effect: 'Against the right hunger: a hard knockback. Against others: little more than grit.',
    strongVs: ['lake'],
  },
  {
    id: 'iron_nail',
    name: 'Iron Nail',
    epithet: 'coffin iron · cold head',
    pitch:
      'From a box measured twice and closed once. Drive it where the dirt still answers. Soft metals flatter; this one does not.',
    cost: 4,
    effect: 'Where the ground remembers: slows and stuns. Elsewhere: a dull tap.',
    strongVs: ['tombstone'],
  },
  {
    id: 'silver_mirror',
    name: 'Silver Mirror',
    epithet: 'pocket glass · mourning plate',
    pitch:
      'Polished for the parlor, not vanity. Some faces hate a second opinion. Hold it steady — cracking is your concern.',
    cost: 5,
    effect: 'Before vacant eyes: calm returns and drain stills. Before others: a brief glint.',
    strongVs: ['doll'],
  },
  {
    id: 'hush_charm',
    name: 'Hush Charm',
    epithet: 'wax · black thread · whispered name',
    pitch:
      'Sewn into lapels when vows outlast the voice that made them. Quiets a room that wants to be noticed. Do not wear it to a wedding.',
    cost: 6,
    effect: 'Against ringing promises: strikes fall silent awhile. Against other hungers: a polite cough.',
    strongVs: ['ring'],
  },
  {
    id: 'black_crepe',
    name: 'Black Crepe',
    epithet: 'true name · mourning fold',
    pitch:
      'Expensive. Reserved. The fold we pin when the grounds go wrong — empty seats, chains that move alone. Speak nothing; the cloth remembers the name you should not.',
    cost: 12,
    effect: 'Only on the playground’s hunger does the crepe bite. Elsewhere it is merely cloth.',
    strongVs: ['demon'],
  },
]

const FAVOR_KEY = 'ghost-lens-favor-v1'
const OWNED_KEY = 'ghost-lens-undertaker-owned-v1'

/** Favor earned per successful capture by kind. */
export function favorForCapture(kind: string): number {
  if (kind === 'demon') return 8
  if (kind === 'boss') return 5
  return 1
}

export function loadFavor(): number {
  try {
    const raw = localStorage.getItem(FAVOR_KEY)
    if (!raw) return 0
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function saveFavor(amount: number): void {
  try {
    localStorage.setItem(FAVOR_KEY, String(Math.max(0, Math.floor(amount))))
  } catch {
    /* private mode */
  }
}

export function loadOwnedItems(): OccultItemId[] {
  try {
    const raw = localStorage.getItem(OWNED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const ids = new Set(OCCULT_CATALOG.map((c) => c.id))
    return parsed.filter(
      (x): x is OccultItemId => typeof x === 'string' && ids.has(x as OccultItemId),
    )
  } catch {
    return []
  }
}

export function saveOwnedItems(owned: OccultItemId[]): void {
  try {
    localStorage.setItem(OWNED_KEY, JSON.stringify([...new Set(owned)]))
  } catch {
    /* private mode */
  }
}

export function getItemDef(id: OccultItemId): OccultItemDef | undefined {
  return OCCULT_CATALOG.find((c) => c.id === id)
}

/** Full strength if kind is in strongVs; weak/useless otherwise. */
export function itemStrengthVs(
  id: OccultItemId,
  kind: SpiritKind | null,
): 'strong' | 'weak' | 'none' {
  if (!kind) return 'none'
  const def = getItemDef(id)
  if (!def) return 'none'
  if (def.strongVs.includes(kind)) return 'strong'
  // Mid-boss Warden resists all ordinary aids
  if (kind === 'boss') return 'weak'
  return 'weak'
}
