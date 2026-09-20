/**
 * Central versioned save blob — single source of truth for player progress.
 * Migrates scattered legacy localStorage keys on first boot.
 * Export/import JSON so outdoor players can back up across devices / clears.
 */

import type { Capture } from '../types'
import type { OccultItemId } from '../shop/favorStore'

export const SAVE_KEY = 'ghost-lens-save-v1'
export const SAVE_VERSION = 1

/** Legacy keys migrated into the blob (kept readable for one-shot migration). */
export const LEGACY_KEYS = {
  polaroids: 'ghost-lens-polaroids-v1',
  favor: 'ghost-lens-favor-v1', // legacy Favor → Insight
  insight: 'ghost-lens-insight-v1',
  owned: 'ghost-lens-undertaker-owned-v1',
  clearCount: 'ghost-lens-clear-count-v1',
  keptDemon: 'ghost-lens-kept-demon-polaroid-v1',
  trueEnd: 'ghost-lens-true-good-ending-v1',
  kellerCharm: 'ghost-lens-keller-charm-v1',
  ngplus: 'ghost-lens-ngplus-v1',
  secretUnlocked: 'ghost-lens-secret-unlocked-v1',
  spookbox: 'ghost-lens-spookbox-v1',
  charmTraded: 'ghost-lens-charm-traded-for-spookbox-v1',
  metMaker: 'ghost-lens-met-spookbox-maker-v1',
  collectibles: 'ghost-lens-lore-collectibles-v1',
  ambientScans: 'ghost-lens-ambient-scans-v1',
  voiceHints: 'ghost-lens-voice-hints-v1',
  strangerClues: 'ghost-lens-stranger-clues-v1',
  forceDusk: 'ghost-lens-force-dusk',
  forceFullMoon: 'ghost-lens-force-full-moon',
  forceBoss: 'ghost-lens-force-boss',
  forcePlayground: 'ghost-lens-force-playground',
  forceTrial: 'ghost-lens-force-trial',
  trialOnboarded: 'ghost-lens-trial-onboarded',
  firstCatch: 'ghost-lens-first-catch-v1',
  fieldSeals: 'ghost-lens-field-seals-v1',
  equipped: 'ghost-lens-equipped-item-v1',
} as const

export interface GhostLensSave {
  v: number
  savedAt: number
  polaroids: Capture[]
  /** Player progression currency (formerly Favor). */
  insight: number
  ownedItems: OccultItemId[]
  equippedItem: OccultItemId | null
  clearCount: number
  keptDemonPolaroid: boolean
  trueGoodEnding: boolean
  kellerCharm: boolean
  ngplus: boolean
  secretUnlocked: boolean
  spookboxOwned: boolean
  charmTradedForSpookbox: boolean
  metSpookboxMaker: boolean
  collectibles: string[]
  ambientScans: string[]
  voiceHints: string[]
  strangerClues: string[]
  forceDusk: boolean
  forceFullMoon: boolean
  forceBoss: boolean
  forcePlayground: boolean
  forceTrial: boolean
  trialOnboarded: boolean
  /** Spirit kinds the player has sealed at least once (first-catch journal). */
  firstCatchKinds: string[]
  /** Number of field-authentic seals (real dusk, no force flags). */
  fieldSealCount: number
  undertakerNotes: string[]
  /** Cold-open bazaar intro has been completed (or grandfathered). */
  introSeen: boolean
}

export function emptySave(): GhostLensSave {
  return {
    v: SAVE_VERSION,
    savedAt: Date.now(),
    polaroids: [],
    insight: 0,
    ownedItems: [],
    equippedItem: null,
    clearCount: 0,
    keptDemonPolaroid: false,
    trueGoodEnding: false,
    kellerCharm: false,
    ngplus: false,
    secretUnlocked: false,
    spookboxOwned: false,
    charmTradedForSpookbox: false,
    metSpookboxMaker: false,
    collectibles: [],
    ambientScans: [],
    voiceHints: [],
    strangerClues: [],
    forceDusk: false,
    forceFullMoon: false,
    forceBoss: false,
    forcePlayground: false,
    forceTrial: false,
    trialOnboarded: false,
    firstCatchKinds: [],
    fieldSealCount: 0,
    undertakerNotes: [],
    introSeen: false,
  }
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* quota / private */
  }
}

function lsFlag(key: string): boolean {
  return lsGet(key) === '1'
}

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return []
  try {
    const p = JSON.parse(raw) as unknown
    if (!Array.isArray(p)) return []
    return p.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

function parsePolaroids(raw: string | null): Capture[] {
  if (!raw) return []
  try {
    const p = JSON.parse(raw) as Capture[]
    if (!Array.isArray(p)) return []
    return p.filter(
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

/** One-shot migrate scattered keys → blob. Safe to call repeatedly. */
export function migrateLegacyIntoSave(): GhostLensSave {
  const existing = readSaveRaw()
  if (existing) {
    // Still absorb any legacy keys that appeared later / were written dual
    return mergeLegacyOnto(existing)
  }
  const s = emptySave()
  return mergeLegacyOnto(s)
}

function mergeLegacyOnto(s: GhostLensSave): GhostLensSave {
  const next = { ...s }
  const pol = parsePolaroids(lsGet(LEGACY_KEYS.polaroids))
  if (pol.length && (!next.polaroids.length || pol.length > next.polaroids.length)) {
    next.polaroids = pol
  }
  // migrate Favor → Insight from legacy keys + any old blob.favor
  const legacyFavor = Number(lsGet(LEGACY_KEYS.favor) ?? '')
  const legacyInsight = Number(lsGet(LEGACY_KEYS.insight) ?? '')
  const fromFavor = Number.isFinite(legacyFavor) ? Math.floor(legacyFavor) : 0
  const fromInsight = Number.isFinite(legacyInsight) ? Math.floor(legacyInsight) : 0
  next.insight = Math.max(next.insight, fromFavor, fromInsight)

  const owned = parseJsonArray(lsGet(LEGACY_KEYS.owned)) as OccultItemId[]
  if (owned.length) {
    next.ownedItems = [...new Set([...next.ownedItems, ...owned])]
  }
  const eq = lsGet(LEGACY_KEYS.equipped)
  if (eq && !next.equippedItem) next.equippedItem = eq as OccultItemId

  const clears = Number(lsGet(LEGACY_KEYS.clearCount) ?? '')
  if (Number.isFinite(clears) && clears > next.clearCount) next.clearCount = Math.floor(clears)

  if (lsFlag(LEGACY_KEYS.keptDemon)) next.keptDemonPolaroid = true
  if (lsFlag(LEGACY_KEYS.trueEnd)) next.trueGoodEnding = true
  if (lsFlag(LEGACY_KEYS.kellerCharm)) next.kellerCharm = true
  if (lsFlag(LEGACY_KEYS.ngplus)) next.ngplus = true
  if (lsFlag(LEGACY_KEYS.secretUnlocked)) next.secretUnlocked = true
  if (lsFlag(LEGACY_KEYS.spookbox)) next.spookboxOwned = true
  if (lsFlag(LEGACY_KEYS.charmTraded)) next.charmTradedForSpookbox = true
  if (lsFlag(LEGACY_KEYS.metMaker)) next.metSpookboxMaker = true
  if (lsFlag(LEGACY_KEYS.forceDusk)) next.forceDusk = true
  if (lsFlag(LEGACY_KEYS.forceFullMoon)) next.forceFullMoon = true
  if (lsFlag(LEGACY_KEYS.forceBoss)) next.forceBoss = true
  if (lsFlag(LEGACY_KEYS.forcePlayground)) next.forcePlayground = true
  if (lsFlag(LEGACY_KEYS.forceTrial)) next.forceTrial = true
  if (lsFlag(LEGACY_KEYS.trialOnboarded)) next.trialOnboarded = true

  next.collectibles = [...new Set([...next.collectibles, ...parseJsonArray(lsGet(LEGACY_KEYS.collectibles))])]
  next.ambientScans = [...new Set([...next.ambientScans, ...parseJsonArray(lsGet(LEGACY_KEYS.ambientScans))])]
  next.voiceHints = [...new Set([...next.voiceHints, ...parseJsonArray(lsGet(LEGACY_KEYS.voiceHints))])]
  next.strangerClues = [...new Set([...next.strangerClues, ...parseJsonArray(lsGet(LEGACY_KEYS.strangerClues))])]
  next.firstCatchKinds = [
    ...new Set([...next.firstCatchKinds, ...parseJsonArray(lsGet(LEGACY_KEYS.firstCatch))]),
  ]
  const fs = Number(lsGet(LEGACY_KEYS.fieldSeals) ?? '')
  if (Number.isFinite(fs) && fs > next.fieldSealCount) next.fieldSealCount = Math.floor(fs)

  next.v = SAVE_VERSION
  next.savedAt = Date.now()
  writeSaveRaw(next)
  mirrorLegacy(next)
  return next
}

function readSaveRaw(): GhostLensSave | null {
  const raw = lsGet(SAVE_KEY)
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as GhostLensSave
    if (!p || typeof p !== 'object') return null
    const legacy = p as GhostLensSave & { favor?: number }
    const merged: GhostLensSave = { ...emptySave(), ...legacy, v: SAVE_VERSION }
    // Migrate old blob field `favor` → `insight`
    if (typeof legacy.favor === 'number') {
      merged.insight = Math.max(merged.insight || 0, Math.floor(legacy.favor))
    }
    // Pre-intro saves: don't force mid-hunt players through the cold open
    if (!('introSeen' in legacy)) {
      merged.introSeen = true
    } else {
      merged.introSeen = Boolean(legacy.introSeen)
    }
    return merged
  } catch {
    return null
  }
}

function writeSaveRaw(s: GhostLensSave): void {
  lsSet(SAVE_KEY, JSON.stringify({ ...s, v: SAVE_VERSION, savedAt: Date.now() }))
}

/** Dual-write critical legacy keys so older helpers / tabs keep working. */
function mirrorLegacy(s: GhostLensSave): void {
  lsSet(LEGACY_KEYS.polaroids, JSON.stringify(s.polaroids.slice(0, 24)))
  lsSet(LEGACY_KEYS.favor, String(s.insight)) // dual-write legacy Favor key
  lsSet(LEGACY_KEYS.insight, String(s.insight))
  lsSet(LEGACY_KEYS.owned, JSON.stringify(s.ownedItems))
  if (s.equippedItem) lsSet(LEGACY_KEYS.equipped, s.equippedItem)
  else {
    try {
      localStorage.removeItem(LEGACY_KEYS.equipped)
    } catch {
      /* */
    }
  }
  lsSet(LEGACY_KEYS.clearCount, String(s.clearCount))
  const flag = (key: string, on: boolean) => {
    if (on) lsSet(key, '1')
    else {
      try {
        localStorage.removeItem(key)
      } catch {
        /* */
      }
    }
  }
  flag(LEGACY_KEYS.keptDemon, s.keptDemonPolaroid)
  flag(LEGACY_KEYS.trueEnd, s.trueGoodEnding)
  flag(LEGACY_KEYS.kellerCharm, s.kellerCharm)
  flag(LEGACY_KEYS.ngplus, s.ngplus)
  flag(LEGACY_KEYS.secretUnlocked, s.secretUnlocked)
  flag(LEGACY_KEYS.spookbox, s.spookboxOwned)
  flag(LEGACY_KEYS.charmTraded, s.charmTradedForSpookbox)
  flag(LEGACY_KEYS.metMaker, s.metSpookboxMaker)
  flag(LEGACY_KEYS.forceDusk, s.forceDusk)
  flag(LEGACY_KEYS.forceFullMoon, s.forceFullMoon)
  flag(LEGACY_KEYS.forceBoss, s.forceBoss)
  flag(LEGACY_KEYS.forcePlayground, s.forcePlayground)
  flag(LEGACY_KEYS.forceTrial, s.forceTrial)
  flag(LEGACY_KEYS.trialOnboarded, s.trialOnboarded)
  lsSet(LEGACY_KEYS.collectibles, JSON.stringify(s.collectibles))
  lsSet(LEGACY_KEYS.ambientScans, JSON.stringify(s.ambientScans))
  lsSet(LEGACY_KEYS.voiceHints, JSON.stringify(s.voiceHints))
  lsSet(LEGACY_KEYS.strangerClues, JSON.stringify(s.strangerClues))
  lsSet(LEGACY_KEYS.firstCatch, JSON.stringify(s.firstCatchKinds))
  lsSet(LEGACY_KEYS.fieldSeals, String(s.fieldSealCount))
}

let cache: GhostLensSave | null = null
let toastHandler: ((msg: string) => void) | null = null

export function onSaveToast(handler: ((msg: string) => void) | null) {
  toastHandler = handler
}

export function getSave(): GhostLensSave {
  if (!cache) {
    cache = migrateLegacyIntoSave()
  }
  return cache
}

export function patchSave(
  patch: Partial<GhostLensSave>,
  opts?: { toast?: string },
): GhostLensSave {
  const cur = getSave()
  const next: GhostLensSave = {
    ...cur,
    ...patch,
    v: SAVE_VERSION,
    savedAt: Date.now(),
  }
  // Always keep arrays unique when patched
  if (patch.ownedItems) next.ownedItems = [...new Set(patch.ownedItems)]
  if (patch.collectibles) next.collectibles = [...new Set(patch.collectibles)]
  if (patch.ambientScans) next.ambientScans = [...new Set(patch.ambientScans)]
  if (patch.voiceHints) next.voiceHints = [...new Set(patch.voiceHints)]
  if (patch.strangerClues) next.strangerClues = [...new Set(patch.strangerClues)]
  if (patch.firstCatchKinds) next.firstCatchKinds = [...new Set(patch.firstCatchKinds)]
  if (patch.undertakerNotes) next.undertakerNotes = [...new Set(patch.undertakerNotes)]
  if (patch.polaroids) next.polaroids = patch.polaroids.slice(0, 24)

  cache = next
  writeSaveRaw(next)
  mirrorLegacy(next)
  if (opts?.toast && toastHandler) toastHandler(opts.toast)
  return next
}

export function exportSaveJson(): string {
  const s = getSave()
  return JSON.stringify({ ...s, exportedAt: new Date().toISOString() }, null, 2)
}

export function downloadSaveFile(): void {
  const json = exportSaveJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `ghost-lens-save-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importSaveJson(json: string): { ok: true; save: GhostLensSave } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json) as Partial<GhostLensSave> & { polaroids?: Capture[] }
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Save file is not an object.' }
    }
    if (!Array.isArray(parsed.polaroids) && parsed.polaroids != null) {
      return { ok: false, error: 'Invalid polaroids array.' }
    }
    const base = emptySave()
    const merged: GhostLensSave = {
      ...base,
      ...parsed,
      v: SAVE_VERSION,
      savedAt: Date.now(),
      polaroids: Array.isArray(parsed.polaroids) ? parsed.polaroids.slice(0, 24) : base.polaroids,
      ownedItems: Array.isArray(parsed.ownedItems) ? (parsed.ownedItems as OccultItemId[]) : base.ownedItems,
      collectibles: Array.isArray(parsed.collectibles) ? parsed.collectibles : base.collectibles,
      ambientScans: Array.isArray(parsed.ambientScans) ? parsed.ambientScans : base.ambientScans,
      voiceHints: Array.isArray(parsed.voiceHints) ? parsed.voiceHints : base.voiceHints,
      strangerClues: Array.isArray(parsed.strangerClues) ? parsed.strangerClues : base.strangerClues,
      firstCatchKinds: Array.isArray(parsed.firstCatchKinds) ? parsed.firstCatchKinds : base.firstCatchKinds,
      undertakerNotes: Array.isArray(parsed.undertakerNotes) ? parsed.undertakerNotes : base.undertakerNotes,
      insight: Math.max(
        0,
        Math.floor(
          Number(
            parsed.insight ??
              (parsed as unknown as { favor?: number }).favor,
          ) || 0,
        ),
      ),
      clearCount: Math.max(0, Math.floor(Number(parsed.clearCount) || 0)),
      fieldSealCount: Math.max(0, Math.floor(Number(parsed.fieldSealCount) || 0)),
      introSeen:
        typeof parsed.introSeen === 'boolean'
          ? parsed.introSeen
          : 'introSeen' in parsed
            ? Boolean(parsed.introSeen)
            : true,
    }
    cache = merged
    writeSaveRaw(merged)
    mirrorLegacy(merged)
    if (toastHandler) toastHandler('Save imported. Progress restored.')
    return { ok: true, save: merged }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not parse save JSON.' }
  }
}

/** Boot helper — call once from App. */
export function bootSave(): GhostLensSave {
  cache = null
  return getSave()
}
