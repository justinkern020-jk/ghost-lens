/**
 * NG+ / true-ending progress flags — localStorage.
 * clearCount: successful demon seals (hell-hands or kept-photo paths).
 * secretUnlocked: Pale Archivist captured.
 * keptDemonPolaroid: eligible clear skipped hell-hands; photo still held.
 * trueGoodEnding: traded demon photo to cure Keller’s lycanthropy.
 */

const CLEAR_KEY = 'ghost-lens-clear-count-v1'
const KEPT_DEMON_KEY = 'ghost-lens-kept-demon-polaroid-v1'
const TRUE_END_KEY = 'ghost-lens-true-good-ending-v1'

export function loadClearCount(): number {
  try {
    const n = Number(localStorage.getItem(CLEAR_KEY) ?? '0')
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function incrementClearCount(): number {
  const next = loadClearCount() + 1
  try {
    localStorage.setItem(CLEAR_KEY, String(next))
  } catch {
    /* private mode */
  }
  return next
}

export function hasKeptDemonPolaroid(): boolean {
  try {
    return localStorage.getItem(KEPT_DEMON_KEY) === '1'
  } catch {
    return false
  }
}

export function setKeptDemonPolaroid(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEPT_DEMON_KEY, '1')
    else localStorage.removeItem(KEPT_DEMON_KEY)
  } catch {
    /* ignore */
  }
}

export function hasTrueGoodEnding(): boolean {
  try {
    return localStorage.getItem(TRUE_END_KEY) === '1'
  } catch {
    return false
  }
}

export function markTrueGoodEnding(): void {
  try {
    localStorage.setItem(TRUE_END_KEY, '1')
    localStorage.removeItem(KEPT_DEMON_KEY)
  } catch {
    /* ignore */
  }
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
