/**
 * NG+ / true-ending progress flags — routed through central save blob.
 * clearCount: successful demon seals (hell-hands or kept-photo paths).
 * secretUnlocked: Pale Archivist captured.
 * keptDemonPolaroid: eligible clear skipped hell-hands; photo still held.
 * trueGoodEnding: traded demon photo to cure Keller’s lycanthropy.
 * trueGoodEndingCount: times that cure/trade path has completed.
 * smileEndingSeen: Bazaar Smile meta epilogue has played.
 * kellerWestEndingSeen: West Keller origin epilogue has played (once under NG+).
 */

import { getSave, patchSave } from '../save/gameSave'

export function loadClearCount(): number {
  return getSave().clearCount
}

export function incrementClearCount(): number {
  const next = getSave().clearCount + 1
  patchSave({ clearCount: next }, { toast: 'Clear recorded.' })
  return next
}

export function hasKeptDemonPolaroid(): boolean {
  return getSave().keptDemonPolaroid
}

export function setKeptDemonPolaroid(on: boolean): void {
  patchSave({ keptDemonPolaroid: on })
}

export function hasTrueGoodEnding(): boolean {
  return getSave().trueGoodEnding
}

export function getTrueGoodEndingCount(): number {
  return getSave().trueGoodEndingCount ?? 0
}

/**
 * Record a cure-Keller / trade-demon clear.
 * Increments trueGoodEndingCount; keeps trueGoodEnding true.
 * @returns the new count after this mark
 */
export function markTrueGoodEnding(): number {
  const prev = getSave().trueGoodEndingCount ?? 0
  const next = prev + 1
  patchSave(
    {
      trueGoodEnding: true,
      trueGoodEndingCount: next,
      keptDemonPolaroid: false,
    },
    { toast: 'True ending sealed into the ledger.' },
  )
  return next
}

export function hasSmileEndingSeen(): boolean {
  return Boolean(getSave().smileEndingSeen)
}

export function markSmileEndingSeen(): void {
  patchSave({ smileEndingSeen: true })
}

/** Second true-good (and not yet seen) → Smile bazaar epilogue. */
export function shouldPlaySmileEpilogue(): boolean {
  const s = getSave()
  return (s.trueGoodEndingCount ?? 0) >= 2 && !s.smileEndingSeen
}

export function hasKellerWestEndingSeen(): boolean {
  return Boolean(getSave().kellerWestEndingSeen)
}

export function markKellerWestEndingSeen(): void {
  patchSave({ kellerWestEndingSeen: true })
}

/**
 * Once NG+ is in play, the next true-good trade (if West not yet seen) → West Keller origin.
 * App prefers West before Smile; if both are due (e.g. true-good before NG+, then
 * a later true-good at count ≥ 2), West plays first and Smile can chain after.
 */
export function shouldPlayKellerWestEpilogue(): boolean {
  const s = getSave()
  if (s.kellerWestEndingSeen) return false
  // NG+ in play: flag from Return / charm / prior NG+ run
  if (!s.ngplus && !s.kellerCharm) return false
  return (s.trueGoodEndingCount ?? 0) >= 1
}

/** Eligible for kept-demon / trade path on the next demon clear. */
export function isTrueEndEligible(secretUnlocked: boolean): boolean {
  return loadClearCount() >= 2 && secretUnlocked
}

export function readForceTrueEnd(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('forceTrueEnd') === '1'
  } catch {
    return false
  }
}

export function readForceSmileEnd(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('forceSmileEnd') === '1'
  } catch {
    return false
  }
}

export function readForceKellerWest(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('forceKellerWest') === '1'
  } catch {
    return false
  }
}
