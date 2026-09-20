import { getSave, patchSave } from '../save/gameSave'
/**
 * Disembodied voices — cryptic when/where hints for finding mysterious strangers.
 * Strangers still give item↔ghost matchups; voices teach the hunt schedule.
 */

export interface VoiceHint {
  id: string
  /** Spoken / subtitled whisper. */
  line: string
  /** Optional schedule note for the journal (still cryptic). */
  when: string
  /** Optional place/object context (still cryptic). */
  where: string
  /** Which stranger clue this points toward (soft link). */
  pointsToClueId: string
}

export const VOICE_HINTS: VoiceHint[] = [
  {
    id: 'bells_candle',
    line: 'When the bells should ring, seek the candle.',
    when: 'Dusk — the hour bells forget to finish.',
    where: 'Flame. Wax. A quiet that smells of church.',
    pointsToClueId: 'wet_threshold',
  },
  {
    id: 'cross_pace',
    line: 'After hard light dies, count paces by the upright wood.',
    when: 'First dark after dusk.',
    where: 'Churchyard edges · a cross that leans.',
    pointsToClueId: 'grave_measure',
  },
  {
    id: 'glass_book',
    line: 'Midnight’s neighbor: a glass that holds no face, a book that will not close.',
    when: 'Near midnight — weekend evenings if the week refuses you.',
    where: 'Mirror. Bible. Pages that watch back.',
    pointsToClueId: 'vacant_glass',
  },
  {
    id: 'flowers_shoes',
    line: 'When vows are spoken elsewhere, follow the flowers someone dropped.',
    when: 'Evening after a ceremony you were not invited to.',
    where: 'Bouquet · abandoned shoes · reception leftovers.',
    pointsToClueId: 'vow_thread',
  },
  {
    id: 'swing_clock',
    line: 'When the playground clock lies, the empty seat still swings.',
    when: 'Night on the grounds — dusk gate open.',
    where: 'Swing chains · a clock that ticks wrong.',
    pointsToClueId: 'empty_seat',
  },
]

export function loadHeardVoiceHints(): Set<string> {
  return new Set(getSave().voiceHints)
}

export function saveHeardVoiceHints(heard: Set<string>): void {
  patchSave({ voiceHints: [...heard] })
}

export function nextUnheardVoiceHint(heard: Set<string>): VoiceHint | null {
  return VOICE_HINTS.find((h) => !heard.has(h.id)) ?? null
}

export function findVoiceHint(id: string): VoiceHint | undefined {
  return VOICE_HINTS.find((h) => h.id === id)
}

/** Pick a rare hint: prefer unheard; null if all heard and not forcing. */
export function pickVoiceHint(heard: Set<string>, forceId?: string | null): VoiceHint | null {
  if (forceId && forceId !== '1') {
    return findVoiceHint(forceId) ?? nextUnheardVoiceHint(heard)
  }
  if (forceId === '1') {
    return nextUnheardVoiceHint(heard) ?? VOICE_HINTS[0]
  }
  return nextUnheardVoiceHint(heard)
}
