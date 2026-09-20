# Ghost Lens

Mobile-first horror lens: point your phone’s **rear camera** at a real **tombstone**, **ring**, **doll**, or **lake**. After a short sustained detection, an uncanny entity manifests. Keep it framed and tap **Capture** before it **approaches**, drains your calm, and strikes.

Successful captures become **polaroids** with spirit lore and earn **Favor**. Seal all four types to unlock the **Threshold Warden** (mid-boss), then bring the photographs to the **playground** for the endgame **Demon**. Spend Favor at **The Undertaker’s Counter**. **Disembodied voices** and **mysterious strangers** teach when/where to hunt and which tools bite which hungers — the shop never wikis the matchups.

## Dusk gate

The hunt only works at **dusk** (local device time):

| Mode | Window |
|------|--------|
| **Solar** (geolocation granted) | ~45 min before local sunset → ~75 min after |
| **Fallback** (no geo) | Local clock **17:30–21:00** |
| **Force dusk (test)** | Always unlocks camera / Enter AR |

Outside the window, Enter AR and the camera hunt are blocked with: *“The dead don't walk in hard light — return at dusk.”*

**Developer override**

- Query: `?forceDusk=1`
- Boot screen button: **Force dusk (test)**
- In-hunt: long-press the title area (~1s)

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
5. Win: demon polaroid + bleakest lore + Favor. Lose: died of fright.

`forceDusk` still required outside real dusk.

## Hidden collectibles — Lore / Relics

Sustained CLIP on ghost-tied real-world props unlocks **lore scraps** deeper than polaroid trapped-notes (once each, localStorage):

| Ghost | Example props |
|-------|----------------|
| tombstone | wilted flowers, iron fence, angel statue, obituary/paper |
| ring | bouquet, wedding dress, champagne glass, jewelry box |
| doll | toy chest, crib, music box, child's shoe |
| lake | pier/boat, fishing rod, reeds, life vest, wet shoes |

Subtle toast on unlock. Browse **Relics** (separate from Polaroids and Whispers). Dev: `?forceCollectible=1` or `?forceCollectible=wilted_offering`.

## Favor + The Undertaker’s Counter

- Captures earn **Favor** (1 normal / 5 Warden / 8 Demon), persisted in localStorage.
- Open **Undertaker · N Favor** — period shop with an **1800s undertaker** portrait (black coat, mourning wear, coffin-measure energy, cold polite smile). Cryptic catalog copy only; **no matchup wiki**.
- Occult tools (owned + Favor persist):

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
3. **Capture** — wins if timely; boss 3 seals; demon 5 ritual taps.
4. Tuned so hesitation kills; quick Capture still feels fair (~6s normal / ~4s Warden / ~3.2s Demon).

## World anchoring

| Mode | Behavior |
|------|----------|
| **WebXR immersive-ar** | Chrome + ARCore; hit-test + XRAnchor |
| **Overlay fallback** | Live camera + screen-space entity (not world-anchored) |

## Vision

On-device **CLIP** via `@xenova/transformers` (`Xenova/clip-vit-base-patch32`). Labels include the four triggers, playground scene, stranger props, and negatives. Inference ~every 700ms; sustain ~1.2s to spawn; ~1.8s without a hit and it flees.

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
3. **Open the lens** → hold tombstone / ring / doll / lake until each manifests → **Capture** (earn Favor + polaroids).
4. Optional: wait for a **voice** subtitle; check **Whispers** journal for when/where. Frame candle/cross/etc. for **strangers** → learn which tool for which haunt. Buy tools at the **Undertaker**.
5. Seal all four types → Warden may appear (3 seals) as mid-boss; status: *Bring the photographs to the playground.*
6. Go to a night playground (or **I’ve arrived** / `?forcePlayground=1`) with dusk still forced/real.
7. Demon spawns — tap **Ritual 1/5 … Seal**; polaroids burn in the ritual strip. Win for demon lore.

```bash
npm run build
npm run preview -- --host
```

## Privacy

Camera frames classified **on device**. Polaroids, Favor, owned tools, clue/voice flags persist in **localStorage** only. Geolocation (optional) only for solar dusk.

## Not Spookbox

Separate project. Do not confuse with Spookbox.
