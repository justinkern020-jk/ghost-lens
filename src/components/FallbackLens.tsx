import { useEffect, useRef } from 'react'
import type { SpiritKind } from '../types'

interface Props {
  videoRefAttach: (el: HTMLVideoElement | null) => void
  videoReady: boolean
  cameraError?: string | null
  ghostVisible: boolean
  ghostTarget: SpiritKind | null
  fleeing: boolean
  aggression: number
  /** 0–1 approach toward camera (screen-space grow). */
  proximity: number
  hitFlash?: boolean
  stunned?: boolean
  isBoss?: boolean
  isDemon?: boolean
  isTrial?: boolean
  onVideoEl: (el: HTMLVideoElement | null) => void
}

/** Screen-space horror entity — NOT world-anchored. Distinct per trigger. */
export function FallbackLens({
  videoRefAttach,
  videoReady,
  cameraError = null,
  ghostVisible,
  ghostTarget,
  fleeing,
  aggression,
  proximity,
  hitFlash,
  stunned,
  isBoss,
  isDemon,
  isTrial,
  onVideoEl,
}: Props) {
  const videoEl = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    onVideoEl(videoEl.current)
  }, [onVideoEl, videoReady])

  const endgame = !!(isBoss || isDemon)
  const growBase = isDemon ? 1.35 : isBoss ? 1.25 : isTrial ? 0.85 : 1
  const grow =
    growBase +
    proximity * (isDemon ? 2.7 : isBoss ? 2.35 : isTrial ? 1.15 : 1.85)
  const shakeX =
    proximity > 0.55
      ? Math.sin(performance.now() / (isDemon ? 22 : isBoss ? 28 : 40)) *
        proximity *
        (isDemon ? 14 : isBoss ? 10 : 6)
      : 0
  const shakeY =
    proximity > 0.55
      ? Math.cos(performance.now() / (isDemon ? 18 : isBoss ? 22 : 33)) *
        proximity *
        (isDemon ? 10 : isBoss ? 7 : 4)
      : 0
  void endgame

  const aggStyle = {
    ['--agg' as string]: String(aggression),
    ['--prox' as string]: String(proximity),
    ['--grow' as string]: String(grow),
    ['--shake-x' as string]: `${shakeX}px`,
    ['--shake-y' as string]: `${shakeY}px`,
  }

  return (
    <div
      className={`lens-stage fallback ${proximity > 0.7 ? 'shaking' : ''} ${hitFlash ? 'hit-flash' : ''} ${stunned ? 'stunned' : ''} ${isBoss ? 'boss-stage' : ''} ${isDemon ? 'demon-stage' : ''} ${isTrial ? 'trial-stage' : ''}`}
      style={aggStyle}
    >
      <video
        ref={(el) => {
          videoEl.current = el
          if (el) {
            el.setAttribute('playsinline', 'true')
            el.setAttribute('webkit-playsinline', 'true')
          }
          videoRefAttach(el)
        }}
        className="camera-video"
        playsInline
        muted
        autoPlay
      />
      {!videoReady && !cameraError && (
        <div className="camera-status-banner" role="status">
          Starting camera…
        </div>
      )}
      {cameraError && (
        <div className="camera-status-banner warn" role="alert">
          Camera error: {cameraError}
        </div>
      )}
      <div className="viewfinder" aria-hidden />
      <div className="film-grain" aria-hidden />
      <div className="vignette" aria-hidden />

      {ghostVisible && ghostTarget && (
        <div
          className={`horror-entity ${fleeing ? 'fleeing' : ''} ${isBoss ? 'boss-entity' : ''} ${isDemon ? 'demon-entity' : ''} ${isTrial ? 'trial-entity' : ''} agg-${Math.min(5, Math.floor(aggression * 5))} prox-${Math.min(5, Math.floor(proximity * 5))}`}
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
          {ghostTarget === 'trial' && <TrialEchoEntity />}
          {ghostTarget === 'boss' && <ThresholdWardenEntity />}
          {ghostTarget === 'demon' && <PlaygroundDemonEntity />}
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

function TrialEchoEntity() {
  return (
    <div className="ent trial">
      <div className="trial-chair" />
      <div className="trial-seat-hollow" />
      <div className="trial-torso" />
      <div className="trial-head">
        <span className="pit p-l" />
        <span className="pit p-r" />
      </div>
      <div className="trial-arm" />
      <div className="trial-mist" />
    </div>
  )
}

function ThresholdWardenEntity() {
  return (
    <div className="ent warden">
      <div className="warden-water" />
      <div className="warden-ripple" />
      <div className="warden-torso" />
      <div className="warden-spine" />
      <div className="warden-skull">
        <span className="pit p1" />
        <span className="pit p2" />
        <span className="jaw" />
      </div>
      <div className="warden-dollface">
        <span className="eye" />
        <span className="eye e2" />
      </div>
      <div className="warden-arm arm-l" />
      <div className="warden-arm arm-r" />
      <div className="warden-hand">
        <span className="ring-glint" />
      </div>
      <div className="warden-weed w1" />
      <div className="warden-weed w2" />
      <div className="warden-weed w3" />
      <div className="warden-spike" />
    </div>
  )
}

function PlaygroundDemonEntity() {
  return (
    <div className="ent demon">
      <div className="demon-sand" />
      <div className="demon-seat seat-main" />
      <div className="demon-seat seat-empty" />
      <div className="demon-chain chain-l">
        <span /><span /><span /><span /><span />
      </div>
      <div className="demon-chain chain-r">
        <span /><span /><span /><span /><span />
      </div>
      <div className="demon-torso" />
      <div className="demon-neck" />
      <div className="demon-head">
        <span className="socket s-l" />
        <span className="socket s-r" />
        <span className="thin-mouth" />
      </div>
      <div className="demon-arm arm-l" />
      <div className="demon-arm arm-r" />
      <div className="demon-leg leg-l" />
      <div className="demon-leg leg-r" />
      <div className="demon-void" />
    </div>
  )
}
