/** Combat / tension timing — tuned so hesitation kills, quick capture feels fair. */

/** Time from spawn to full approach (melee). */
export const APPROACH_MS = 6200

/** Proximity at which the ghost can strike. */
export const MELEE_THRESHOLD = 0.86

/** Delay after entering melee before first strike. */
export const FIRST_HIT_DELAY_MS = 450

/** Gap between strikes once in melee. */
export const HIT_INTERVAL_MS = 1150

/** Health lost per melee strike (0–1). Three hits ≈ death if already drained. */
export const HIT_DAMAGE = 0.34

/** Soft calm drain per second while ghost is present (ramps with proximity). */
export const PASSIVE_DRAIN_PER_SEC = 0.038

/** Calm restored on successful capture. */
export const CAPTURE_HEAL = 0.28

export const MAX_HEALTH = 1

/** Brief stun lockout after a hit (ms) — Capture still works. */
export const HIT_STUN_MS = 380

export const BASE_BPM = 56
export const MAX_BPM = 178

export function proximityFromElapsed(ms: number): number {
  return Math.max(0, Math.min(1, ms / APPROACH_MS))
}

/** Ease-in so early seconds feel safer, late approach rushes. */
export function easedProximity(raw: number): number {
  const t = Math.max(0, Math.min(1, raw))
  return t * t * (3 - 2 * t) // smoothstep
}

export function bpmFromState(proximity: number, health: number): number {
  const fear = proximity * 0.75 + (1 - health) * 0.45
  return Math.round(BASE_BPM + fear * (MAX_BPM - BASE_BPM))
}

export function isMelee(proximity: number): boolean {
  return proximity >= MELEE_THRESHOLD
}
