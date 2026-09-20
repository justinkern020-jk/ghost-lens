# Ghost Lens

Mobile-first horror lens: point your phone’s **rear camera** at a real **tombstone**, **ring**, **doll**, or **lake**. After a short sustained detection, an uncanny entity manifests. Keep it framed and tap **Capture** before it grows unstable and flees.

## World anchoring

| Mode | Behavior |
|------|----------|
| **WebXR immersive-ar** (preferred) | Chrome on Android + **ARCore**. Hit-test places the entity on a real surface; **XRAnchor** (when available) keeps it fixed in the room as you move. |
| **Overlay fallback** | Live camera + screen-space CSS/WebGL-style entity. **Not** world-anchored — the figure sticks to the display. Boot screen and HUD state this clearly. |

Anchoring path shipped: **WebXR hit-test + anchors**. There is no fake SLAM in the fallback.

## Entities (dread, not cute)

- **tombstone** — grave-dirt figure, wrong jaw, too-long limbs  
- **ring** — wedding-echo hand, jewelry glint as bait  
- **doll** — porcelain, vacant stare, jointed wrong  
- **lake** — drowned/pale, weeds for hair, emerges from a water plane  

Aggression ramps if you hesitate after manifestation. Subtle dread audio (drone / wet clicks / distant murmur) starts after you open the lens.

## Vision

On-device **CLIP zero-shot** via `@xenova/transformers` (`Xenova/clip-vit-base-patch32`), labels: tombstone, ring, doll, lake, plus negatives. Inference ~every 700ms on a downscaled frame. Sustained detection ~1.2s before spawn; ~1.8s without a hit and it flees.

**Limits (honest):** lighting, angle, and lookalikes cause false positives/negatives. A gold band ≠ “ring” every time; a puddle ≠ “lake”. First model download is large — wait on Wi‑Fi.

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
2. Open in **Chrome**. Allow camera (and enter AR when prompted).  
3. Tap **Open the lens** — audio may unlock on this gesture.  
4. If WebXR is available, tap **Enter AR**, then slowly scan a surface near your target object.  
5. Hold **tombstone / ring / doll / lake** in frame until confidence sustains and the entity appears.  
6. Tap **Capture** before aggression peaks / it flees.  
7. Browse **Gallery**.

```bash
npm run build
npm run preview -- --host
```

## Privacy

Camera frames are classified **on device** in the browser. Captures stay in memory until you reload.

## Not Spookbox

Separate project aesthetic and codebase. Do not confuse with Spookbox.
