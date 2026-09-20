import type { Capture, TargetType } from '../types'
import { TARGET_LABELS } from '../types'
import { getSave, patchSave } from '../save/gameSave'

export function loadPolaroids(): Capture[] {
  return getSave().polaroids
}

export function savePolaroids(captures: Capture[]): void {
  patchSave({ polaroids: captures.slice(0, 24) })
}

export function uniqueTargetTypes(captures: Capture[]): Set<string> {
  const s = new Set<string>()
  for (const c of captures) {
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
