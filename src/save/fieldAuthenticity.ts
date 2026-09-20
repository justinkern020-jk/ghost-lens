/**
 * Field authenticity — outdoor / real-dusk play vs couch force-flag testing.
 * Boosts discovery Insight only (never combat seals).
 */

import { isForceDusk } from '../dusk/duskGate'
import { getSave } from './gameSave'

export interface FieldContext {
  /** True when dusk is real (not forceDusk) and no combat force-spawn flags. */
  authentic: boolean
  reason: string
}

/** Any of these mean the hunt was "forced" for testing. */
export function hasCombatForceFlags(): boolean {
  const s = getSave()
  if (s.forceBoss || s.forcePlayground || s.forceTrial) return true
  try {
    const q = new URLSearchParams(window.location.search)
    for (const key of [
      'forceBoss',
      'forcePlayground',
      'forceTrial',
      'forceSecretGhost',
      'forceDemonWin',
      'forceWerewolf',
      'forceTrueEnd',
      'forceNGPlus',
      'forceArchivistStun',
      'forceSpookbox',
      'forceSpookboxMaker',
      'forceCollectible',
      'forceVoiceHint',
      'forceStranger',
      'forceScan',
    ]) {
      if (q.get(key) === '1' || q.get(key) === 'true') return true
    }
  } catch {
    /* ignore */
  }
  return false
}

export function evaluateFieldAuthenticity(): FieldContext {
  if (isForceDusk()) {
    return { authentic: false, reason: 'force dusk' }
  }
  if (hasCombatForceFlags()) {
    return { authentic: false, reason: 'force flags' }
  }
  return { authentic: true, reason: 'field dusk' }
}

export function isFieldAuthentic(): boolean {
  return evaluateFieldAuthenticity().authentic
}
