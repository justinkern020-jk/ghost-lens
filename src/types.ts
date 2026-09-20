import { allAmbientScanLabels } from './lore/ambientScans'
export const TARGET_LABELS = ['tombstone', 'ring', 'doll', 'lake'] as const
export type TargetType = (typeof TARGET_LABELS)[number]

/**
 * Trial / tutorial lesser echo — common CLIP prop, camera-only capture.
 * Not one of the four main seals.
 */
export const TRIAL_TRIGGER_LABEL = 'chair' as const
export type TrialTriggerLabel = typeof TRIAL_TRIGGER_LABEL

/** All spirit kinds including trial echo, mid-boss Warden, and endgame Demon. */
export type SpiritKind = TargetType | 'trial' | 'boss' | 'demon' | 'secret'

/** CLIP labels that suggest a playground scene (endgame location). */
export const PLAYGROUND_LABELS = [
  'playground',
  'swing set',
  'slide',
  'merry-go-round',
  'sandbox',
] as const
export type PlaygroundLabel = (typeof PLAYGROUND_LABELS)[number]

/** Real-world props that can summon mysterious strangers (clue givers). */
export const STRANGER_SCENE_LABELS = [
  'church',
  'cross',
  'candle',
  'bible',
  'book',
  'clock',
  'shoes',
  'swing',
  'bouquet',
  'flowers',
  'key',
  'umbrella',
  'mirror',
] as const


/** Real-world props that unlock hidden lore collectibles (ghost-tied scraps). */
export const COLLECTIBLE_SCENE_LABELS = [
  'wilted flowers',
  'iron fence',
  'angel statue',
  'obituary',
  'newspaper',
  'champagne glass',
  'wine glass',
  'jewelry box',
  'wedding dress',
  'ring box',
  'necklace',
  'toy chest',
  'crib',
  'music box',
  "child's shoe",
  'teddy bear',
  'dollhouse',
  'toy',
  'pier',
  'boat',
  'fishing rod',
  'reeds',
  'life vest',
  'wet shoes',
  'tackle box',
] as const

/** CLIP labels that can summon the NG+ secret haunt (crypt). */
export const SECRET_TRIGGER_LABELS = [
  'crypt',
  'mausoleum',
  'ossuary',
  'stone vault',
  'tomb',
] as const

export const CANDIDATE_LABELS = [
  ...allAmbientScanLabels(),
  ...SECRET_TRIGGER_LABELS,
  ...TARGET_LABELS,
  TRIAL_TRIGGER_LABEL,
  ...PLAYGROUND_LABELS,
  ...STRANGER_SCENE_LABELS,
  ...COLLECTIBLE_SCENE_LABELS,
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
  /** Best playground-ish label score (scene detect). */
  playgroundConfidence?: number
  playgroundLabel?: PlaygroundLabel | null
  /** Best mysterious-stranger prop label. */
  strangerLabel?: string | null
  strangerConfidence?: number
  collectibleLabel?: string | null
  collectibleConfidence?: number
  /** Trial / lesser-echo prop (chair). */
  trialLabel?: TrialTriggerLabel | null
  trialConfidence?: number
  secretConfidence?: number
  ambientScanLabel?: string | null
  ambientScanConfidence?: number
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
  isDemon?: boolean
  /** Tutorial lesser echo — not a main seal. */
  isTrial?: boolean
  /** NG+ secret character ghost. */
  isSecret?: boolean
}

export type ArMode = 'checking' | 'webxr' | 'fallback' | 'unsupported'

export interface GhostState {
  visible: boolean
  target: SpiritKind | null
  confidence: number
  fleeing: boolean
  anchored: boolean
}

/** Unique target types required before the Warden / Playground may unlock. */
export const BOSS_UNLOCK_UNIQUE = TARGET_LABELS.length

/** Capture taps required to seal the Threshold Warden (mid-boss). */
export const BOSS_CAPTURE_PHASES = 3

/** Capture taps required to seal the Playground Demon (endgame). */
export const DEMON_CAPTURE_PHASES = 5

export function isMultiSealKind(kind: SpiritKind | null): kind is 'boss' | 'demon' {
  return kind === 'boss' || kind === 'demon'
}

export function isTrialKind(kind: SpiritKind | null): kind is 'trial' {
  return kind === 'trial'
}

export function isSecretKind(kind: SpiritKind | null): kind is 'secret' {
  return kind === 'secret'
}

/** Main-seal types only (excludes trial / boss / demon). */
export function isMainSealTarget(kind: string | null | undefined): kind is TargetType {
  return !!kind && (TARGET_LABELS as readonly string[]).includes(kind)
}

export function capturePhasesFor(kind: SpiritKind | null): number {
  if (kind === 'demon') return DEMON_CAPTURE_PHASES
  if (kind === 'boss') return BOSS_CAPTURE_PHASES
  return 1
}
