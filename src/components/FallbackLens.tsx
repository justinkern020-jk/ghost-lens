import { useEffect, useRef } from 'react'
import type { TargetType } from '../types'

interface Props {
  videoRefAttach: (el: HTMLVideoElement | null) => void
  videoReady: boolean
  ghostVisible: boolean
  ghostTarget: TargetType | null
  fleeing: boolean
  aggression: number
  /** 0–1 approach toward camera (screen-space grow). */
  proximity: number
  hitFlash?: boolean
  stunned?: boolean
  onVideoEl: (el: HTMLVideoElement | null) => void
}

/** Screen-space horror entity — NOT world-anchored. Distinct per trigger. */
export function FallbackLens({
  videoRefAttach,
  videoReady,
  ghostVisible,
  ghostTarget,
  fleeing,
  aggression,
  proximity,
  hitFlash,
  stunned,
  onVideoEl,
}: Props) {
  const videoEl = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    onVideoEl(videoEl.current)
  }, [onVideoEl, videoReady])

  const grow = 1 + proximity * 1.85
  const shakeX = proximity > 0.55 ? (Math.sin(performance.now() / 40) * proximity * 6) : 0
  const shakeY = proximity > 0.55 ? (Math.cos(performance.now() / 33) * proximity * 4) : 0

  const aggStyle = {
    ['--agg' as string]: String(aggression),
    ['--prox' as string]: String(proximity),
    ['--grow' as string]: String(grow),
    ['--shake-x' as string]: `${shakeX}px`,
    ['--shake-y' as string]: `${shakeY}px`,
  }

  return (
    <div
      className={`lens-stage fallback ${proximity > 0.7 ? 'shaking' : ''} ${hitFlash ? 'hit-flash' : ''} ${stunned ? 'stunned' : ''}`}
      style={aggStyle}
    >
      <video
        ref={(el) => {
          videoEl.current = el
          videoRefAttach(el)
        }}
        className="camera-video"
        playsInline
        muted
        autoPlay
      />
      <div className="viewfinder" aria-hidden />
      <div className="film-grain" aria-hidden />
      <div className="vignette" aria-hidden />

      {ghostVisible && ghostTarget && (
        <div
          className={`horror-entity ${fleeing ? 'fleeing' : ''} agg-${Math.min(5, Math.floor(aggression * 5))} prox-${Math.min(5, Math.floor(proximity * 5))}`}
          data-target={ghostTarget}
          style={{
            transform: fleeing
              ? undefined
              : `translate(calc(-50% + var(--shake-x, 0px)), calc(-50% + var(--shake-y, 0px))) scale(var(--grow, 1))`,
          }}
        >
          {ghostTarget === 'tombstone' && <GraveDirtEntity />}
          {ghostTarget === 'ring' && <WeddingEchoEntity />}
          {ghostTarget === 'doll' && <PorcelainDollEntity />}
          {ghostTarget === 'lake' && <DrownedEntity />}
        </div>
      )}

      {hitFlash && <div className="hit-overlay" aria-hidden />}

      <div className="fallback-banner">
        Overlay mode — entity sticks to the screen, not the room. For
        world-anchored AR: Chrome + ARCore (WebXR immersive-ar).
      </div>
    </div>
  )
}

function GraveDirtEntity() {
  return (
    <div className="ent grave">
      <div className="ent-spike" />
      <div className="ent-torso" />
      <div className="ent-skull">
        <span className="pit pit-l" />
        <span className="pit pit-r" />
        <span className="jaw" />
      </div>
      <div className="ent-arm arm-l" />
      <div className="ent-arm arm-r" />
    </div>
  )
}

function WeddingEchoEntity() {
  return (
    <div className="ent wedding">
      <div className="veil" />
      <div className="half-face">
        <span className="void-eye" />
      </div>
      <div className="hand">
        <span className="finger f1" />
        <span className="finger f2" />
        <span className="finger f3" />
        <span className="finger f4" />
        <span className="finger f5" />
        <span className="ring-glint" />
      </div>
    </div>
  )
}

function PorcelainDollEntity() {
  return (
    <div className="ent doll">
      <div className="doll-head">
        <span className="eye e-l" />
        <span className="eye e-r" />
        <span className="crack" />
        <span className="wrong-smile" />
      </div>
      <div className="doll-body" />
      <div className="joint j1" />
      <div className="limb l1" />
      <div className="joint j2" />
      <div className="limb l2" />
      <div className="limb l3" />
      <div className="limb l4" />
    </div>
  )
}

function DrownedEntity() {
  return (
    <div className="ent drowned">
      <div className="water-disk" />
      <div className="ripple" />
      <div className="drowned-torso" />
      <div className="drowned-head">
        <span className="slit-mouth" />
        <span className="weed w1" />
        <span className="weed w2" />
        <span className="weed w3" />
        <span className="weed w4" />
      </div>
      <div className="reach-arm" />
    </div>
  )
}
