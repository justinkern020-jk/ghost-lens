# Ghost Lens

Mobile-first horror lens: point your phone’s **rear camera** at a real **tombstone**, **ring**, **doll**, or **lake**. After a short sustained detection, an uncanny entity manifests. Keep it framed and tap **Capture** before it **approaches**, drains your calm, and strikes.

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

## Tension / combat

1. **Approach** — After spawn, if you hesitate, the entity advances (WebXR: pulls toward the camera + scales up; overlay: screen-space grow + shake). Aggression/proximity is the clear threat.
2. **Heartbeat = health** — BPM-style calm meter. Starts calm (~56 BPM). As the ghost closes / time ticks without Capture, BPM rises and calm drains.
3. **Hits** — At melee range the entity strikes (flash, audio spike, calm chunk lost, brief stun). Enough hits → **Died of fright** (black screen, flatline, Retry).
4. **Capture** — Still wins if taken in time; clears the ghost and restores some calm.

Tuned so a hesitant player can die, while a quick Capture still feels fair (~6s to melee; three strikes finish a drained player).

## World anchoring

| Mode | Behavior |
|------|----------|
| **WebXR immersive-ar** (preferred) | Chrome on Android + **ARCore**. Hit-test places the entity on a real surface; **XRAnchor** (when available) keeps it fixed in the room as you move. Approach pulls it toward the viewer. |
| **Overlay fallback** | Live camera + screen-space entity. **Not** world-anchored — the figure sticks to the display and grows toward you. |

Anchoring path shipped: **WebXR hit-test + anchors**. There is no fake SLAM in the fallback.

## Entities (dread, not cute)

- **tombstone** — grave-dirt figure, wrong jaw, too-long limbs  
- **ring** — wedding-echo hand, jewelry glint as bait  
- **doll** — porcelain, vacant stare, jointed wrong  
- **lake** — drowned/pale, weeds for hair, emerges from a water plane  

## Vision

On-device **CLIP zero-shot** via `@xenova/transformers` (`Xenova/clip-vit-base-patch32`), labels: tombstone, ring, doll, lake, plus negatives. Inference ~every 700ms on a downscaled frame. Sustained detection ~1.2s before spawn; ~1.8s without a hit and it flees.

**Limits (honest):** lighting, angle, and lookalikes cause false positives/negatives. First model download is large — wait on Wi‑Fi.

## Stack

Vite + React + TypeScript + Three.js (WebXR) + Xenova Transformers.

## Run (Pixel Chrome)

```bash
npm install
npm run dev -- --host
```

On a phone, open the printed HTTPS/localhost URL. For LAN testing, serve over **HTTPS** (WebXR and sometimes camera require a secure context):

```bash
npx vite --host --https
```

Or deploy the `dist/` build to any static HTTPS host.

### Play steps

1. Install **Google Play Services for AR (ARCore)** on the Pixel.  
2. Open in **Chrome**. Allow camera (and location if prompted — sharper dusk window).  
3. If daytime while building, enable **Force dusk (test)** or open with `?forceDusk=1`.  
4. Tap **Open the lens** — audio may unlock on this gesture.  
5. If WebXR is available, tap **Enter AR**, then slowly scan a surface near your target object.  
6. Hold **tombstone / ring / doll / lake** in frame until confidence sustains and the entity appears.  
7. Tap **Capture** before it reaches melee / your calm flatlines.  
8. Browse **Gallery**. Retry from the death screen if you die of fright.

```bash
npm run build
npm run preview -- --host
```

## Privacy

Camera frames are classified **on device** in the browser. Captures stay in memory until you reload. Geolocation (optional) is used only to estimate local sunset for the dusk gate.

## Not Spookbox

Separate project aesthetic and codebase. Do not confuse with Spookbox.
