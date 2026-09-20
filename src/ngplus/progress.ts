/**
 * NG+ / true-ending progress flags — routed through central save blob.
 * clearCount: successful demon seals (hell-hands or kept-photo paths).
 * secretUnlocked: Pale Archivist captured.
 * keptDemonPolaroid: eligible clear skipped hell-hands; photo still held.
 * trueGoodEnding: traded demon photo to cure Keller’s lycanthropy.
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

export function markTrueGoodEnding(): void {
  patchSave(
    { trueGoodEnding: true, keptDemonPolaroid: false },
    { toast: 'True ending sealed into the ledger.' },
  )
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
