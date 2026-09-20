/**
 * Herr Keller epilogue reward — New Game+ special item.
 * Earned by returning the Ghost Lens; persists in localStorage.
 */

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

const CHARM_KEY = 'ghost-lens-keller-charm-v1'
const NGPLUS_KEY = 'ghost-lens-ngplus-v1'

export function hasKellerCharm(): boolean {
  try {
    return localStorage.getItem(CHARM_KEY) === '1'
  } catch {
    return false
  }
}

export function grantKellerCharm(): void {
  try {
    localStorage.setItem(CHARM_KEY, '1')
    localStorage.setItem(NGPLUS_KEY, '1')
  } catch {
    /* private mode */
  }
}

export function isNgPlusFlag(): boolean {
  try {
    return localStorage.getItem(NGPLUS_KEY) === '1'
  } catch {
    return false
  }
}

export function setNgPlusFlag(on: boolean): void {
  try {
    if (on) localStorage.setItem(NGPLUS_KEY, '1')
    else localStorage.removeItem(NGPLUS_KEY)
  } catch {
    /* ignore */
  }
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
