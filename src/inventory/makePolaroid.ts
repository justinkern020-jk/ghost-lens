import type { SpiritKind } from '../types'

/**
 * Wrap a camera/AR still in a polaroid-style frame with caption strip.
 */
export function makePolaroidStill(
  sourceDataUrl: string,
  kind: SpiritKind,
  captionName: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const framePad = 28
        const bottomPad = 72
        const maxInnerW = 540
        const scale = Math.min(1, maxInnerW / img.width)
        const innerW = Math.round(img.width * scale)
        const innerH = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = innerW + framePad * 2
        canvas.height = innerH + framePad + bottomPad
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(sourceDataUrl)
          return
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
        ctx.drawImage(img, framePad, framePad, innerW, innerH)

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

        resolve(canvas.toDataURL('image/jpeg', 0.88))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => resolve(sourceDataUrl)
    img.src = sourceDataUrl
  })
}
