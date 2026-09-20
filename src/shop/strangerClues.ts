/**
 * Mysterious strangers — appear when non-ghost real-world objects are framed.
 * Cryptic whispers hint which undertaker tool harms which haunt.
 * Clue flags persist so strangers don't spam.
 */

import type { OccultItemId } from './favorStore'

/** CLIP labels that can summon a stranger (not the 4 ghost triggers). */
export const STRANGER_LABELS = [
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

export type StrangerLabel = (typeof STRANGER_LABELS)[number]

export interface StrangerClue {
  id: string
  /** CLIP labels that can trigger this clue. */
  labels: readonly StrangerLabel[]
  /** Short stranger name / silhouette tag. */
  stranger: string
  /** Cryptic whisper — points at tool ↔ haunt without a wiki dump. */
  whisper: string
  /** Which item the clue is about (for progress tracking). */
  hintsItem: OccultItemId
}

export const STRANGER_CLUES: StrangerClue[] = [
  {
    id: 'wet_threshold',
    labels: ['candle', 'umbrella'],
    stranger: 'A figure with damp cuffs',
    whisper:
      'Where water keeps a shape, pour the white line and do not break it. Wet things hate a dry border.',
    hintsItem: 'salt_line',
  },
  {
    id: 'grave_measure',
    labels: ['church', 'cross', 'key'],
    stranger: 'A mourner counting paces',
    whisper:
      'Dirt that never finished covering answers to coffin iron. Drive the cold head where the stone still leans.',
    hintsItem: 'iron_nail',
  },
  {
    id: 'vacant_glass',
    labels: ['mirror', 'book', 'bible'],
    stranger: 'Someone who will not blink',
    whisper:
      'Porcelain practices stillness so you will lean closer. Show it a second face in silver — vacant eyes flinch first.',
    hintsItem: 'silver_mirror',
  },
  {
    id: 'vow_thread',
    labels: ['bouquet', 'flowers', 'shoes'],
    stranger: 'A guest late to the reception',
    whisper:
      'Promises that outlast the voice that made them ring in metal. Wax and black thread hush a vow that will not stop reaching.',
    hintsItem: 'hush_charm',
  },
  {
    id: 'empty_seat',
    labels: ['swing', 'clock'],
    stranger: 'A caretaker with no children',
    whisper:
      'When the seats move alone, cloth remembers a name you must not speak. Black crepe for the grounds — nothing cheaper will hold.',
    hintsItem: 'black_crepe',
  },
]

const CLUE_FLAGS_KEY = 'ghost-lens-stranger-clues-v1'

export function loadHeardClues(): Set<string> {
  try {
    const raw = localStorage.getItem(CLUE_FLAGS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

export function saveHeardClues(heard: Set<string>): void {
  try {
    localStorage.setItem(CLUE_FLAGS_KEY, JSON.stringify([...heard]))
  } catch {
    /* private mode */
  }
}

export function clueForLabel(
  label: string,
  heard: Set<string>,
): StrangerClue | null {
  for (const clue of STRANGER_CLUES) {
    if (heard.has(clue.id)) continue
    if ((clue.labels as readonly string[]).includes(label)) return clue
  }
  return null
}

export function findClueById(id: string): StrangerClue | undefined {
  return STRANGER_CLUES.find((c) => c.id === id)
}
