/** Insight currency + owned occult tools — persisted via central save blob.
 *  (Formerly labeled Favor — migrated on load.)
 *  Items are NOT universal: each mainly works vs one haunt. Matchups are
 *  never spelled out in the shop — mysterious strangers whisper the keys.
 */

import type { SpiritKind } from '../types'
import { getSave, patchSave } from '../save/gameSave'

export type OccultItemId =
  | 'salt_line'
  | 'iron_nail'
  | 'silver_mirror'
  | 'hush_charm'
  | 'black_crepe'

export interface OccultItemDef {
  id: OccultItemId
  /** Basename under /shop-cards/{imageKey}.png */
  imageKey: string
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
    imageKey: 'salt-line',
    name: 'Salt Line',
    epithet: 'coarse · unbroken pour',
    pitch:
      'A measured pour for wet thresholds. Families swear by it when something drips that should not. I do not ask what they heard under the floorboards.',
    cost: 9,
    effect: 'Against the right hunger: a hard knockback. Against others: little more than grit.',
    strongVs: ['lake'],
  },
  {
    id: 'iron_nail',
    imageKey: 'iron-nail',
    name: 'Iron Nail',
    epithet: 'coffin iron · cold head',
    pitch:
      'From a box measured twice and closed once. Drive it where the dirt still answers. Soft metals flatter; this one does not.',
    cost: 12,
    effect: 'Where the ground remembers: slows and stuns. Elsewhere: a dull tap.',
    strongVs: ['tombstone'],
  },
  {
    id: 'silver_mirror',
    imageKey: 'silver-mirror',
    name: 'Silver Mirror',
    epithet: 'pocket glass · mourning plate',
    pitch:
      'Polished for the parlor, not vanity. Some faces hate a second opinion. Hold it steady — cracking is your concern.',
    cost: 16,
    effect: 'Before vacant eyes: calm returns and drain stills. Before others: a brief glint.',
    strongVs: ['doll'],
  },
  {
    id: 'hush_charm',
    imageKey: 'hush-charm',
    name: 'Hush Charm',
    epithet: 'wax · black thread · whispered name',
    pitch:
      'Sewn into lapels when vows outlast the voice that made them. Quiets a room that wants to be noticed. Do not wear it to a wedding.',
    cost: 20,
    effect: 'Against ringing promises: strikes fall silent awhile. Against other hungers: a polite cough.',
    strongVs: ['ring'],
  },
  {
    id: 'black_crepe',
    imageKey: 'black-crepe',
    name: 'Black Crepe',
    epithet: 'true name · mourning fold',
    pitch:
      'Expensive. Reserved. The fold we pin when the grounds go wrong — empty seats, chains that move alone. Speak nothing; the cloth remembers the name you should not.',
    cost: 45,
    effect: 'Only on the playground’s hunger does the crepe bite. Elsewhere it is merely cloth.',
    strongVs: ['demon'],
  },
]

/**
 * Insight economy:
 * - Completed ghost catches (final capture) pay Insight.
 * - Mid-ritual seal taps do NOT pay (caller must only grant on finishCapture).
 * - Discovery (ambient / relics / strangers / whispers / lore) pays Insight.
 * - Field authenticity bonus applies to both catches and discovery when authentic.
 */
export type InsightDiscoveryKind =
  | 'ambient_scan'
  | 'relic'
  | 'stranger'
  | 'whisper'
  | 'lore_journal'

/** Insight for a completed catch / seal (not mid-ritual taps). */
export function insightForCapture(kind: string): number {
  // Tuned so cheapest shop tool ≈ 2–3 catches; crepe stays late-game.
  if (kind === 'demon') return 8
  if (kind === 'boss') return 5
  if (kind === 'secret') return 6
  if (kind === 'trial') return 1
  return 3 // main four
}

/** @deprecated alias */
export const favorForCapture = insightForCapture

/** Base Insight for discovery events (first unlock). */
export function insightForDiscovery(kind: InsightDiscoveryKind): number {
  switch (kind) {
    case 'relic':
      return 2
    case 'stranger':
      return 2
    case 'whisper':
      return 1
    case 'ambient_scan':
      return 1
    case 'lore_journal':
      return 2
    default:
      return 1
  }
}

/** Field bonus helps outdoor play without trivialising shop prices. */
export const FIELD_AUTHENTICITY_BONUS = 1

/** First-time catch of a spirit kind — modest extra on that completed seal. */
export const FIRST_CATCH_BONUS = 2

export function loadInsight(): number {
  return getSave().insight
}

export function saveInsight(amount: number): void {
  patchSave({ insight: Math.max(0, Math.floor(amount)) })
}

/** @deprecated Use loadInsight */
export const loadFavor = loadInsight
/** @deprecated Use saveInsight */
export const saveFavor = saveInsight

export function loadOwnedItems(): OccultItemId[] {
  const ids = new Set(OCCULT_CATALOG.map((c) => c.id))
  return getSave().ownedItems.filter((x) => ids.has(x))
}

export function saveOwnedItems(owned: OccultItemId[]): void {
  patchSave({ ownedItems: [...new Set(owned)] }, { toast: 'Undertaker ledger updated.' })
}

export function loadEquippedItem(): OccultItemId | null {
  const eq = getSave().equippedItem
  if (!eq) return null
  return OCCULT_CATALOG.some((c) => c.id === eq) ? eq : null
}

export function saveEquippedItem(id: OccultItemId | null): void {
  patchSave({ equippedItem: id })
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
