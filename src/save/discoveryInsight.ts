/**
 * Insight grants — completed catches + discovery only (never mid-ritual seal taps).
 * Field authenticity bonus when earned under real dusk / no force flags.
 */

import {
  FIELD_AUTHENTICITY_BONUS,
  FIRST_CATCH_BONUS,
  insightForCapture,
  insightForDiscovery,
  type InsightDiscoveryKind,
} from '../shop/favorStore'
import { getSave, patchSave } from './gameSave'
import { isFieldAuthentic } from './fieldAuthenticity'

export interface InsightGrantResult {
  base: number
  fieldBonus: number
  firstBonus: number
  total: number
  field: boolean
}

export function grantDiscoveryInsight(
  kind: InsightDiscoveryKind,
  opts?: { forceField?: boolean },
): InsightGrantResult {
  const base = insightForDiscovery(kind)
  const field = opts?.forceField ?? isFieldAuthentic()
  const fieldBonus = field ? FIELD_AUTHENTICITY_BONUS : 0
  const total = base + fieldBonus
  patchSave(
    { insight: getSave().insight + total },
    { toast: field ? `+${total} Insight (field)` : `+${total} Insight` },
  )
  return { base, fieldBonus, firstBonus: 0, total, field }
}

/** Completed catch only — call from finishCapture, never mid-ritual phase taps. */
export function grantCatchInsight(
  kind: string,
  opts?: { isFirstCatch?: boolean; forceField?: boolean },
): InsightGrantResult {
  const base = insightForCapture(kind)
  const field = opts?.forceField ?? isFieldAuthentic()
  const fieldBonus = field ? FIELD_AUTHENTICITY_BONUS : 0
  const firstBonus = opts?.isFirstCatch ? FIRST_CATCH_BONUS : 0
  const total = base + fieldBonus + firstBonus
  const patch: Parameters<typeof patchSave>[0] = {
    insight: getSave().insight + total,
  }
  if (field) {
    patch.fieldSealCount = getSave().fieldSealCount + 1
  }
  const bits = [`+${total} Insight`]
  if (field) bits.push('field')
  if (firstBonus) bits.push('first')
  patchSave(patch, { toast: bits.join(' · ') })
  return { base, fieldBonus, firstBonus, total, field }
}

/** Undertaker first-catch reactions (diegetic). */
export const FIRST_CATCH_LINES: Record<string, string> = {
  tombstone:
    'Dirt under the emulsion. You brought me a grave that still remembers being open. I will keep the measure.',
  ring:
    'A vow that outlived the voice. Keep that polaroid face-down — gold catches the wrong light.',
  doll:
    "Vacant varnish. Children's things should not stare so steadily. Logged.",
  lake:
    'Wet grain. Something came home incomplete. Do not hang it where morning reaches.',
  trial:
    'A thin practice haunt. Good. The chair teaches before the grounds do.',
  boss:
    'Four hungers wearing one coat. You sealed a threshold — expensive work.',
  demon:
    'Empty seats. The playground pays in silence. I will not ask what the chains said.',
  secret:
    'Vault breath. The catalog had your name under the wrong heading. Corrected — for now.',
}

export function recordFirstCatch(kind: string): string | null {
  const s = getSave()
  if (s.firstCatchKinds.includes(kind)) return null
  const line = FIRST_CATCH_LINES[kind] ?? 'Another hunger on paper. The ledger notes it.'
  patchSave(
    {
      firstCatchKinds: [...s.firstCatchKinds, kind],
      undertakerNotes: [...s.undertakerNotes, line],
    },
    { toast: 'Undertaker notes a first seal.' },
  )
  return line
}
