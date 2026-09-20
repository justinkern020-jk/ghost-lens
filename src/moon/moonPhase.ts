/**
 * Full-moon gate for The Empty Seat's final seal.
 * Simple synodic approximation (local calendar day at noon).
 * Override: ?forceFullMoon=1 or localStorage ghost-lens-force-full-moon=1
 */

const FORCE_KEY = 'ghost-lens-force-full-moon'

/** Mean synodic month (new → new), days. */
export const SYNODIC_MONTH_DAYS = 29.530588853

/**
 * Known new moon: 2000-01-06 18:14 UTC (common Meeus/USNO-style epoch).
 * Age 0 = new; age ≈ SYNODIC/2 = full.
 */
export const KNOWN_NEW_MOON_UTC_MS = Date.UTC(2000, 0, 6, 18, 14, 0)

/** Days either side of exact full that count as a "full moon" local day. */
export const FULL_MOON_TOLERANCE_DAYS = 0.9

export type MoonPhaseName =
  | 'new'
  | 'waxing crescent'
  | 'first quarter'
  | 'waxing gibbous'
  | 'full'
  | 'waning gibbous'
  | 'last quarter'
  | 'waning crescent'

export interface MoonStatus {
  /** True when the demon's final seal is allowed (full moon or forced). */
  canSeal: boolean
  isFullMoon: boolean
  forceFullMoon: boolean
  /** Moon age in days since last new (0..SYNODIC). */
  ageDays: number
  /** Illuminated fraction 0..1 (0 = new, 1 = full). */
  illumination: number
  phaseName: MoonPhaseName
  /** Short UI glyph / label */
  phaseLabel: string
  /** Atmospheric one-liner for HUD / boot */
  reason: string
  mode: 'forced' | 'full' | 'blocked'
}

export function isForceFullMoon(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('forceFullMoon') === '1' || q.get('forceFullMoon') === 'true')
      return true
  } catch {
    /* ignore */
  }
  try {
    return localStorage.getItem(FORCE_KEY) === '1'
  } catch {
    return false
  }
}

export function setForceFullMoon(on: boolean): void {
  try {
    if (on) localStorage.setItem(FORCE_KEY, '1')
    else localStorage.removeItem(FORCE_KEY)
  } catch {
    /* ignore */
  }
}

/** Local calendar noon — stable per local date for the gate. */
export function localNoon(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0)
}

export function moonAgeDays(d = new Date()): number {
  const days = (d.getTime() - KNOWN_NEW_MOON_UTC_MS) / 86_400_000
  return ((days % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS
}

/** Illumination ≈ (1 − cos(2π · age / synodic)) / 2 */
export function moonIllumination(ageDays: number): number {
  const frac = ageDays / SYNODIC_MONTH_DAYS
  return (1 - Math.cos(2 * Math.PI * frac)) / 2
}

export function daysFromFull(ageDays: number): number {
  const fullAge = SYNODIC_MONTH_DAYS / 2
  let delta = Math.abs(ageDays - fullAge)
  if (delta > SYNODIC_MONTH_DAYS / 2) delta = SYNODIC_MONTH_DAYS - delta
  return delta
}

export function isFullMoonLocal(d = new Date()): boolean {
  const age = moonAgeDays(localNoon(d))
  return daysFromFull(age) <= FULL_MOON_TOLERANCE_DAYS
}

export function phaseNameFromAge(ageDays: number): MoonPhaseName {
  if (daysFromFull(ageDays) <= FULL_MOON_TOLERANCE_DAYS) return 'full'
  // Eight roughly equal slices of the synodic month
  const t = ageDays / SYNODIC_MONTH_DAYS
  if (t < 0.03 || t >= 0.97) return 'new'
  if (t < 0.22) return 'waxing crescent'
  if (t < 0.28) return 'first quarter'
  if (t < 0.47) return 'waxing gibbous'
  if (t < 0.53) return 'full' // tight band; tolerance above already caught most
  if (t < 0.72) return 'waning gibbous'
  if (t < 0.78) return 'last quarter'
  return 'waning crescent'
}

export function phaseGlyph(name: MoonPhaseName): string {
  switch (name) {
    case 'new':
      return '🌑'
    case 'waxing crescent':
      return '🌒'
    case 'first quarter':
      return '🌓'
    case 'waxing gibbous':
      return '🌔'
    case 'full':
      return '🌕'
    case 'waning gibbous':
      return '🌖'
    case 'last quarter':
      return '🌗'
    case 'waning crescent':
      return '🌘'
  }
}

export const DEMON_SEAL_BLOCKED_COPY =
  "It won't take the photograph until the moon is full."

export function evaluateMoonNow(now = new Date()): MoonStatus {
  const forced = isForceFullMoon()
  const noon = localNoon(now)
  const ageDays = moonAgeDays(noon)
  const illumination = moonIllumination(ageDays)
  const isFull = isFullMoonLocal(now)
  const phaseName = forced && !isFull ? 'full' : phaseNameFromAge(ageDays)
  const glyph = phaseGlyph(phaseNameFromAge(ageDays))
  const phaseLabel = forced
    ? `${glyph} Full (forced)`
    : `${glyph} ${phaseName}`

  if (forced) {
    return {
      canSeal: true,
      isFullMoon: true,
      forceFullMoon: true,
      ageDays,
      illumination,
      phaseName: 'full',
      phaseLabel,
      reason: 'Force full moon (test) — Empty Seat seal unlocked.',
      mode: 'forced',
    }
  }

  if (isFull) {
    return {
      canSeal: true,
      isFullMoon: true,
      forceFullMoon: false,
      ageDays,
      illumination,
      phaseName: 'full',
      phaseLabel,
      reason: 'Full moon. The Empty Seat will take the photograph.',
      mode: 'full',
    }
  }

  return {
    canSeal: false,
    isFullMoon: false,
    forceFullMoon: false,
    ageDays,
    illumination,
    phaseName: phaseNameFromAge(ageDays),
    phaseLabel,
    reason: DEMON_SEAL_BLOCKED_COPY,
    mode: 'blocked',
  }
}
