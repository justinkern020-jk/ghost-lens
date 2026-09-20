/**
 * Spookbox — Justin-coded ITC box from the mysterious Spookbox Maker.
 * Traded for Keller's Silver Charm (Return ending / NG+). Required to
 * stun The Pale Archivist before the final seal.
 */

export const SPOOKBOX_ID = 'spookbox' as const

export const SPOOKBOX = {
  id: SPOOKBOX_ID,
  name: 'Spookbox',
  epithet: 'ITC sweep · protector dial',
  description:
    'A handmade spirit box. Sweep the noise, call a good protector, and the vault-hunger staggers long enough for the final seal.',
} as const

const BOX_KEY = 'ghost-lens-spookbox-v1'
const CHARM_TRADED_KEY = 'ghost-lens-charm-traded-for-spookbox-v1'
const MET_MAKER_KEY = 'ghost-lens-met-spookbox-maker-v1'

export function hasSpookbox(): boolean {
  try {
    return localStorage.getItem(BOX_KEY) === '1'
  } catch {
    return false
  }
}

export function grantSpookbox(): void {
  try {
    localStorage.setItem(BOX_KEY, '1')
  } catch {
    /* private mode */
  }
}

export function hasCharmTradedForSpookbox(): boolean {
  try {
    return localStorage.getItem(CHARM_TRADED_KEY) === '1'
  } catch {
    return false
  }
}

export function markCharmTradedForSpookbox(): void {
  try {
    localStorage.setItem(CHARM_TRADED_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function hasMetSpookboxMaker(): boolean {
  try {
    return localStorage.getItem(MET_MAKER_KEY) === '1'
  } catch {
    return false
  }
}

export function markMetSpookboxMaker(): void {
  try {
    localStorage.setItem(MET_MAKER_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** Dev: open maker meet UI (skips dusk + place). */
export function readForceSpookboxMaker(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('forceSpookboxMaker') === '1'
  } catch {
    return false
  }
}

/** Dev: grant Spookbox in localStorage for testing. */
export function readForceSpookbox(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('forceSpookbox') === '1') {
      grantSpookbox()
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

/** Dev: Archivist final seal allowed without protector stun. */
export function readForceArchivistStun(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('forceArchivistStun') === '1'
  } catch {
    return false
  }
}

/**
 * Where / when the Spookbox Maker appears (documented for players).
 * Time: same dusk hunt window (solar or local 17:30–21:00).
 * Place: workshop / garage / electronics bench — CLIP labels below.
 */
export const SPOOKBOX_MAKER_MEET = {
  timeLabel: 'dusk (hunt window)',
  placeLabel: 'workshop, garage, radio, toolbox, or electronics bench',
  copy:
    'At dusk, frame a radio, toolbox, garage workbench, or electronics bench. Hold steady — the maker only shows when the veil is thin and the workbench is in frame.',
} as const
