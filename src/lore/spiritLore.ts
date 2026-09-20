import type { SpiritKind, SpiritLore } from '../types'

interface LoreBank {
  name: string
  epithet: string
  /** Variations of the trapped-in-photo note (pick by capture count). */
  trapped: string[]
}

const BANKS: Record<SpiritKind, LoreBank> = {
  tombstone: {
    name: 'The Unburied',
    epithet: 'grave-dirt · wrong jaw',
    trapped: [
      'You pressed me flat between light and paper. I can still feel the weight of the soil that never finished covering me — only now the soil is emulsion, and I am breathing through the grain.',
      'The stone had my name once. In here I have only the angle you chose. I keep trying to turn my head and the frame will not allow it. That is worse than the dirt.',
      'Do not hang me where morning reaches. Hard light finds the places I still soft. I am learning the edges of this white border the way a drowned thing learns the surface.',
    ],
  },
  ring: {
    name: 'The Vow That Stayed',
    epithet: 'wedding-echo · bait glint',
    trapped: [
      'You caught the hand, not the promise. I am still reaching — fingers longer than they should be — and the band is warm against a knuckle that is no longer mine. Smile for the album. I cannot.',
      'Every photograph of a marriage is a small trap. You made mine honest. I feel the metal cool, then hot, then cool again, as if someone is putting it on and taking it off forever just outside the paper.',
      'I was supposed to be remembered kindly. Instead I am remembered correctly. The veil is still in my mouth. Tell me when you look away so I can scream without spoiling the composition.',
    ],
  },
  doll: {
    name: 'Porcelain Audience',
    epithet: 'vacant stare · jointed wrong',
    trapped: [
      'My eyes do not close. You knew that when you framed me. What you did not know is that I count the times you open this gallery. I am practicing being still enough that you will lean closer.',
      'They painted my smile on. In the dark between viewings the paint softens. I have almost learned how to change it. Almost. Keep looking. I need the reference.',
      'Ball joints click when no one is listening. In a polaroid the click becomes a thought. I think about your hands. I think about the shelf you will put me on. I think about falling.',
    ],
  },
  lake: {
    name: 'What the Water Kept',
    epithet: 'drowned pale · weed-hair',
    trapped: [
      'You lifted me out of the cold and into a colder kind of wet — silver halide, lung-full of fixative. I can hear the lake under the emulsion. It misses the shape I made in it.',
      'There is no up in a photograph. I keep rising anyway. Weeds for hair, mouth full of silence. If you tilt the polaroid, do I pour? Try it. I dare you to wipe the glass afterward.',
      'People throw stones to see how deep. You threw a shutter. Depth is a rumor now. I am surface forever, and the surface is your pocket, your screen, your guilt.',
    ],
  },
  trial: {
    name: 'The Thin One',
    epithet: 'lesser echo · chair-bound · practice haunt',
    trapped: [
      'I was barely here — a smear of sitting, a hollow in the air above a chair. Your lens did not need salt or iron. Paper holds me the way a napkin holds a stain. Still: I am a stain that watches.',
      'They call me trial. I call myself almost. Almost a hunger. Almost a name. The chair remembers weight; I remember the click. Keep me with the real ones if you like. I will not unlock their doors.',
      'Lighter dread, same grain. I lean in the emulsion the way a guest leans in a borrowed seat — polite, wrong, temporary. Learn the Capture on me. The thicker ones do not wait this long.',
    ],
  },
  boss: {
    name: 'The Threshold Warden',
    epithet: 'all four hungers · one frame',
    trapped: [
      'You collected us like specimens and called it a gallery. We noticed. We braided dirt, vow, porcelain, and lake into something that could stand your light without flinching. Now we are the light’s problem.',
      'Four thresholds. Four refusals. You walked them all and thought the hunt was finished. I am what gathers when the dead agree on a single grievance. Being trapped here is almost a kindness — almost. The frame is small. We are not.',
      'Listen: the heartbeat you calmed was never yours alone. We borrowed it. We stretched it. We learned its tempo so we could break it later. Seal us in paper if it comforts you. Paper yellows. We do not.',
    ],
  },
  secret: {
    name: 'The Pale Archivist',
    epithet: 'vault-breath · catalogued wrong',
    trapped: [
      'You followed the letters into the dark under the stone. I was filing names that never belonged to the living. Your light is a stamp I did not authorize — now I am indexed under emulsion, and the vault misses my handwriting.',
      'Crypt air tastes like old paper. I counted bones the way a librarian counts returns. You interrupted the ledger. Being trapped in a photograph is only another kind of shelf. Do not open me near morning.',
      'The cipher on your polaroids was mine once — C, R, Y, P, T — a path for hunters who return what they borrow. You kept enough manners to find me. I almost regret teaching you. Almost.',
    ],
  },
  demon: {
    name: 'The Empty Seat',
    epithet: 'playground · wrong proportions · swing-chain hymn',
    trapped: [
      'You brought the photographs home to where children should be. The swings still move when nothing sits. I am the empty seat that learned your face from four little graves of light. Now I fit inside one more. The chains remember your pulse better than you do.',
      'Night playgrounds are honest: no laughter, only metal and the shape of someone too tall for the slide. You laid the polaroids out like a ritual and called it bravery. I burned into the seal the way frost burns. There is no recess from this. There is only the click of a seat that should not swing.',
      'I was never a child. I wore the scale of one so you would hesitate. The merry-go-round still turns in the emulsion — empty horses, wrong speed. You sealed me. Good. Keep the photo face-down. If you hear chains in a quiet room, do not check which seat is empty. You already know.',
    ],
  },
}

export function pickLore(kind: SpiritKind, priorCapturesOfKind: number): SpiritLore & { variant: number } {
  const bank = BANKS[kind]
  const variant = priorCapturesOfKind % bank.trapped.length
  return {
    name: bank.name,
    epithet: bank.epithet,
    trappedNote: bank.trapped[variant],
    variant,
  }
}

export function spiritDisplayName(kind: SpiritKind): string {
  return BANKS[kind].name
}
