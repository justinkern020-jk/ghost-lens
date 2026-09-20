import { getSave, patchSave } from '../save/gameSave'
/**
 * Ambient object scans — melancholy diegetic readings when props are held in frame.
 * Separate from combat spawns; scanning does not summon a ghost.
 * ~35% of entries carry a soft clue toward strangers, relics, cipher, or shop matchups.
 */

export type AmbientClueKind = 'stranger' | 'relic' | 'cipher' | 'shop' | 'general'

export interface AmbientScanEntry {
  id: string
  /** CLIP label(s) that can trigger this reading. */
  labels: readonly string[]
  title: string
  /** Sad / melancholy lens reading. */
  reading: string
  /** Optional soft clue (~30–40% of catalog). */
  clue?: {
    kind: AmbientClueKind
    text: string
  }
}

export const AMBIENT_SCANS: AmbientScanEntry[] = [
  {
    id: 'empty_photo_frame',
    labels: ['picture frame', 'empty frame', 'photo frame'],
    title: 'Empty Frame',
    reading:
      'Glass over nothing. Someone meant to put a face here and never finished the sentence. Dust has learned the outline of an absence.',
  },
  {
    id: 'worn_gloves',
    labels: ['gloves', 'leather gloves', 'work gloves'],
    title: 'Worn Gloves',
    reading:
      'Fingers shaped these hollows and then left. The leather still remembers grip — and the cold of letting go.',
    clue: {
      kind: 'shop',
      text: 'Iron leaves a different taste than cloth. The Undertaker knows which metals the dirt still answers.',
    },
  },
  {
    id: 'cracked_teacup',
    labels: ['teacup', 'tea cup', 'cup'],
    title: 'Cracked Teacup',
    reading:
      'A hairline fracture holds the last warmth that never arrived. Porcelain keeps polite company with grief.',
  },
  {
    id: 'pocket_watch',
    labels: ['pocket watch', 'watch', 'stopwatch'],
    title: 'Stopped Watch',
    reading:
      'Hands frozen at an hour nobody claims. Time did not stop — someone simply refused to wind it again.',
    clue: {
      kind: 'stranger',
      text: 'Clocks that refuse to move still listen. Frame one near dusk; the living who walk edges sometimes speak.',
    },
  },
  {
    id: 'wilted_bouquet',
    labels: ['wilted bouquet', 'dead flowers', 'dried flowers'],
    title: 'Wilted Bouquet',
    reading:
      'Stems gone brown in water that forgot to be water. Devotion measured in days until the petals give up.',
  },
  {
    id: 'child_drawing',
    labels: ['drawing', 'crayon drawing', 'child drawing'],
    title: 'Child’s Drawing',
    reading:
      'A house with too many windows. A smile that does not reach the eyes the crayon tried to make. Someone hung it where the light is kindest.',
    clue: {
      kind: 'relic',
      text: 'Nursery things open the wrong quiet. A crib, a music box, a shoe under a chest — the journal keeps what the lens finds.',
    },
  },
  {
    id: 'rusty_key',
    labels: ['key', 'old key', 'skeleton key'],
    title: 'Rusty Key',
    reading:
      'It still fits a lock that may no longer exist. Rust is what promises do when nobody turns them.',
  },
  {
    id: 'fogged_mirror',
    labels: ['hand mirror', 'compact mirror', 'vanity mirror'],
    title: 'Fogged Mirror',
    reading:
      'Breath that is not yours clouded this glass once. Wipe it and the room looks back a half-second late.',
  },
  {
    id: 'lonely_shoe',
    labels: ['shoe', 'boot', 'sneaker'],
    title: 'Single Shoe',
    reading:
      'Its twin is elsewhere — or nowhere. The sole is worn on the inside edge, as if someone always turned toward home and never quite arrived.',
  },
  {
    id: 'unopened_letter',
    labels: ['envelope', 'letter', 'mail'],
    title: 'Unopened Letter',
    reading:
      'The seal is intact. The name on the front has been touched too many times with a thumb that could not bear to tear it.',
    clue: {
      kind: 'cipher',
      text: 'Margins remember what photographs forget. On a second hunt, letters sometimes burn themselves into the emulsion.',
    },
  },
  {
    id: 'rain_umbrella',
    labels: ['umbrella', 'closed umbrella'],
    title: 'Furled Umbrella',
    reading:
      'Still damp in the fold that never quite dried. It waited by a door for weather that came without the person who owned it.',
  },
  {
    id: 'church_hymnal',
    labels: ['hymnal', 'prayer book', 'songbook'],
    title: 'Hymnal',
    reading:
      'Pages thumbed open to a song about mercy. The bookmark is a bus ticket from a Sunday that did not end in the pew.',
    clue: {
      kind: 'stranger',
      text: 'Crosses and candlelight draw talkative silhouettes. Hold the frame steady when the lens finds them.',
    },
  },
  {
    id: 'broken_swing_chain',
    labels: ['chain', 'metal chain'],
    title: 'Broken Chain',
    reading:
      'One link open like a mouth. It once held weight that laughed. Now it only holds the idea of swinging.',
  },
  {
    id: 'salt_shaker',
    labels: ['salt shaker', 'salt cellar'],
    title: 'Salt Shaker',
    reading:
      'Grains cling to the glass as if afraid of the table. Ordinary seasoning — or a border someone used to pour against wet thresholds.',
    clue: {
      kind: 'shop',
      text: 'A measured pour for wet hungers. Insight buys what the Undertaker will not explain.',
    },
  },
  {
    id: 'baby_rattle',
    labels: ['rattle', 'baby rattle'],
    title: 'Silent Rattle',
    reading:
      'Beads that should chatter. Someone wrapped it in cloth so the house would stay quiet. The quiet stayed longer than the child.',
  },
  {
    id: 'train_ticket',
    labels: ['ticket', 'train ticket', 'bus ticket'],
    title: 'Expired Ticket',
    reading:
      'Destination punched. Date faded. The journey was paid for; the arrival was not collected.',
  },
  {
    id: 'spectacles',
    labels: ['glasses', 'eyeglasses', 'spectacles'],
    title: 'Folded Spectacles',
    reading:
      'Lenses cloudy with the oil of a nose that no longer presses here. The world through them was always a little kinder than it deserved.',
  },
  {
    id: 'candle_stub',
    labels: ['candle', 'candle stub', 'wax candle'],
    title: 'Candle Stub',
    reading:
      'Wax pooled like a held breath. The wick is black to the root. It burned for a vigil that outlasted the mourner.',
  },
]

/** Unique CLIP labels used by ambient scans (merged into candidate list). */
export function allAmbientScanLabels(): string[] {
  const s = new Set<string>()
  for (const e of AMBIENT_SCANS) {
    for (const l of e.labels) s.add(l)
  }
  return [...s]
}

export function ambientScanForLabel(label: string): AmbientScanEntry | null {
  for (const e of AMBIENT_SCANS) {
    if ((e.labels as readonly string[]).includes(label)) return e
  }
  return null
}

export function findAmbientScan(id: string): AmbientScanEntry | undefined {
  return AMBIENT_SCANS.find((e) => e.id === id)
}

export function loadSeenAmbientScans(): Set<string> {
  return new Set(getSave().ambientScans)
}

export function saveSeenAmbientScans(seen: Set<string>): void {
  patchSave({ ambientScans: [...seen] })
}

export function readForceScan(): string | boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    const v = q.get('forceScan')
    if (v === '1') return true
    if (v && v.length > 0) return v
    return false
  } catch {
    return false
  }
}
