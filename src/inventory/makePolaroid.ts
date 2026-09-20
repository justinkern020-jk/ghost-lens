import type { SpiritKind } from '../types'

/**
 * Wrap a camera/AR still in a polaroid-style frame with caption strip.
 * Sealed ghosts use Cabals "polaroid prison" art as the photo content,
 * with a faint live still flash for field authenticity.
 */
export interface PolaroidOptions {
  /** Authentic field seal stamp (flavor only — no Insight). */
  fieldSeal?: boolean
  firstCatch?: boolean
}

/** SpiritKind → filename under /polaroid-ghosts/ */
const PRISON_ART: Record<SpiritKind, string> = {
  tombstone: 'tombstone.png',
  ring: 'ring.png',
  doll: 'doll.png',
  lake: 'lake.png',
  trial: 'trial.png',
  boss: 'warden.png',
  demon: 'demon.png',
  secret: 'archivist.png',
}

/** Live camera still opacity over prison art (flash / "you were there"). */
const LIVE_FLASH_OPACITY = 0.2

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function prisonArtUrl(kind: SpiritKind): string {
  return `/polaroid-ghosts/${PRISON_ART[kind]}`
}

/** Draw image covering the rect (object-fit: cover). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.width / img.height
  const rr = w / h
  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height
  if (ir > rr) {
    sw = img.height * rr
    sx = (img.width - sw) / 2
  } else {
    sh = img.width / rr
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

export function makePolaroidStill(
  sourceDataUrl: string,
  kind: SpiritKind,
  captionName: string,
  options: PolaroidOptions = {},
): Promise<string> {
  return (async () => {
    const [prisonImg, liveImg] = await Promise.all([
      loadImage(prisonArtUrl(kind)),
      loadImage(sourceDataUrl),
    ])

    // Primary photo: Cabals prison art when available; else live camera still.
    const primary = prisonImg ?? liveImg
    if (!primary) {
      return sourceDataUrl
    }

    try {
      const framePad = 28
      const bottomPad = options.fieldSeal || options.firstCatch ? 88 : 72
      const maxInnerW = 540
      const scale = Math.min(1, maxInnerW / primary.width)
      const innerW = Math.round(primary.width * scale)
      const innerH = Math.round(primary.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = innerW + framePad * 2
      canvas.height = innerH + framePad + bottomPad
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return sourceDataUrl
      }

      // Aged paper body
      ctx.fillStyle = '#ebe4d6'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Soft outer shadow edge
      ctx.strokeStyle = 'rgba(40, 30, 20, 0.18)'
      ctx.lineWidth = 2
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

      // Photo well
      ctx.fillStyle = '#0a0c0a'
      ctx.fillRect(framePad - 2, framePad - 2, innerW + 4, innerH + 4)

      if (prisonImg) {
        // Prison art dominates; live still as low-opacity flash burn when present.
        drawCover(ctx, prisonImg, framePad, framePad, innerW, innerH)
        if (liveImg) {
          ctx.globalAlpha = LIVE_FLASH_OPACITY
          drawCover(ctx, liveImg, framePad, framePad, innerW, innerH)
          ctx.globalAlpha = 1
        }
      } else {
        ctx.drawImage(primary, framePad, framePad, innerW, innerH)
      }

      // Subtle vignette over photo
      const grd = ctx.createRadialGradient(
        framePad + innerW / 2,
        framePad + innerH / 2,
        innerH * 0.2,
        framePad + innerW / 2,
        framePad + innerH / 2,
        innerH * 0.75,
      )
      grd.addColorStop(0, 'rgba(0,0,0,0)')
      grd.addColorStop(1, 'rgba(10,8,6,0.35)')
      ctx.fillStyle = grd
      ctx.fillRect(framePad, framePad, innerW, innerH)

      // Film scratch / grain hint
      ctx.globalAlpha = 0.06
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000'
        ctx.fillRect(
          framePad + Math.random() * innerW,
          framePad + Math.random() * innerH,
          1 + Math.random() * 2,
          1,
        )
      }
      ctx.globalAlpha = 1

      // Caption strip
      const capY = framePad + innerH + 22
      ctx.fillStyle = '#2a241c'
      ctx.font = '600 15px "Courier New", monospace'
      ctx.fillText(captionName.toUpperCase(), framePad, capY)

      ctx.fillStyle = '#6a5e4e'
      ctx.font = '11px "Courier New", monospace'
      const kindLabel =
        kind === 'demon'
          ? 'PLAYGROUND'
          : kind === 'boss'
            ? 'THRESHOLD'
            : kind === 'trial'
              ? 'LESSER ECHO'
              : kind.toUpperCase()
      ctx.fillText(kindLabel, framePad, capY + 18)

      // Date stamp look
      const d = new Date()
      const stamp = `${d.getMonth() + 1}.${d.getDate()}.${String(d.getFullYear()).slice(2)}`
      ctx.fillStyle = '#8a7a68'
      ctx.font = '10px "Courier New", monospace'
      const tw = ctx.measureText(stamp).width
      ctx.fillText(stamp, canvas.width - framePad - tw, capY + 18)

      // Field seal / first-catch stamps (trophy flavor — no Insight)
      if (options.fieldSeal) {
        ctx.fillStyle = '#4a3020'
        ctx.font = 'bold 9px "Courier New", monospace'
        ctx.fillText('FIELD SEAL', framePad, capY + 34)
        ctx.strokeStyle = 'rgba(100, 60, 30, 0.55)'
        ctx.strokeRect(framePad - 2, capY + 24, 68, 14)
      }
      if (options.firstCatch) {
        const label = 'FIRST'
        ctx.fillStyle = '#3a4a38'
        ctx.font = 'bold 9px "Courier New", monospace'
        const lx = options.fieldSeal ? framePad + 76 : framePad
        ctx.fillText(label, lx, capY + 34)
      }

      return canvas.toDataURL('image/jpeg', 0.88)
    } catch {
      return sourceDataUrl
    }
  })()
}
