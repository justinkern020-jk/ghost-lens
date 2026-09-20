export const TARGET_LABELS = ['tombstone', 'ring', 'doll', 'lake'] as const
export type TargetType = (typeof TARGET_LABELS)[number]

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

export interface Capture {
  id: string
  target: TargetType
  timestamp: number
  dataUrl: string
  mode: 'webxr' | 'fallback'
}

export type ArMode = 'checking' | 'webxr' | 'fallback' | 'unsupported'

export interface GhostState {
  visible: boolean
  target: TargetType | null
  confidence: number
  fleeing: boolean
  anchored: boolean
}
