/**
 * Herr Keller epilogue reward — New Game+ special item.
 * Earned by returning the Ghost Lens; persists via central save blob.
 */

import { getSave, patchSave } from '../save/gameSave'

export const KELLER_CHARM_ID = 'keller_silver_charm' as const

export const KELLER_CHARM = {
  id: KELLER_CHARM_ID,
  name: "Keller's Silver Charm",
  epithet: "hunter's lens strap",
  /**
   * Modest NG+ perk: multiply elapsed approach clock by this factor
   * (ghosts close slightly slower).
   */
  approachSlowFactor: 0.88,
  description:
    'A silver charm from the Austrian’s strap. The glass remembers who returned it — hungers hesitate a half-step longer.',
} as const

export function hasKellerCharm(): boolean {
  return getSave().kellerCharm
}

export function grantKellerCharm(): void {
  patchSave(
    { kellerCharm: true, ngplus: true },
    { toast: "Keller's charm is yours." },
  )
}

export function isNgPlusFlag(): boolean {
  return getSave().ngplus
}

export function setNgPlusFlag(on: boolean): void {
  patchSave({ ngplus: on })
}

/**
 * Active NG+ run: `?ngplus=1` / `?forceNGPlus=1`, or flag/charm from a prior Return.
 * Query flags also ensure the charm is present for testing.
 */
export function readNgPlusActive(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('ngplus') === '1' || q.get('forceNGPlus') === '1') {
      grantKellerCharm()
      return true
    }
  } catch {
    /* ignore */
  }
  return isNgPlusFlag() || hasKellerCharm()
}

/** Approach perk active when the charm is owned (NG+ / prior Return). */
export function kellerCharmPerkActive(): boolean {
  return hasKellerCharm()
}

/** Spend the charm in trade (Spookbox Maker). Removes perk; records traded flag externally. */
export function spendKellerCharm(): void {
  patchSave({ kellerCharm: false })
}
