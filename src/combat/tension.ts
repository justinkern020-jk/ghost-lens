/** Combat / tension timing — tuned so hesitation kills, quick capture feels fair. */

/** Time from spawn to full approach (melee). */
export const APPROACH_MS = 6200

/** Trial / lesser echo — slower approach, longer capture window. */
export const TRIAL_APPROACH_MS = 11000

/** Boss closes faster. */
export const BOSS_APPROACH_MS = 4200

/** Demon closes even faster — playground dread. */
export const DEMON_APPROACH_MS = 3200

/** Proximity at which the ghost can strike. */
export const MELEE_THRESHOLD = 0.86

/** Delay after entering melee before first strike. */
export const FIRST_HIT_DELAY_MS = 450
export const TRIAL_FIRST_HIT_DELAY_MS = 900
export const BOSS_FIRST_HIT_DELAY_MS = 280
export const DEMON_FIRST_HIT_DELAY_MS = 180

/** Gap between strikes once in melee. */
export const HIT_INTERVAL_MS = 1150
export const TRIAL_HIT_INTERVAL_MS = 1600
export const BOSS_HIT_INTERVAL_MS = 780
export const DEMON_HIT_INTERVAL_MS = 560

/** Health lost per melee strike (0–1). Three hits ≈ death if already drained. */
export const HIT_DAMAGE = 0.34
export const TRIAL_HIT_DAMAGE = 0.18
export const BOSS_HIT_DAMAGE = 0.42
export const DEMON_HIT_DAMAGE = 0.52

/** Soft calm drain per second while ghost is present (ramps with proximity). */
export const PASSIVE_DRAIN_PER_SEC = 0.038
export const TRIAL_PASSIVE_DRAIN_PER_SEC = 0.016
export const BOSS_PASSIVE_DRAIN_PER_SEC = 0.058
export const DEMON_PASSIVE_DRAIN_PER_SEC = 0.078

/** Calm restored on successful capture. */
export const CAPTURE_HEAL = 0.28
export const TRIAL_CAPTURE_HEAL = 0.22
export const BOSS_CAPTURE_HEAL = 0.45
export const DEMON_CAPTURE_HEAL = 0.55

/** How much proximity to shove back on a multi-seal phase tap. */
export const BOSS_PHASE_KNOCKBACK = 0.22
export const DEMON_PHASE_KNOCKBACK = 0.16

export const MAX_HEALTH = 1

/** Brief stun lockout after a hit (ms) — Capture still works. */
export const HIT_STUN_MS = 380

export const BASE_BPM = 56
export const MAX_BPM = 178

export function proximityFromElapsed(ms: number, approachMs = APPROACH_MS): number {
  return Math.max(0, Math.min(1, ms / approachMs))
}

/** Ease-in so early seconds feel safer, late approach rushes. */
/**
 * Soft early approach, then a hard rush in the last 20% of the clock
 * so the figure suddenly closes into melee / face-distance.
 */
export function easedProximity(raw: number): number {
  const t = Math.max(0, Math.min(1, raw))
  // First 80% of clock → ~0..0.58 (still framed, not yet melee)
  if (t <= 0.8) {
    const u = t / 0.8
    const smooth = u * u * (3 - 2 * u)
    return 0.58 * smooth
  }
  // Last 20%: cubic acceleration into the player's face (0.58 → 1)
  const u = (t - 0.8) / 0.2
  const rush = u * u * u
  return 0.58 + 0.42 * rush
}

export function bpmFromState(proximity: number, health: number): number {
  const fear = proximity * 0.75 + (1 - health) * 0.45
  return Math.round(BASE_BPM + fear * (MAX_BPM - BASE_BPM))
}

export function isMelee(proximity: number): boolean {
  return proximity >= MELEE_THRESHOLD
}

export interface TensionProfile {
  approachMs: number
  firstHitDelayMs: number
  hitIntervalMs: number
  hitDamage: number
  passiveDrainPerSec: number
  captureHeal: number
  phaseKnockback: number
}

export const NORMAL_TENSION: TensionProfile = {
  approachMs: APPROACH_MS,
  firstHitDelayMs: FIRST_HIT_DELAY_MS,
  hitIntervalMs: HIT_INTERVAL_MS,
  hitDamage: HIT_DAMAGE,
  passiveDrainPerSec: PASSIVE_DRAIN_PER_SEC,
  captureHeal: CAPTURE_HEAL,
  phaseKnockback: 0,
}

export const TRIAL_TENSION: TensionProfile = {
  approachMs: TRIAL_APPROACH_MS,
  firstHitDelayMs: TRIAL_FIRST_HIT_DELAY_MS,
  hitIntervalMs: TRIAL_HIT_INTERVAL_MS,
  hitDamage: TRIAL_HIT_DAMAGE,
  passiveDrainPerSec: TRIAL_PASSIVE_DRAIN_PER_SEC,
  captureHeal: TRIAL_CAPTURE_HEAL,
  phaseKnockback: 0,
}

export const BOSS_TENSION: TensionProfile = {
  approachMs: BOSS_APPROACH_MS,
  firstHitDelayMs: BOSS_FIRST_HIT_DELAY_MS,
  hitIntervalMs: BOSS_HIT_INTERVAL_MS,
  hitDamage: BOSS_HIT_DAMAGE,
  passiveDrainPerSec: BOSS_PASSIVE_DRAIN_PER_SEC,
  captureHeal: BOSS_CAPTURE_HEAL,
  phaseKnockback: BOSS_PHASE_KNOCKBACK,
}

/** NG+ secret haunt — harder than trial, shy of boss. */
export const SECRET_TENSION: TensionProfile = {
  approachMs: 4800,
  firstHitDelayMs: 320,
  hitIntervalMs: 900,
  hitDamage: 0.38,
  passiveDrainPerSec: 0.05,
  captureHeal: 0.32,
  phaseKnockback: 0.2,
}

export const DEMON_TENSION: TensionProfile = {
  approachMs: DEMON_APPROACH_MS,
  firstHitDelayMs: DEMON_FIRST_HIT_DELAY_MS,
  hitIntervalMs: DEMON_HIT_INTERVAL_MS,
  hitDamage: DEMON_HIT_DAMAGE,
  passiveDrainPerSec: DEMON_PASSIVE_DRAIN_PER_SEC,
  captureHeal: DEMON_CAPTURE_HEAL,
  phaseKnockback: DEMON_PHASE_KNOCKBACK,
}

export function tensionFor(kind: string | null): TensionProfile {
  if (kind === 'demon') return DEMON_TENSION
  if (kind === 'boss') return BOSS_TENSION
  if (kind === 'secret') return SECRET_TENSION
  if (kind === 'trial') return TRIAL_TENSION
  return NORMAL_TENSION
}
