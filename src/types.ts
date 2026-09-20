export const TARGET_LABELS = ['tombstone', 'ring', 'doll', 'lake'] as const
export type TargetType = (typeof TARGET_LABELS)[number]

/** All spirit kinds including the unlocked boss. */
export type SpiritKind = TargetType | 'boss'

export const CANDIDATE_LABELS = [
  ...TARGET_LABELS,
  'empty room',
  'plain wall',
  'person',
  'furniture',
  'none of the above',
] as const

export interface DetectionResult {
  label: TargetType | null
  confidence: number
  scores: Record<string, number>
}

export interface SpiritLore {
  /** Who / what the spirit is. */
  name: string
  /** Short epithet under the polaroid caption. */
  epithet: string
  /** Intimate first-person note about being trapped in the photo. */
  trappedNote: string
}

export interface Capture {
  id: string
  target: SpiritKind
  timestamp: number
  /** Polaroid-framed still (data URL). */
  dataUrl: string
  mode: 'webxr' | 'fallback'
  lore: SpiritLore
  /** Which lore variation index was used. */
  loreVariant: number
  isBoss?: boolean
}

export type ArMode = 'checking' | 'webxr' | 'fallback' | 'unsupported'

export interface GhostState {
  visible: boolean
  target: SpiritKind | null
  confidence: number
  fleeing: boolean
  anchored: boolean
}

/** Unique target types required before the boss may spawn. */
export const BOSS_UNLOCK_UNIQUE = TARGET_LABELS.length

/** Capture taps required to seal the boss. */
export const BOSS_CAPTURE_PHASES = 3
