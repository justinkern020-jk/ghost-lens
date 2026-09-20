/**
 * NG+ polaroid letter cipher.
 * After returning Keller’s camera, subsequent NG+ runs stamp one glyph on each
 * polaroid (main four + trial). Together they spell the secret haunt’s location.
 *
 * Answer: C R Y P T  →  go to a crypt / mausoleum / ossuary.
 */

import type { SpiritKind, TargetType } from '../types'

/** The location the cipher spells. Documented for players who assemble the letters. */
export const CIPHER_ANSWER = 'CRYPT' as const

/** One stamped letter per cipher-bearing spirit kind. */
export const CIPHER_LETTERS: Record<TargetType | 'trial', string> = {
  tombstone: 'C',
  ring: 'R',
  doll: 'Y',
  lake: 'P',
  trial: 'T',
}

export function cipherLetterFor(kind: SpiritKind): string | null {
  if (kind === 'tombstone' || kind === 'ring' || kind === 'doll' || kind === 'lake' || kind === 'trial') {
    return CIPHER_LETTERS[kind]
  }
  return null
}

export function isCipherKind(kind: SpiritKind): boolean {
  return cipherLetterFor(kind) !== null
}
