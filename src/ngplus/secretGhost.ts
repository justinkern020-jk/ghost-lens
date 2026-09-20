/**
 * NG+ secret character ghost — unlocked by following the polaroid cipher to a crypt.
 * Only available in New Game+. Harder than the trial echo; unique lore.
 */

import { SECRET_TRIGGER_LABELS } from '../types'

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

const UNLOCKED_KEY = 'ghost-lens-secret-unlocked-v1'

export function isSecretUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCKED_KEY) === '1'
  } catch {
    return false
  }
}

export function markSecretUnlocked(): void {
  try {
    localStorage.setItem(UNLOCKED_KEY, '1')
  } catch {
    /* private mode */
  }
}

export function readForceSecretGhost(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('forceSecretGhost') === '1'
  } catch {
    return false
  }
}
