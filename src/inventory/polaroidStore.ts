import type { Capture, TargetType } from '../types'
import { TARGET_LABELS } from '../types'

const STORAGE_KEY = 'ghost-lens-polaroids-v1'

export function loadPolaroids(): Capture[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Capture[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (c) =>
        c &&
        typeof c.id === 'string' &&
        typeof c.dataUrl === 'string' &&
        c.lore &&
        typeof c.lore.name === 'string',
    )
  } catch {
    return []
  }
}

export function savePolaroids(captures: Capture[]): void {
  try {
    // Cap storage: keep newest 24 (data URLs are heavy)
    const trimmed = captures.slice(0, 24)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // Quota / private mode — keep session-only
  }
}

export function uniqueTargetTypes(captures: Capture[]): Set<string> {
  const s = new Set<string>()
  for (const c of captures) {
    // Trial / lesser echo does not count toward the four main seals
    if (
      c.target !== 'boss' &&
      c.target !== 'demon' &&
      c.target !== 'trial' &&
      !c.isTrial
    ) {
      s.add(c.target)
    }
  }
  return s
}

export function countOfKind(captures: Capture[], kind: string): number {
  return captures.filter((c) => c.target === kind).length
}

export function hasBossCapture(captures: Capture[]): boolean {
  return captures.some((c) => c.target === 'boss' || c.isBoss)
}

export function hasDemonCapture(captures: Capture[]): boolean {
  return captures.some((c) => c.target === 'demon' || c.isDemon)
}

/** One polaroid of each base type (for ritual layout / unlock checks). */
export function polaroidsForRitual(captures: Capture[]): Capture[] {
  const picked: Capture[] = []
  for (const t of TARGET_LABELS) {
    const found = captures.find((c) => c.target === t)
    if (found) picked.push(found)
  }
  return picked
}

export function hasCompletePolaroidSet(captures: Capture[]): boolean {
  return TARGET_LABELS.every((t: TargetType) =>
    captures.some((c) => c.target === t),
  )
}
