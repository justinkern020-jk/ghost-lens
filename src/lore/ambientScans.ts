import { getSave, patchSave } from '../save/gameSave'
/**
 * Ambient object scans — melancholy diegetic readings when props are held in frame.
 * Separate from combat spawns; scanning does not summon a ghost.
 * ~35% of entries carry a soft clue toward strangers, relics, cipher, or shop matchups.
 */

export type AmbientClueKind = 'stranger' | 'relic' | 'cipher' | 'shop' | 'general'

export interface AmbientScanEntry {
  id: string
  /** Basename under /ambient-cards/{imageKey}.png (kebab-case of id). */
  imageKey: string
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
    imageKey: 'empty-photo-frame',
    labels: ['picture frame', 'empty frame', 'photo frame'],
    title: 'Empty Frame',
    reading:
      'Glass sealed over a vacancy measured to a face. The nail still holds; the likeness never arrived. Dust has learned the outline of what was promised and rehearses it nightly, patient as mourning cloth.',
  },
  {
    id: 'worn_gloves',
    imageKey: 'worn-gloves',
    labels: ['gloves', 'leather gloves', 'work gloves'],
    title: 'Worn Gloves',
    reading:
      'Hollows pressed by living fingers, then abandoned mid-grasp. The leather keeps the shape of labor and the colder habit of release — a second skin that outlived the hands it served.',
    clue: {
      kind: 'shop',
      text: 'Iron answers dirt differently than cloth. Those who trade in quiet metals know which ores the ground still remembers.',
    },
  },
  {
    id: 'cracked_teacup',
    imageKey: 'cracked-teacup',
    labels: ['teacup', 'tea cup', 'cup'],
    title: 'Cracked Teacup',
    reading:
      'A hairline fracture maps the last warmth that never reached the lip. Porcelain keeps polite company with grief; the rim remembers a name spoken into steam that has long since gone thin.',
  },
  {
    id: 'pocket_watch',
    imageKey: 'pocket-watch',
    labels: ['pocket watch', 'watch', 'stopwatch'],
    title: 'Stopped Watch',
    reading:
      'Hands arrested at an hour no ledger claims. Time did not cease — some keeper simply refused the winding, and the mechanism learned stillness as a kind of prayer.',
    clue: {
      kind: 'stranger',
      text: 'Clocks that will not move still listen. Near dusk, frame one steadily; those who walk the edges sometimes answer.',
    },
  },
  {
    id: 'wilted_bouquet',
    imageKey: 'wilted-bouquet',
    labels: ['wilted bouquet', 'dead flowers', 'dried flowers'],
    title: 'Wilted Bouquet',
    reading:
      'Stems gone brown in water that forgot its duty. Petals hold the posture of offering long after color flees. Devotion, measured in days until even the stems surrender.',
  },
  {
    id: 'child_drawing',
    imageKey: 'child-drawing',
    labels: ['drawing', 'crayon drawing', 'child drawing'],
    title: 'Child’s Drawing',
    reading:
      'A house with too many windows. A smile the crayon could not finish. Hung where the light is gentlest, as if kindness of placement might teach the paper how to forgive.',
    clue: {
      kind: 'relic',
      text: 'Nursery quiet opens wrong doors. A crib, a music box, a shoe beneath a chest — the journal keeps what the lens endures.',
    },
  },
  {
    id: 'rusty_key',
    imageKey: 'rusty-key',
    labels: ['key', 'old key', 'skeleton key'],
    title: 'Rusty Key',
    reading:
      'It still fits a lock that may no longer stand. Rust is what a promise becomes when no hand turns it. Cold iron, patient, waiting for a door that has forgotten its name.',
  },
  {
    id: 'fogged_mirror',
    imageKey: 'fogged-mirror',
    labels: ['hand mirror', 'compact mirror', 'vanity mirror', 'mirror'],
    title: 'Fogged Mirror',
    reading:
      'Breath that was not yours clouded this glass once. Wipe it clean and the room looks back a half-second late — as if something practiced your face before returning it.',
  },
  {
    id: 'lonely_shoe',
    imageKey: 'lonely-shoe',
    labels: ['shoe', 'boot', 'sneaker', 'shoes'],
    title: 'Single Shoe',
    reading:
      'Its twin lies elsewhere, or nowhere. The sole is worn on the inward edge, as though the wearer forever turned toward home and never quite completed the turn.',
  },
  {
    id: 'unopened_letter',
    imageKey: 'unopened-letter',
    labels: ['envelope', 'letter', 'mail'],
    title: 'Unopened Letter',
    reading:
      'The seal remains unbroken. The name upon the face has been traced too often by a thumb that could not bear the tear. Ink waits. Mercy, it seems, was never posted.',
    clue: {
      kind: 'cipher',
      text: 'Margins remember what emulsion forgets. On a second hunt, letters sometimes burn themselves into the grain.',
    },
  },
  {
    id: 'rain_umbrella',
    imageKey: 'rain-umbrella',
    labels: ['umbrella', 'closed umbrella'],
    title: 'Furled Umbrella',
    reading:
      'Damp still nests in the fold that never dried. It kept vigil by a door for weather that came alone — rain without the hand that meant to open it.',
  },
  {
    id: 'church_hymnal',
    imageKey: 'church-hymnal',
    labels: ['hymnal', 'prayer book', 'songbook'],
    title: 'Hymnal',
    reading:
      'Pages thumbed open to a hymn of mercy. The bookmark is a Sunday ticket from a pew that emptied before the Amen. The binding smells of polish and unfinished prayer.',
    clue: {
      kind: 'stranger',
      text: 'Crosses and candlelight draw silhouettes that speak. Hold the frame when the lens finds them; they seldom linger.',
    },
  },
  {
    id: 'broken_swing_chain',
    imageKey: 'broken-swing-chain',
    labels: ['chain', 'metal chain'],
    title: 'Broken Chain',
    reading:
      'One link yawned open like a mouth. It once bore weight that laughed. Now it holds only the idea of swinging — and the soft clang of a seat that should be empty.',
  },
  {
    id: 'salt_shaker',
    imageKey: 'salt-shaker',
    labels: ['salt shaker', 'salt cellar'],
    title: 'Salt Shaker',
    reading:
      'Grains cling to the glass as if the table were a brink. Ordinary seasoning — or a measured border poured against wet thresholds, long after the meal was cleared.',
    clue: {
      kind: 'shop',
      text: 'A careful pour for hungers that come damp. Insight purchases what the quiet merchant will not name.',
    },
  },
  {
    id: 'baby_rattle',
    imageKey: 'baby-rattle',
    labels: ['rattle', 'baby rattle'],
    title: 'Silent Rattle',
    reading:
      'Beads that ought to chatter, wrapped in cloth so the house might sleep. The hush outlasted the child. Silence, once invited, keeps the better rooms.',
  },
  {
    id: 'train_ticket',
    imageKey: 'train-ticket',
    labels: ['ticket', 'train ticket', 'bus ticket'],
    title: 'Expired Ticket',
    reading:
      'Destination punched. Date gone pale. The fare was paid in full; the arrival was never collected. Somewhere a platform still waits with the wrong patience.',
  },
  {
    id: 'spectacles',
    imageKey: 'spectacles',
    labels: ['glasses', 'eyeglasses', 'spectacles'],
    title: 'Folded Spectacles',
    reading:
      'Lenses clouded with the oil of a brow that no longer presses here. Through them the world was always a measure kinder than it earned. They fold as if still listening.',
  },
  {
    id: 'candle_stub',
    imageKey: 'candle-stub',
    labels: ['candle', 'candle stub', 'wax candle'],
    title: 'Candle Stub',
    reading:
      'Wax pooled like a breath held too long. The wick is black to the root. It burned for a vigil that outlived the mourner — and the dark that followed learned their name.',
  },
  {
    id: 'wedding_ring',
    imageKey: 'wedding-ring',
    labels: ['wedding ring', 'ring', 'gold ring', 'engagement ring'],
    title: 'Wedding Band',
    reading:
      'A circle without clasp or mercy. Warmth lingers in the metal as if a knuckle still argued with forever. Engraving worn smooth — a vow that stayed after both signers left.',
    clue: {
      kind: 'relic',
      text: 'Velvet hollows and white cloth remember the aisle. What the lens finds of vows, the journal will not refuse.',
    },
  },
  {
    id: 'playground_swing',
    imageKey: 'playground-swing',
    labels: ['swing', 'swing set', 'playground swing'],
    title: 'Empty Swing',
    reading:
      'Chains answer a wind that has no child in it. The seat remembers weight in the wrong proportion — too tall, too still. Night playgrounds are honest; they keep no laughter.',
  },
  {
    id: 'porcelain_doll',
    imageKey: 'porcelain-doll',
    labels: ['doll', 'porcelain doll', 'toy doll'],
    title: 'Porcelain Doll',
    reading:
      'Painted smile that does not close its eyes. Ball joints keep a ledger of every hand that set them. It practiced stillness until stillness became a way of watching.',
    clue: {
      kind: 'relic',
      text: 'Toy chests and music boxes finish flat. Nursery things teach the journal a quieter hunger.',
    },
  },
  {
    id: 'weathered_tombstone',
    imageKey: 'weathered-tombstone',
    labels: ['tombstone', 'gravestone', 'headstone', 'grave'],
    title: 'Weathered Stone',
    reading:
      'A name half-eaten by rain. Dates that no longer persuade. The earth before it settled uneven — as if something below refused the final courtesy of lying still.',
    clue: {
      kind: 'stranger',
      text: 'Iron fences and dying petals keep schedules. At closing, silhouettes sometimes lean where the stone is softest.',
    },
  },
  {
    id: 'still_water',
    imageKey: 'still-water',
    labels: ['water', 'lake', 'pond', 'puddle'],
    title: 'Still Water',
    reading:
      'Surface like held breath. No ripple claims a cause. Depth is a rumor here — and rumors drown more carefully than stones.',
  },
  {
    id: 'family_bible',
    imageKey: 'family-bible',
    labels: ['bible', 'holy bible', 'book of scripture'],
    title: 'Family Bible',
    reading:
      'Names written in the flyleaf in a hand that grew smaller with each generation. The last entry has no date of death — only a blank ruled line, waiting with clerical patience.',
  },
  {
    id: 'wall_clock',
    imageKey: 'wall-clock',
    labels: ['clock', 'wall clock', 'alarm clock'],
    title: 'Wall Clock',
    reading:
      'The face stares without blinking. A second hand that once counted meals now counts nothing. Behind the glass, dust settles on hours nobody will claim again.',
  },
  {
    id: 'wooden_cross',
    imageKey: 'wooden-cross',
    labels: ['cross', 'wooden cross', 'crucifix'],
    title: 'Wooden Cross',
    reading:
      'Grain darkened where thumbs rested in habit. It hung above a bed or a door — places meant to keep the night outside. The night learned the wood’s softness first.',
  },
  {
    id: 'stone_church',
    imageKey: 'stone-church',
    labels: ['church', 'chapel', 'cathedral'],
    title: 'Stone Church',
    reading:
      'Doors open toward a nave that remembers kneeling. Candle smoke has stained the vault the color of old prayer. Echoes linger longer than congregants; some never leave the pew.',
  },
  {
    id: 'empty_crib',
    imageKey: 'empty-crib',
    labels: ['crib', 'baby crib', 'cradle'],
    title: 'Empty Crib',
    reading:
      'Rails worn smooth by small hands that no longer reach. It creaks when nothing rocks it. The mattress keeps a shallow dent — a shape the house has agreed not to mention.',
  },
  {
    id: 'music_box',
    imageKey: 'music-box',
    labels: ['music box', 'jewellery music box'],
    title: 'Music Box',
    reading:
      'Wind the key and look away. The tune finishes a half-step flat, as if mourning a dancer who never returned to the lid. Mechanisms remember faces better than melodies.',
    clue: {
      kind: 'cipher',
      text: 'Windings leave marks in the quiet. On returning hunts, small letters sometimes surface in the emulsion like notes from a broken song.',
    },
  },
  {
    id: 'faded_photograph',
    imageKey: 'faded-photograph',
    labels: ['photograph', 'photo', 'old photo', 'polaroid'],
    title: 'Faded Photograph',
    reading:
      'Faces blanched to suggestion. Someone’s thumbprint oils the corner where they tried to hold the past still. Emulsion yellows; the almost-eyes do not.',
    clue: {
      kind: 'cipher',
      text: 'Second viewings teach the grain new manners. What was blank may yet take letter — if the hunter returns with patience.',
    },
  },
  {
    id: 'packed_suitcase',
    imageKey: 'packed-suitcase',
    labels: ['suitcase', 'luggage', 'travel bag'],
    title: 'Packed Suitcase',
    reading:
      'Latches closed on a journey that never found its platform. Clothes folded for a climate that did not keep the appointment. The handle still expects a hand.',
  },
  {
    id: 'forgotten_bicycle',
    imageKey: 'forgotten-bicycle',
    labels: ['bicycle', 'bike', 'bicycle wheel'],
    title: 'Forgotten Bicycle',
    reading:
      'Chain rusted into a single intention. The seat still leans toward a road that kept no promise of return. Pedals wait in the posture of departure, patient as unfinished errands.',
  },
  {
    id: 'deflated_ball',
    imageKey: 'deflated-ball',
    labels: ['ball', 'soccer ball', 'basketball', 'beach ball'],
    title: 'Deflated Ball',
    reading:
      'Rubber soft where laughter once held shape. It remembers arcs that ended in grass, and the quieter arc of being left behind when the game forgot its name.',
  },
  {
    id: 'frayed_backpack',
    imageKey: 'frayed-backpack',
    labels: ['backpack', 'rucksack', 'school bag'],
    title: 'Frayed Backpack',
    reading:
      'Straps thinned by shoulders that outgrew them. A zipper tooth missing like a word bitten off. Inside: lint, a receipt, and the faint smell of someone learning to leave lightly.',
    clue: {
      kind: 'general',
      text: 'What is carried long enough begins to carry back. Frame the ordinary burden; the lens keeps ledgers of weight.',
    },
  },
  {
    id: 'bruised_banana',
    imageKey: 'bruised-banana',
    labels: ['banana', 'bunch of bananas'],
    title: 'Bruised Banana',
    reading:
      'Yellow gone mottled with a kindness of decay. Bought for a morning that did not come. Sweetness pools where none will taste it — fruit practicing the art of being almost useful.',
  },
  {
    id: 'park_bench',
    imageKey: 'park-bench',
    labels: ['bench', 'park bench', 'wooden bench'],
    title: 'Park Bench',
    reading:
      'Slats polished by strangers who shared no names. One end dips where habit sat longest. Birds claim it now; the wood still holds the shape of waiting for someone who was late forever.',
    clue: {
      kind: 'stranger',
      text: 'Benches at the edge of parks keep softer appointments. Sit the frame still near dusk; silhouettes prefer places meant for resting.',
    },
  },
  {
    id: 'birdhouse',
    imageKey: 'birdhouse',
    labels: ['birdhouse', 'bird house', 'nesting box'],
    title: 'Birdhouse',
    reading:
      'A doorway cut for wings that nested once and did not renew the lease. Paint peels in scales of welcome. The perch remembers weight measured in feathers, then measured in absence.',
  },
  {
    id: 'folded_blanket',
    imageKey: 'folded-blanket',
    labels: ['blanket', 'throw blanket', 'quilt'],
    title: 'Folded Blanket',
    reading:
      'Corners squared with care that outlasted the sleeper. Wool keeps a shallow warmth no body claims. It was meant to cover; it covers only the outline of needing to be covered.',
  },
  {
    id: 'dog_eared_book',
    imageKey: 'dog-eared-book',
    labels: ['book', 'hardcover book', 'paperback book', 'novel'],
    title: 'Dog-Eared Book',
    reading:
      'A page turned down at a sentence no one finished aloud. Spine cracked at the chapter where courage thinned. Margins hold pencil ghosts of a reader who meant to return.',
    clue: {
      kind: 'cipher',
      text: 'Margins and dog-ears conspire. On a second reading through the lens, letters sometimes rise where the page was most handled.',
    },
  },
  {
    id: 'empty_bottle',
    imageKey: 'empty-bottle',
    labels: ['bottle', 'glass bottle', 'water bottle', 'wine bottle'],
    title: 'Empty Bottle',
    reading:
      'Glass that once held a toast or a thirst. The label has surrendered half its name to damp. It rings hollow when struck — a small bell for thirsts that learned to go unanswered.',
  },
  {
    id: 'loose_brick',
    imageKey: 'loose-brick',
    labels: ['brick', 'red brick', 'clay brick'],
    title: 'Loose Brick',
    reading:
      'Mortar forgot its duty and left this one free. It remembers being wall, then threshold, then weapon of last resort. Weight without purpose is still a kind of architecture.',
  },
  {
    id: 'worn_broom',
    imageKey: 'worn-broom',
    labels: ['broom', 'push broom', 'straw broom'],
    title: 'Worn Broom',
    reading:
      'Bristles bent toward floors that never stayed clean. It swept the same corner until the corner learned to hide dust in grief instead. Labor continues; the house does not thank it.',
  },
  {
    id: 'galvanized_bucket',
    imageKey: 'galvanized-bucket',
    labels: ['bucket', 'pail', 'metal bucket'],
    title: 'Galvanized Bucket',
    reading:
      'Dent in the rim where it struck a step in haste. Water rings stain the metal like years. It carried wash, then rain, then nothing — emptiness being the lightest load it ever bore.',
  },
  {
    id: 'brass_doorknob',
    imageKey: 'brass-doorknob',
    labels: ['doorknob', 'door knob', 'door handle'],
    title: 'Brass Doorknob',
    reading:
      'Polish worn to the shape of a habitual turn. It opened toward rooms that emptied and never quite closed behind the last departure. Brass remembers every palm that hesitated.',
    clue: {
      kind: 'relic',
      text: 'Thresholds keep what rooms discard. A knob, a keyhole, a scuff at ankle height — the journal listens at doors.',
    },
  },
  {
    id: 'dripping_faucet',
    imageKey: 'dripping-faucet',
    labels: ['faucet', 'tap', 'water faucet', 'sink faucet'],
    title: 'Dripping Faucet',
    reading:
      'A metronome of waste no one bothers to silence. Each drop counts a minute someone meant to fix. The basin keeps a rust map of patience outlasting resolve.',
  },
  {
    id: 'weathered_fence',
    imageKey: 'weathered-fence',
    labels: ['fence', 'wooden fence', 'picket fence', 'chain link fence'],
    title: 'Weathered Fence',
    reading:
      'Posts lean like old arguments. It marked a property line that grief ignored. Between the slats, wind passes freely — borders being the first things the dead refuse.',
  },
  {
    id: 'fire_hydrant',
    imageKey: 'fire-hydrant',
    labels: ['fire hydrant', 'hydrant'],
    title: 'Fire Hydrant',
    reading:
      'Paint chipped by dogs and decades. Caps sealed against a blaze that has not yet chosen this street. It waits in scarlet certainty for a day it hopes never arrives — and practices readiness anyway.',
    clue: {
      kind: 'general',
      text: 'Scarlet sentinels mark corners the living hurry past. Stand the frame where water waits unused; the street keeps older schedules.',
    },
  },
  {
    id: 'dead_flashlight',
    imageKey: 'dead-flashlight',
    labels: ['flashlight', 'torch', 'electric torch'],
    title: 'Dead Flashlight',
    reading:
      'Batteries soft with the acid of deferred replacement. The switch still clicks with hope. Beam that once cut cellar dark now holds only the memory of cutting — and the dark has grown used to winning.',
    clue: {
      kind: 'shop',
      text: 'Light that fails still teaches hunger for better oil. The quiet merchant keeps what burns longer than resolve.',
    },
  },
  {
    id: 'bent_fork',
    imageKey: 'bent-fork',
    labels: ['fork', 'dinner fork', 'metal fork'],
    title: 'Bent Fork',
    reading:
      'Tines skewed by a temper or a drawer slam. It still reaches for food that will not be shared. Silverware outlives the table; manners do not.',
  },
  {
    id: 'humming_fridge',
    imageKey: 'humming-fridge',
    labels: ['fridge', 'refrigerator', 'fridge door'],
    title: 'Humming Fridge',
    reading:
      'A low drone that outlasted the household schedule. Magnets hold a calendar no one flips. Cold preserves meals planned for mouths that learned other hungers.',
  },
  {
    id: 'untuned_guitar',
    imageKey: 'untuned-guitar',
    labels: ['guitar', 'acoustic guitar', 'electric guitar'],
    title: 'Untuned Guitar',
    reading:
      'Strings slack as unfinished apologies. The neck remembers a hand that practiced until callus, then stopped mid-chord. Dust frets the frets; silence keeps better time than song.',
    clue: {
      kind: 'cipher',
      text: 'Instruments leave scores in quiet air. Return with the lens; sometimes the grain hums letters where a note went flat.',
    },
  },
  {
    id: 'claw_hammer',
    imageKey: 'claw-hammer',
    labels: ['hammer', 'claw hammer'],
    title: 'Claw Hammer',
    reading:
      'Head darkened by nails driven and the rarer mercy of nails drawn. The handle is smooth where anger and repair took the same grip. It built rooms; it can unbuild them with equal honesty.',
  },
  {
    id: 'crushed_hat',
    imageKey: 'crushed-hat',
    labels: ['hat', 'cap', 'baseball cap', 'beanie'],
    title: 'Crushed Hat',
    reading:
      'Brim warped by rain and a pocket that was not meant for keeping. It shaded a brow that faced too much weather. Soft crown, still expecting a head that chose bare sky instead.',
  },
  {
    id: 'tangled_headphones',
    imageKey: 'tangled-headphones',
    labels: ['headphones', 'earbuds', 'earphones'],
    title: 'Tangled Headphones',
    reading:
      'Cord knotted into a private alphabet of neglect. Foam worn thin by ears that needed other rooms. Music waited in the wire; the listener learned quieter frequencies.',
  },
  {
    id: 'closed_laptop',
    imageKey: 'closed-laptop',
    labels: ['laptop', 'laptop computer', 'notebook computer'],
    title: 'Closed Laptop',
    reading:
      'Lid shut on a cursor that blinked for no reply. Keys glossed by a deadline that outlived its author. The machine sleeps with unfinished sentences still warm in memory.',
    clue: {
      kind: 'general',
      text: 'Screens remember what was typed and never sent. Frame the dark glass; some absences leave a softer glow.',
    },
  },
  {
    id: 'bedside_lamp',
    imageKey: 'bedside-lamp',
    labels: ['lamp', 'table lamp', 'desk lamp', 'bedside lamp'],
    title: 'Bedside Lamp',
    reading:
      'Shade yellowed by nights spent reading toward sleep that would not come. The switch still finds the same half-brightness. Light meant for comfort now marks the outline of an empty pillow.',
  },
  {
    id: 'rusted_mailbox',
    imageKey: 'rusted-mailbox',
    labels: ['mailbox', 'mail box', 'letterbox', 'post box'],
    title: 'Rusted Mailbox',
    reading:
      'Flag raised for a post that stopped arriving. Inside: damp circulars and the ghost of a letter that mattered. The hinge complains like a throat cleared for news that will not come.',
    clue: {
      kind: 'stranger',
      text: 'Boxes that wait for words sometimes receive other visitors. Hold the frame at the hour deliveries used to matter.',
    },
  },
  {
    id: 'stained_mug',
    imageKey: 'stained-mug',
    labels: ['mug', 'coffee mug', 'tea mug'],
    title: 'Stained Mug',
    reading:
      'Ring of brown like a tide that never fully retreated. Handle warm only in memory. It held the first sip of mornings that grew fewer until the kettle forgot the ritual entirely.',
  },
  {
    id: 'yellowed_newspaper',
    imageKey: 'yellowed-newspaper',
    labels: ['newspaper', 'folded newspaper', 'newsprint'],
    title: 'Yellowed Newspaper',
    reading:
      'Headlines for a day that believed itself urgent. Ink thinned; the catastrophe stayed. Folded for recycling that never claimed it — history practicing how to become wrapping paper.',
  },
  {
    id: 'paint_can',
    imageKey: 'paint-can',
    labels: ['paint can', 'paint tin', 'can of paint'],
    title: 'Paint Can',
    reading:
      'Lid sealed on a color chosen for a wall that changed owners. Skin on the surface like a scab of intention. Brushes nearby stiffen into monuments of almost renovating.',
  },
  {
    id: 'traffic_cone',
    imageKey: 'traffic-cone',
    labels: ['traffic cone', 'orange cone', 'safety cone'],
    title: 'Traffic Cone',
    reading:
      'Orange warning for a hazard that has since been paved over or forgotten. It guards nothing now but the idea of caution. Plastic fades; the habit of saying stay back remains.',
  },
  {
    id: 'overturned_trash_can',
    imageKey: 'overturned-trash-can',
    labels: ['trash can', 'garbage can', 'rubbish bin', 'waste bin'],
    title: 'Overturned Bin',
    reading:
      'Lid ajar like a confession interrupted. Wind sorted what hands discarded. Among the refuse, a scrap with a name — trash being where some farewells are finally honest.',
    clue: {
      kind: 'shop',
      text: 'What is thrown still has buyers of a quieter sort. Insight spends differently among those who traffic in discards.',
    },
  },
  {
    id: 'tree_stump',
    imageKey: 'tree-stump',
    labels: ['tree stump', 'stump', 'cut stump'],
    title: 'Tree Stump',
    reading:
      'Rings counted a life no one asked to end. Sawdust long since washed into soil. Moss claims the wound with soft ceremony — greenery practicing consolation for what cannot regrow.',
    clue: {
      kind: 'relic',
      text: 'Cut wood remembers height. Near stumps and fallen limbs, the journal sometimes finds what growth left behind.',
    },
  },
  {
    id: 'cracked_vase',
    imageKey: 'cracked-vase',
    labels: ['vase', 'flower vase', 'ceramic vase'],
    title: 'Cracked Vase',
    reading:
      'A seam of glue where someone tried to keep beauty whole. Water still finds the fracture and weeps slowly onto wood. It held stems; it holds the argument that some breaks are kept on purpose.',
  },

  {
    id: 'empty_seat',
    imageKey: 'empty-seat',
    labels: [
      'chair',
      'empty chair',
      'armchair',
      'dining chair',
      'office chair',
      'wooden chair',
      'rocking chair',
      'stool',
      'seat',
      'recliner',
      'desk chair',
      'folding chair',
      'kitchen chair',
      'windsor chair',
      'wingback chair',
      'side chair',
      'lounge chair',
      'plastic chair',
      'bar stool',
      'lawn chair',
    ],
    title: 'Empty Seat',
    reading:
      'Four legs and a vacancy measured for a spine that will not return. The seat remembers weight in the wrong proportion — too light, too long, too willing to wait. Dust rehearses the outline of sitting; the house keeps the appointment alone.',
    clue: {
      kind: 'general',
      text: 'A chair held steady can wake a thinner echo. The lens alone may hold what sits where nobody should.',
    },
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
