/**
 * NG+ secret character ghost — unlocked by following the polaroid cipher to a crypt.
 * Only available in New Game+. Harder than the trial echo; unique lore.
 */

import { SECRET_TRIGGER_LABELS } from '../types'
import { getSave, patchSave } from '../save/gameSave'

export const SECRET_GHOST_ID = 'pale_archivist' as const

export const SECRET_GHOST = {
  id: SECRET_GHOST_ID,
  kind: 'secret' as const,
  name: 'The Pale Archivist',
  epithet: 'vault-breath · catalogued wrong',
  labels: SECRET_TRIGGER_LABELS,
  primaryLabel: 'crypt' as const,
  description:
    'A vaulted hunger that files the living under the wrong name. The cipher on the photographs spelled CRYPT.',
} as const

export function isSecretUnlocked(): boolean {
  return getSave().secretUnlocked
}

export function markSecretUnlocked(): void {
  patchSave({ secretUnlocked: true }, { toast: 'Vault unlock recorded.' })
}

export function readForceSecretGhost(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('forceSecretGhost') === '1'
  } catch {
    return false
  }
}
