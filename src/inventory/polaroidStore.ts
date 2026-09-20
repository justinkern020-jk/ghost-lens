import type { Capture } from '../types'

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
    if (c.target !== 'boss') s.add(c.target)
  }
  return s
}

export function countOfKind(captures: Capture[], kind: string): number {
  return captures.filter((c) => c.target === kind).length
}

export function hasBossCapture(captures: Capture[]): boolean {
  return captures.some((c) => c.target === 'boss' || c.isBoss)
}
