import { getSave, patchSave } from '../save/gameSave'
/**
 * Hunt is only allowed at dusk (local device time).
 * Prefers geolocation + rough solar sunset; falls back to fixed local window.
 * Override: ?forceDusk=1 or localStorage ghost-lens-force-dusk=1
 */

/** @deprecated mirrored via gameSave */
const _FORCE_KEY_LEGACY = 'ghost-lens-force-dusk'
void _FORCE_KEY_LEGACY

/** Fixed fallback when geo/sunset unavailable: local 17:30–21:00 */
export const FALLBACK_DUSK_START_MIN = 17 * 60 + 30
export const FALLBACK_DUSK_END_MIN = 21 * 60

/** Minutes before / after local sunset for the hunt window. */
export const DUSK_BEFORE_SUNSET_MIN = 45
export const DUSK_AFTER_SUNSET_MIN = 75

export interface DuskStatus {
  allowed: boolean
  reason: string
  mode: 'forced' | 'solar' | 'fallback' | 'blocked'
  /** Local HH:MM of window start/end when known */
  windowLabel?: string
  sunsetLabel?: string
}

function minutesNow(d = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}

function fmtMin(m: number): string {
  const wrapped = ((Math.floor(m) % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const min = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function isForceDusk(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('forceDusk') === '1' || q.get('forceDusk') === 'true') return true
  } catch {
    /* ignore */
  }
  return getSave().forceDusk
}

export function setForceDusk(on: boolean): void {
  patchSave({ forceDusk: on })
}

/**
 * Rough sunset minute-of-day via solar declination (no deps).
 * Accurate enough for a dusk game gate (±~15–20 min).
 */
export function approxSunsetMinutes(lat: number, lon: number, d = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000)
  const rad = Math.PI / 180

  const decl =
    23.44 * Math.sin(rad * ((360 / 365) * (dayOfYear - 81)))

  const cosHa =
    (Math.cos(rad * 90.833) - Math.sin(rad * lat) * Math.sin(rad * decl)) /
    (Math.cos(rad * lat) * Math.cos(rad * decl))

  if (cosHa >= 1) {
    // Polar night-ish — sun never rises; allow hunt
    return 12 * 60
  }
  if (cosHa <= -1) {
    // Midnight sun — never sets; signal blocked
    return -1
  }

  const ha = (Math.acos(cosHa) * 180) / Math.PI
  const eqnTime =
    9.87 * Math.sin(2 * rad * ((360 / 365) * (dayOfYear - 81))) -
    7.53 * Math.cos(rad * ((360 / 365) * (dayOfYear - 81))) -
    1.5 * Math.sin(rad * ((360 / 365) * (dayOfYear - 81)))
  const solarNoonUtcMin = 720 - 4 * lon - eqnTime
  const sunsetUtcMin = solarNoonUtcMin + ha * 4

  const offsetMin = -d.getTimezoneOffset()
  let local = sunsetUtcMin + offsetMin
  while (local < 0) local += 1440
  while (local >= 1440) local -= 1440
  return local
}

export function duskStatusFromCoords(
  lat: number,
  lon: number,
  now = new Date(),
): DuskStatus {
  const sunset = approxSunsetMinutes(lat, lon, now)
  if (sunset < 0) {
    return {
      allowed: false,
      mode: 'blocked',
      reason:
        "The dead don't walk in hard light — polar day. Return when the sun sets.",
      sunsetLabel: 'none',
    }
  }
  const start = sunset - DUSK_BEFORE_SUNSET_MIN
  const end = sunset + DUSK_AFTER_SUNSET_MIN
  const nowM = minutesNow(now)
  const inWindow = nowM >= start && nowM <= end
  const windowLabel = `${fmtMin(start)}–${fmtMin(end)}`
  if (inWindow) {
    return {
      allowed: true,
      mode: 'solar',
      reason: 'Dusk. The veil is thin.',
      windowLabel,
      sunsetLabel: fmtMin(sunset),
    }
  }
  return {
    allowed: false,
    mode: 'blocked',
    reason: "The dead don't walk in hard light — return at dusk.",
    windowLabel,
    sunsetLabel: fmtMin(sunset),
  }
}

export function duskStatusFallback(now = new Date()): DuskStatus {
  const nowM = minutesNow(now)
  const start = FALLBACK_DUSK_START_MIN
  const end = FALLBACK_DUSK_END_MIN
  const windowLabel = `${fmtMin(start)}–${fmtMin(end)}`
  const inWindow = nowM >= start && nowM <= end
  if (inWindow) {
    return {
      allowed: true,
      mode: 'fallback',
      reason: 'Dusk window (local clock).',
      windowLabel,
    }
  }
  return {
    allowed: false,
    mode: 'blocked',
    reason: "The dead don't walk in hard light — return at dusk.",
    windowLabel,
  }
}

export function evaluateDuskNow(
  coords: { lat: number; lon: number } | null,
  now = new Date(),
): DuskStatus {
  if (isForceDusk()) {
    return {
      allowed: true,
      mode: 'forced',
      reason: 'Force dusk (test) — hunt unlocked.',
      windowLabel: 'forced',
    }
  }
  if (coords) return duskStatusFromCoords(coords.lat, coords.lon, now)
  return duskStatusFallback(now)
}

export async function requestCoords(
  timeoutMs = 6000,
): Promise<{ lat: number; lon: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null
  return new Promise((resolve) => {
    const t = window.setTimeout(() => resolve(null), timeoutMs)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(t)
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      },
      () => {
        clearTimeout(t)
        resolve(null)
      },
      { enableHighAccuracy: false, maximumAge: 30 * 60_000, timeout: timeoutMs },
    )
  })
}
