# Ghost Lens

Mobile-first horror lens: point your phone’s **rear camera** at a real **tombstone**, **ring**, **doll**, or **lake**. After a short sustained detection, an uncanny entity manifests. Keep it framed and tap **Capture** before it **approaches**, drains your calm, and strikes.

Successful captures become **polaroids** with spirit lore and earn **Insight**. Seal all four types to unlock the **Threshold Warden** (mid-boss), then bring the photographs to the **playground** for the endgame **Demon**. Spend Insight at **The Undertaker’s Counter**. **Disembodied voices** and **mysterious strangers** teach when/where to hunt and which tools bite which hungers — the shop never wikis the matchups.


## Save / Backup

All progress lives in one versioned **localStorage** blob (`ghost-lens-save-v1`), autosaved on every meaningful change:

- Polaroids, Insight, shop purchases, equipped tools
- Keller charm, Spookbox, NG+ / clear flags, Archivist unlock, true-end flags
- Relics, ambient scans, voice whispers, stranger clues
- First-catch notes, field-seal count, dusk/moon force overrides, trial onboarding

On boot, scattered legacy keys are **migrated** into the blob (including old **Favor** → **Insight**).

Use in-app **Save** to **download JSON** or **import** a backup — clearing browser data need not wipe an outdoor hunt.

## Insight economy

| Source | Insight (base) | Notes |
|--------|----------------|-------|
| Main catch (tombstone/ring/doll/lake) | 3 | Completed capture only |
| Trial catch | 1 | |
| Threshold Warden | 5 | Finishing capture, not mid-phase taps |
| Pale Archivist | 6 | Finishing capture |
| Empty Seat (Demon) | 8 | Finishing capture / keep-polaroid success |
| First catch of a kind | +2 | Once per spirit kind |
| Field authenticity | +1 | Real dusk, no force-flags — catches **and** discovery |
| Ambient scan (first) | 1 | |
| Relic / lore scrap | 2 | |
| Stranger clue | 2 | |
| Whisper voice | 1 | |

**Undertaker prices** (Insight): Salt Line 9 · Iron Nail 12 · Silver Mirror 16 · Hush Charm 20 · Black Crepe 45. Cheapest ≈ 2–3 catches; crepe is late-game.

## Scare design

Stylized Three.js / WebXR dread (not photoreal gore): meaner entity stages (calm → wrong → nightmare), stutter freezes, micro-teleports, fake-out lunges on hesitation, last-20% approach rush, heavy hit FX (RGB split, shake, invert flash), louder dread bed with proximity duck/spike and jump-scare stingers. Capture payoff: shutter flash, calm relief, polaroid stamps (FIELD SEAL / FIRST).

## Leave hunt / black screen

**Leave hunt** does **not** always dump you to the boot hub. Mid-hunt, if the view is stuck black/blank (broken AR canvas, camera not ready, orphan cinematic lock, stuck capture flash), the control reads **Clear view** and recovers: ends AR back to the camera preview, remounts getUserMedia, or clears the overlay — hunt session stays active. A second tap on a healthy hunt HUD (label **Leave hunt**) exits to the hub. Death / dusk-lock **Leave hunt** still exits fully.

## Dusk gate

The hunt only works at **dusk** (local device time):

| Mode | Window |
|------|--------|
| **Solar** (geolocation granted) | ~45 min before local sunset → ~75 min after |
| **Fallback** (no geo) | Local clock **17:30–21:00** |
| **Force dusk (test)** | Always unlocks camera / Enter AR |

Outside the window, Enter AR and the camera hunt are blocked with: *“The dead don't walk in hard light — return at dusk.”*

**Developer override**

- Query: `?debugScan=1` · `?forceDusk=1` · `?forceFullMoon=1` · `?forceTrial=1` · `?forceDemonWin=1` · `?forceEpilogue=1` · `?forceWerewolf=1` · `?forceTrueEnd=1` · `?forceSecretGhost=1` · `?forceNGPlus=1` · `?forceScan=1` · `?forceSpookboxMaker=1` · `?forceSpookbox=1` · `?forceArchivistStun=1`
- Boot screen buttons: **Force dusk (test)** · **Force full moon (test)**
- In-hunt: long-press the title area (~1s) for dusk

## Polaroid inventory + lore

- Each **Capture** freezes a polaroid-framed still into a session inventory persisted in **localStorage** (newest 24 kept).
- Every polaroid unlocks **lore**: who/what the spirit is, plus a first-person note about **being trapped in the photo**.
- Distinct banks for tombstone / ring / doll / lake / Warden / Demon.
- Open **Polaroids** → tap a card to read the lore sheet.

## Mid-boss — Threshold Warden

After sealing **all 4 unique types** (or **Force boss**), the next manifestation becomes the **Warden**:

- Faster approach, heavier calm drain, bigger melee hits
- **Multi-phase Capture** — three taps; each phase knockbacks slightly
- Dusk gate, approach, heartbeat, and fright-death still apply

**Developer override:** `?forceBoss=1` or boot **Force boss (test)**.

## Endgame — The Playground / Demon

After the four polaroids are sealed (Warden may be mid-boss before or alongside):

1. UI beat: **“Bring the photographs to the playground.”**
2. Arrive via CLIP playground labels (*playground, swing set, slide, merry-go-round, sandbox*), the **I’ve arrived at the playground** button, or **`?forcePlayground=1`** / Force playground (test).
3. **The Empty Seat** (Demon) spawns — playground-tainted, wrong child-scale proportions, swing chains, empty seats (dread, not gore).
4. Harder than the Warden: faster approach, heavier drain, stronger hits; **5-tap ritual** that burns the four polaroids into the seal (ritual strip UI).
5. **Final seal requires a full moon** (local calendar day). The demon can still appear and threaten outside the full moon; intermediate ritual taps still burn photographs — only the finishing **Seal** is blocked with: *“It won't take the photograph until the moon is full.”*
6. Win: demon polaroid + bleakest lore + Insight. Lose: died of fright.

`forceDusk` still required outside real dusk. `forceFullMoon` (or **Force full moon (test)**) unlocks the demon finish for daytime / off-cycle testing.

### Full moon gate

| | |
|--|--|
| **When** | Local device **calendar day** within ~0.9 days of astronomical full (synodic approximation). |
| **Calc** | Moon age from known new moon **2000-01-06 18:14 UTC**, synodic month **29.530588853** days; evaluate at **local noon**. Illumination ≈ `(1 − cos(2π · age / synodic)) / 2`. Full when age is within **±0.9 days** of `synodic/2`. |
| **Hunt** | Dusk still gates the camera / AR. Full moon only gates the **Empty Seat final seal** (and thus hell-hands / kept-polaroid true-ending paths). |
| **UI** | Moon phase chip in the HUD (and boot hunt-hours line). Nothing extra persisted beyond the optional force flag. |
| **Override** | `?forceFullMoon=1` · localStorage `ghost-lens-force-full-moon=1` · boot **Force full moon (test)** |

## Hidden collectibles — Lore / Relics

Sustained CLIP on ghost-tied real-world props unlocks **lore scraps** deeper than polaroid trapped-notes (once each, localStorage):

| Ghost | Example props |
|-------|----------------|
| tombstone | wilted flowers, iron fence, angel statue, obituary/paper |
| ring | bouquet, wedding dress, champagne glass, jewelry box |
| doll | toy chest, crib, music box, child's shoe |
| lake | pier/boat, fishing rod, reeds, life vest, wet shoes |

Subtle toast on unlock. Browse **Relics** (separate from Polaroids and Whispers). Dev: `?forceCollectible=1` or `?forceCollectible=wilted_offering`.

## Insight + The Undertaker’s Counter

- Captures earn **Insight** (1 normal / 5 Warden / 8 Demon), persisted in localStorage.
- Open **Undertaker · N Insight** — period shop with an **1800s undertaker** portrait (black coat, mourning wear, coffin-measure energy, cold polite smile). Cryptic catalog copy only; **no matchup wiki**.
- Occult tools (owned + Insight persist):

| Item | Cost | Effective mainly vs |
|------|------|---------------------|
| Salt Line | 3 | lake / drowned |
| Iron Nail | 4 | tombstone / grave dirt |
| Silver Mirror | 5 | doll / porcelain |
| Hush Charm | 6 | ring / wedding echo |
| Black Crepe | 12 | playground demon only |

Wrong item in a fight = weak/useless. Prepare a tool in the shop, then **Use** during a manifestation (one spend per fight).

## Disembodied voices + mysterious strangers

1. **Voices** (audio bed + subtitle): after the first capture (and rarely while hunting), cryptic lines teach **when** and **where** to find strangers — e.g. *“When the bells should ring, seek the candle.”* Persist heard voice IDs. Open **Whispers** journal.
2. **Strangers**: sustain CLIP on props (*church, cross, candle, bible, book, clock, shoes, swing, bouquet, flowers, key, umbrella, mirror*) → vignette whisper with the **item ↔ haunt** clue. Each clue once (persisted flags).
3. Undertaker sells tools cryptically; strangers decipher; voices schedule the hunt.

**Dev:** `?forceVoiceHint=1` · `?forceStranger=1` (or a clue id).

## Tension / combat

1. **Approach** — hesitating advances the entity (WebXR pull + scale; overlay grow + shake).
2. **Heartbeat = health** — BPM rises; calm drains; melee strikes can kill.
3. **Capture** — wins if timely; boss 3 seals; demon 5 ritual taps (final seal needs full moon).
4. Tuned so hesitation kills; quick Capture still feels fair (~6s normal / ~4s Warden / ~3.2s Demon).

## World anchoring

| Mode | Behavior |
|------|----------|
| **WebXR immersive-ar** | Chrome + ARCore; hit-test + XRAnchor |
| **Overlay fallback** | Live camera + screen-space entity (not world-anchored) |

## Vision

On-device **CLIP** via `@xenova/transformers` (`Xenova/clip-vit-base-patch32`). Labels include the four triggers, trial **chair**, playground scene, stranger props, ambient props, and negatives. Inference ~every 700ms; sustain ~1.2s to spawn (~0.4s trial / ~0.5s Empty Seat); ~1.8s without a hit and it flees.

**Chair / Empty Seat note:** Xenova’s image zero-shot always softmaxes over the full candidate list (`multi_label` is ignored), so a ~270-way pass dilutes chair mass. A **narrow chair probe** always runs after the main pass; trial lock and **Empty Seat** ambient both read that probe. Field check: `?debugScan=1&forceDusk=1` → point at a dining/office chair → top HUD shows CLIP top label + chair probe; expect trial lock or Empty Seat within ~1s.


## Trial ghost — The Thin One

First-catch **lesser echo** for onboarding:

| | |
|--|--|
| **Trigger** | CLIP **`chair`** (common, reliable) |
| **Capture** | Camera only — **1-tap Capture**, no shop item, no multi-seal |
| **Tension** | Slower approach (~11s), gentler calm drain, longer window |
| **Progress** | Does **not** count toward the four main seals / playground unlock; awards bonus Insight only |
| **Onboarding** (once) | *“A thin one. The lens alone will hold it.”* |
| **Dev** | `?forceTrial=1` or boot **Force trial (test)** |

## Endgame climax — hell hands + Herr Keller

After the playground Demon is sealed:

1. **Finale cinematic** (AR world-anchored if WebXR; screen-space overlay otherwise): demon polaroid drops → ground fissure opens → hell hands pull the photo under → crack seals → silence. HUD locks for the beat.
2. **Epilogue** — **Herr Keller** (Austrian Van Helsing–type) asks for **his camera back**.
   - **Return the lens** → affirming goodbye, unlocks NG+ item **Keller's Silver Charm** (hunter's lens strap; modest slower ghost approach on later runs). **THE END** → post-game.
   - **Refuse** → portrait leaves; Keller transforms into a stylized uncanny **werewolf**, lunges, and eats you → special death: *Died of fright* / **The hunter takes his due**. No NG+ item.
3. Hell-hands still consume the demon polaroid on a normal clear (unless true-ending conditions below).

**Dev:** `?forceDemonWin=1` · `?forceEpilogue=1` · `?forceWerewolf=1` · combine with `?forceDusk=1&forcePlayground=1&forceFullMoon=1`.

## New Game+ — charm, cipher, secret ghost, Spookbox

Persisted in **localStorage**: NG+ flag, Keller charm, clear count, secret unlock, kept demon polaroid, true-good-ending, Spookbox, charm-traded flag.

| Piece | Detail |
|-------|--------|
| **Keller's Silver Charm** | Earned by **Return**. On NG+ (`?forceNGPlus=1` / `?ngplus=1` or saved flag) you start with it — ghosts approach ~12% slower. Spent when traded for the Spookbox. |
| **Polaroid cipher** | NG+ only: each main seal + trial polaroid gets a stamped letter. Together they spell **CRYPT**. |
| **Secret ghost** | *The Pale Archivist* — NG+ only. Point the lens at a **crypt / mausoleum / ossuary**. **3-seal** fight; the **final seal is blocked** until you activate the **Spookbox** mid-fight, call a protector (ITC minigame), and stun the Archivist. Only way to land the finishing blow. Capturing marks secret unlocked. |
| **Spookbox Maker** | Mysterious Justin-coded character. Separate UI + portrait `public/portraits/spookbox-maker.png`. Appears only at **dusk** while framing a **radio / toolbox / garage / workshop / electronics / workbench**. Offers a **Spookbox** for **Keller's Silver Charm**. Without the charm: cryptic refusal. |
| **Spookbox** | Persisted in localStorage. Equip from the Insight strip; on the Archivist’s last seal, **Activate Spookbox** → Call protector → stun VFX → final Capture allowed. |
| **True good ending** | Requires **clear count ≥ 2** and **secret unlocked**, plus a **full-moon** demon final seal. On that clear, hell-hands are **suppressed** — you **keep the demon polaroid** and can **trade it to Keller** to **cure his lycanthropy**. Peaceful epilogue; no werewolf. |

### Spookbox Maker — time & place

| | |
|--|--|
| **Time** | Same **dusk hunt window** (solar ± sunset, or local **17:30–21:00** fallback). Outside dusk he does not appear (unless forced). |
| **Place** | CLIP on **radio**, **toolbox**, **garage**, **workshop**, **electronics**, **circuit board**, or **workbench** — hold steady ~1.2s. |

**Cipher answer:** `C R Y P T` (tombstone→C, ring→R, doll→Y, lake→P, trial→T).

**Dev:** `?forceNGPlus=1` · `?forceSecretGhost=1` · `?forceTrueEnd=1` · `?forceSpookboxMaker=1` · `?forceSpookbox=1` (grants box) · `?forceArchivistStun=1` (skips protector stun gate).

## Ambient object scans

Many mundane props can be inspected without starting a fight. Hold them in frame for a short sustain → **"THE LENS SEES"** card with a melancholy reading. About a third of entries include a soft clue (strangers, relics, cipher, or shop). Seen ids persist; same object won't spam (session soft-lock + ~90s cooldown).

**Dev:** `?forceScan=1` or `?forceScan=<id>` (e.g. `empty_photo_frame`).

## Cold open — Kern's Bizarre Bazaar

First launch (before the hunt boot UI) drops you in a stylized **black-and-white bazaar** screen — not AR. The proprietor (portrait `public/portraits/bazaar-host.png`) notices you eyeing a camera in the display case and offers a Rod Serling–cadence frame tale: an eccentric uncle in the hunter circles left *an heir* the lens after a quiet death; darker channels; men like **Herr Keller** may want it back later. **You are a shop guest holding the phone** — the heir is fiction inside the telling. **Listen** plays that setup; **Not now** skips with a shorter Serling aside that the visitor ≠ the heir and the camera stays a story about someone else. Completing either path sets `introSeen` on the save blob.

- **Replay intro** — Save / Backup panel
- **Dev:** `?forceIntro=1`

Existing saves from before this feature are grandfathered (`introSeen: true`) so mid-hunt players are not interrupted.

## Portrait slots (UI panels)

Undertaker shop, mysterious strangers, Herr Keller, and the bazaar cold-open are **separate UI screens** — not photoreal AR people. Drop AI art into `public/portraits/`:

| File | Panel |
|------|--------|
| `undertaker.png` | Shop |
| `stranger-{clueId}.png` | Stranger vignettes |
| `herr-keller.png` | Epilogue |
| `spookbox-maker.png` | Spookbox Maker meet |

Missing files show a labeled silhouette placeholder with the expected path. Ghosts / demon / hell-hands stay in the AR/camera layer.

## Stack

Vite + React + TypeScript + Three.js (WebXR) + Xenova Transformers.

## Run (Pixel Chrome)

```bash
npm install
npm run dev -- --host
```

On a phone, open the printed HTTPS/localhost URL. For LAN testing, serve over **HTTPS**:

```bash
npx vite --host --https
```

### Play steps (Pixel) — reach the playground demon

1. Install **Google Play Services for AR (ARCore)**. Open in **Chrome**. Allow camera (and location for solar dusk).
2. Daytime build: `?forceDusk=1` or **Force dusk (test)**.
3. **Open the lens** → hold tombstone / ring / doll / lake until each manifests → **Capture** (earn Insight + polaroids).
4. Optional: wait for a **voice** subtitle; check **Whispers** journal for when/where. Frame candle/cross/etc. for **strangers** → learn which tool for which haunt. Buy tools at the **Undertaker**.
5. Seal all four types → Warden may appear (3 seals) as mid-boss; status: *Bring the photographs to the playground.*
6. Go to a night playground (or **I’ve arrived** / `?forcePlayground=1`) with dusk still forced/real.
7. Demon spawns — tap **Ritual 1/5 …**. The final **Seal** needs a **full moon** (or `?forceFullMoon=1` / **Force full moon (test)**). Polaroids burn in the ritual strip. Win for demon lore.

```bash
npm run build
npm run preview -- --host
```

## Privacy

Camera frames classified **on device**. Polaroids, Insight, owned tools, clue/voice flags, NG+ progress, Spookbox / charm trade flags, and ambient scan history persist in **localStorage** only. Geolocation (optional) only for solar dusk.

## Spookbox (in-game) vs Spookbox (project)

The **Spookbox** here is an in-game ITC item from the Maker meet — not the separate Spookbox app/project. Same name on purpose; different scope.
