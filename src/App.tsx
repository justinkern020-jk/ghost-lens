import { useCallback, useEffect, useRef, useState } from 'react'
import { checkWebXrAr, GhostArSession } from './ar/GhostArSession'
import { DreadAudio } from './audio/dreadAudio'
import {
  APPROACH_MS,
  bpmFromState,
  CAPTURE_HEAL,
  easedProximity,
  FIRST_HIT_DELAY_MS,
  HIT_DAMAGE,
  HIT_INTERVAL_MS,
  HIT_STUN_MS,
  isMelee,
  MAX_HEALTH,
  PASSIVE_DRAIN_PER_SEC,
  proximityFromElapsed,
} from './combat/tension'
import { DeathScreen } from './components/DeathScreen'
import { FallbackLens } from './components/FallbackLens'
import { Gallery } from './components/Gallery'
import { Hud } from './components/Hud'
import { useCamera } from './hooks/useCamera'
import { useClassifier } from './hooks/useClassifier'
import { useDuskGate } from './hooks/useDuskGate'
import type { ArMode, Capture, TargetType } from './types'
import './App.css'

export default function App() {
  const [arMode, setArMode] = useState<ArMode>('checking')
  const [arReason, setArReason] = useState('')
  const [arRunning, setArRunning] = useState(false)
  const [anchored, setAnchored] = useState(false)
  const [fleeing, setFleeing] = useState(false)
  const [captures, setCaptures] = useState<Capture[]>([])
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [statusLine, setStatusLine] = useState('')
  const [aggression, setAggression] = useState(0)
  const [proximity, setProximity] = useState(0)
  const [health, setHealth] = useState(MAX_HEALTH)
  const [bpm, setBpm] = useState(56)
  const [hitFlash, setHitFlash] = useState(false)
  const [stunned, setStunned] = useState(false)
  const [dead, setDead] = useState(false)
  const [started, setStarted] = useState(false)

  const xrCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const arSessionRef = useRef<GhostArSession | null>(null)
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef(new DreadAudio())
  const appearAtRef = useRef<number | null>(null)
  const lastTargetRef = useRef<TargetType | null>(null)
  const placedForRef = useRef<TargetType | null>(null)
  const healthRef = useRef(MAX_HEALTH)
  const lastHitAtRef = useRef(0)
  const meleeEnteredAtRef = useRef<number | null>(null)
  const deadRef = useRef(false)
  const longPressRef = useRef<number | null>(null)

  const dusk = useDuskGate()

  const useFallbackCam =
    started &&
    dusk.allowed &&
    (arMode === 'fallback' || arMode === 'unsupported') &&
    !arRunning
  const camera = useCamera(useFallbackCam)
  const {
    ready: modelReady,
    loadingMsg,
    error: modelError,
    detection,
    sustainedTarget,
    ghostShouldShow,
    classifyFrame,
    resetGhost,
  } = useClassifier()

  // Probe WebXR
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { supported, reason } = await checkWebXrAr()
      if (cancelled) return
      if (supported) {
        setArMode('webxr')
        setArReason('')
      } else {
        setArMode('fallback')
        setArReason(reason ?? 'WebXR AR unavailable')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const classifyStreamRef = useRef<MediaStream | null>(null)
  const classifyVideoRef = useRef<HTMLVideoElement | null>(null)

  // Classification loop — only while dusk allows hunting
  useEffect(() => {
    if (!started || !modelReady || !dusk.allowed || dead) return
    let cancelled = false
    let raf = 0

    const ensureClassifyVideo = async () => {
      if (useFallbackCam && fallbackVideoRef.current) {
        return fallbackVideoRef.current
      }
      if (!classifyVideoRef.current) {
        const v = document.createElement('video')
        v.playsInline = true
        v.muted = true
        v.setAttribute('playsinline', 'true')
        classifyVideoRef.current = v
      }
      if (!classifyStreamRef.current) {
        try {
          classifyStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 } },
          })
          classifyVideoRef.current.srcObject = classifyStreamRef.current
          await classifyVideoRef.current.play()
        } catch {
          return null
        }
      }
      return classifyVideoRef.current
    }

    const loop = async () => {
      if (cancelled) return
      const vid = await ensureClassifyVideo()
      if (vid && vid.readyState >= 2) {
        await classifyFrame(vid)
      }
      raf = window.setTimeout(() => void loop(), 50) as unknown as number
    }
    void loop()

    return () => {
      cancelled = true
      clearTimeout(raf)
      classifyStreamRef.current?.getTracks().forEach((t) => t.stop())
      classifyStreamRef.current = null
    }
  }, [started, modelReady, useFallbackCam, classifyFrame, dusk.allowed, dead])

  // If dusk ends mid-session, tear down hunt
  useEffect(() => {
    if (dusk.allowed || !started) return
    appearAtRef.current = null
    placedForRef.current = null
    setAggression(0)
    setProximity(0)
    setFleeing(false)
    resetGhost()
    arSessionRef.current?.hideGhost()
    audioRef.current.setPresence(false, 0)
    audioRef.current.setHeartbeat(56, false)
    if (arRunning) {
      void arSessionRef.current?.end()
      setArRunning(false)
    }
    classifyStreamRef.current?.getTracks().forEach((t) => t.stop())
    classifyStreamRef.current = null
    setStatusLine(dusk.status.reason)
  }, [dusk.allowed, started, arRunning, resetGhost, dusk.status.reason])

  // Manifest / flee
  useEffect(() => {
    if (!started || dead || !dusk.allowed) return

    if (ghostShouldShow && sustainedTarget) {
      setFleeing(false)
      if (appearAtRef.current === null || lastTargetRef.current !== sustainedTarget) {
        appearAtRef.current = performance.now()
        lastTargetRef.current = sustainedTarget
        setAggression(0)
        setProximity(0)
        meleeEnteredAtRef.current = null
        lastHitAtRef.current = 0
      }

      if (arRunning && arSessionRef.current) {
        if (placedForRef.current !== sustainedTarget) {
          arSessionRef.current.requestPlace(sustainedTarget)
          placedForRef.current = sustainedTarget
          setStatusLine(`Something wrong near the ${sustainedTarget}…`)
        }
        arSessionRef.current.setAggression(aggression)
        arSessionRef.current.setProximity(proximity)
      }

      void audioRef.current.ensure().then(() => {
        audioRef.current.setPresence(true, Math.max(aggression, proximity))
      })
    } else if (appearAtRef.current !== null) {
      setFleeing(true)
      setAnchored(false)
      placedForRef.current = null
      appearAtRef.current = null
      meleeEnteredAtRef.current = null
      setProximity(0)
      if (arSessionRef.current) arSessionRef.current.hideGhost()
      audioRef.current.setPresence(false, 0)
      audioRef.current.setHeartbeat(bpm, false)
      setStatusLine('It slipped away.')
      setTimeout(() => setFleeing(false), 900)
    }
  }, [
    ghostShouldShow,
    sustainedTarget,
    arRunning,
    aggression,
    proximity,
    started,
    dead,
    dusk.allowed,
    bpm,
  ])

  // Approach + health + hits tick
  useEffect(() => {
    if (!ghostShouldShow || !appearAtRef.current || dead || !dusk.allowed) {
      if (!ghostShouldShow) {
        setAggression(0)
        setProximity(0)
        audioRef.current.setHeartbeat(56, false)
      }
      return
    }

    let lastTick = performance.now()
    const id = window.setInterval(() => {
      if (!appearAtRef.current || deadRef.current) return
      const now = performance.now()
      const dt = Math.min(0.25, (now - lastTick) / 1000)
      lastTick = now

      const elapsed = now - appearAtRef.current
      const raw = proximityFromElapsed(elapsed)
      const prox = easedProximity(raw)
      const agg = Math.min(1, elapsed / APPROACH_MS)
      setProximity(prox)
      setAggression(agg)
      arSessionRef.current?.setAggression(agg)
      arSessionRef.current?.setProximity(prox)
      audioRef.current.setPresence(true, Math.max(agg, prox))

      // Passive calm drain (stronger as it closes)
      let h = healthRef.current
      const drain = PASSIVE_DRAIN_PER_SEC * (0.25 + prox * 1.1) * dt
      h = Math.max(0, h - drain)

      // Melee strikes
      if (isMelee(prox)) {
        if (meleeEnteredAtRef.current === null) {
          meleeEnteredAtRef.current = now
          setStatusLine('It’s on you — Capture!')
        }
        const sinceMelee = now - meleeEnteredAtRef.current
        const sinceHit = now - lastHitAtRef.current
        const ready =
          sinceMelee >= FIRST_HIT_DELAY_MS &&
          (lastHitAtRef.current === 0 || sinceHit >= HIT_INTERVAL_MS)
        if (ready) {
          lastHitAtRef.current = now
          h = Math.max(0, h - HIT_DAMAGE)
          setHitFlash(true)
          setStunned(true)
          audioRef.current.playHit()
          setStatusLine('It struck. Your heart skips.')
          window.setTimeout(() => setHitFlash(false), 220)
          window.setTimeout(() => setStunned(false), HIT_STUN_MS)
        }
      }

      healthRef.current = h
      setHealth(h)
      const nextBpm = bpmFromState(prox, h)
      setBpm(nextBpm)
      audioRef.current.setHeartbeat(nextBpm, true)

      if (prox > 0.7 && !isMelee(prox)) {
        setStatusLine('It’s closing in. Capture it.')
      } else if (prox > 0.35 && prox <= 0.7) {
        setStatusLine('Don’t look away. Keep it framed.')
      }

      if (h <= 0) {
        deadRef.current = true
        setDead(true)
        setHealth(0)
        setBpm(0)
        appearAtRef.current = null
        placedForRef.current = null
        setProximity(0)
        setAggression(0)
        resetGhost()
        arSessionRef.current?.hideGhost()
        audioRef.current.setPresence(false, 0)
        audioRef.current.setHeartbeat(0, false)
        audioRef.current.playFlatline()
        setStatusLine('Died of fright.')
      }
    }, 100)

    return () => clearInterval(id)
  }, [ghostShouldShow, dead, dusk.allowed, resetGhost])

  const startExperience = async () => {
    setStarted(true)
    await audioRef.current.ensure()
  }

  const startWebXr = async () => {
    if (!dusk.allowed) {
      setStatusLine(dusk.status.reason)
      return
    }
    if (!xrCanvasRef.current) return
    try {
      setStatusLine('Starting WebXR…')
      const session = new GhostArSession(xrCanvasRef.current, {
        onStatus: (s, detail) => {
          if (s === 'running') {
            setArRunning(true)
            setStatusLine('WebXR AR active — point at a surface near the target.')
          }
          if (s === 'ended') {
            setArRunning(false)
            setAnchored(false)
            placedForRef.current = null
            setStatusLine('AR session ended.')
          }
          if (s === 'error') setStatusLine(detail ?? 'AR error')
        },
        onAnchorPlaced: (target) => {
          setAnchored(true)
          setStatusLine(`Anchored. The ${target} thing is in the room.`)
        },
        onAnchorLost: () => setAnchored(false),
      })
      arSessionRef.current = session
      await session.start()
    } catch (e) {
      setArMode('fallback')
      setArReason(e instanceof Error ? e.message : 'Failed to start WebXR')
      setStatusLine('WebXR failed — using overlay fallback.')
      setArRunning(false)
    }
  }

  const onVideoEl = useCallback((el: HTMLVideoElement | null) => {
    fallbackVideoRef.current = el
  }, [])

  const capture = () => {
    if (!sustainedTarget || !ghostShouldShow || dead || !dusk.allowed) return
    let dataUrl: string | null = null
    let mode: Capture['mode'] = 'fallback'

    if (arRunning && arSessionRef.current?.getGhostVisible()) {
      dataUrl = arSessionRef.current.captureStill()
      mode = 'webxr'
    }

    if (!dataUrl && fallbackVideoRef.current) {
      const video = fallbackVideoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 720
      canvas.height = video.videoHeight || 1280
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'rgba(10,12,10,0.25)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const ent = document.querySelector('.horror-entity') as HTMLElement | null
        if (ent) {
          ctx.save()
          ctx.translate(canvas.width / 2, canvas.height * 0.42)
          ctx.globalAlpha = 0.7
          ctx.fillStyle = '#1a1814'
          ctx.beginPath()
          ctx.ellipse(0, 0, 60, 90, 0.1, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#b8ffe0'
          ctx.font = '12px monospace'
          ctx.globalAlpha = 0.5
          ctx.fillText(sustainedTarget, -20, 110)
          ctx.restore()
        }
        dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      }
    }

    if (!dataUrl) return

    const cap: Capture = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      target: sustainedTarget,
      timestamp: Date.now(),
      dataUrl,
      mode,
    }
    setCaptures((c) => [cap, ...c])
    setStatusLine(`Captured the ${sustainedTarget} presence.`)
    appearAtRef.current = null
    meleeEnteredAtRef.current = null
    setAggression(0)
    setProximity(0)
    const healed = Math.min(MAX_HEALTH, healthRef.current + CAPTURE_HEAL)
    healthRef.current = healed
    setHealth(healed)
    setBpm(bpmFromState(0, healed))
    resetGhost()
    arSessionRef.current?.hideGhost()
    placedForRef.current = null
    audioRef.current.setPresence(false, 0)
    audioRef.current.setHeartbeat(56, false)
  }

  const retryAfterDeath = () => {
    deadRef.current = false
    setDead(false)
    healthRef.current = MAX_HEALTH
    setHealth(MAX_HEALTH)
    setBpm(56)
    setProximity(0)
    setAggression(0)
    setHitFlash(false)
    setStunned(false)
    appearAtRef.current = null
    meleeEnteredAtRef.current = null
    lastHitAtRef.current = 0
    placedForRef.current = null
    resetGhost()
    arSessionRef.current?.hideGhost()
    setStatusLine('Pulse returns. Hunt again.')
    void audioRef.current.ensure().then(() => {
      audioRef.current.setPresence(false, 0)
    })
  }

  // Long-press brand → toggle force dusk (dev)
  const onBrandPointerDown = () => {
    longPressRef.current = window.setTimeout(() => {
      const next = !dusk.forceDusk
      dusk.setForceDusk(next)
      // Clear URL override when turning off so localStorage wins
      try {
        const url = new URL(window.location.href)
        if (!next && url.searchParams.has('forceDusk')) {
          url.searchParams.delete('forceDusk')
          window.history.replaceState({}, '', url.toString())
        }
      } catch {
        /* ignore */
      }
      setStatusLine(
        next
          ? 'Force dusk (test) ON — hunt unlocked.'
          : 'Force dusk OFF — real dusk window applies.',
      )
    }, 900)
  }
  const onBrandPointerUp = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  const modeLabel =
    arMode === 'checking'
      ? 'PROBING…'
      : !dusk.allowed
        ? 'LOCKED — DAY'
        : arRunning
          ? 'WEBXR ANCHORED'
          : arMode === 'webxr'
            ? 'WEBXR READY'
            : 'OVERLAY FALLBACK'

  if (!started) {
    return (
      <div className="boot-screen">
        <div className="boot-inner">
          <p className="boot-kicker">FIELD INSTRUMENT</p>
          <h1>GHOST LENS</h1>
          <p className="boot-blurb">
            Point the rear camera at a <em>tombstone</em>, <em>ring</em>,{' '}
            <em>doll</em>, or <em>lake</em>. Hold the frame. Something may
            stand where it shouldn’t. Capture it before it closes the distance —
            hesitate, and you may die of fright.
          </p>
          <ul className="boot-list">
            <li>
              Anchoring:{' '}
              {arMode === 'webxr'
                ? 'WebXR hit-test / anchors available'
                : arMode === 'checking'
                  ? 'checking device…'
                  : 'overlay fallback (not world-anchored)'}
            </li>
            {arReason && <li className="warn">{arReason}</li>}
            <li>Vision: on-device CLIP zero-shot (throttled)</li>
            <li>
              Hunt hours: dusk only
              {dusk.status.windowLabel ? ` (${dusk.status.windowLabel} local)` : ''}
              {dusk.status.sunsetLabel && dusk.status.sunsetLabel !== 'none'
                ? ` · sunset ~${dusk.status.sunsetLabel}`
                : ''}
              {dusk.forceDusk ? ' · FORCE DUSK' : ''}
            </li>
            {!dusk.allowed && (
              <li className="warn">{dusk.status.reason}</li>
            )}
            {dusk.geoPending && <li>Locating for solar dusk…</li>}
          </ul>
          <button
            type="button"
            className="btn capture-btn boot-go"
            onClick={() => void startExperience()}
          >
            Open the lens
          </button>
          <button
            type="button"
            className={`btn dusk-force-btn ${dusk.forceDusk ? 'on' : ''}`}
            onClick={() => dusk.toggleForceDusk()}
          >
            {dusk.forceDusk ? 'Force dusk (test): ON' : 'Force dusk (test): OFF'}
          </button>
          <p className="boot-hint">
            Dev: append <code>?forceDusk=1</code> or long-press the title in-hunt.
          </p>
          {modelError && <p className="warn">{modelError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`app-root ${hitFlash ? 'app-hit' : ''} ${stunned ? 'app-stun' : ''}`}>
      <canvas
        ref={xrCanvasRef}
        className={`xr-canvas ${arRunning ? 'active' : ''}`}
      />

      {!dusk.allowed && (
        <div className="dusk-lock">
          <p className="dusk-lock-kicker">HARD LIGHT</p>
          <h2>The dead don&apos;t walk in hard light</h2>
          <p>{dusk.status.reason}</p>
          {dusk.status.windowLabel && dusk.status.windowLabel !== 'forced' && (
            <p className="dusk-window">Return {dusk.status.windowLabel} local.</p>
          )}
          <button
            type="button"
            className={`btn dusk-force-btn ${dusk.forceDusk ? 'on' : ''}`}
            onClick={() => dusk.toggleForceDusk()}
          >
            {dusk.forceDusk ? 'Force dusk (test): ON' : 'Force dusk (test): OFF'}
          </button>
        </div>
      )}

      {useFallbackCam && (
        <FallbackLens
          videoRefAttach={camera.attach}
          videoReady={camera.ready}
          ghostVisible={ghostShouldShow || fleeing}
          ghostTarget={sustainedTarget ?? lastTargetRef.current}
          fleeing={fleeing}
          aggression={aggression}
          proximity={proximity}
          hitFlash={hitFlash}
          stunned={stunned}
          onVideoEl={onVideoEl}
        />
      )}

      {arRunning && ghostShouldShow && (
        <div
          className="ar-threat-flash"
          style={{ opacity: Math.max(aggression, proximity) * 0.4 }}
        />
      )}
      {arRunning && hitFlash && <div className="hit-overlay ar-hit" aria-hidden />}

      <Hud
        modeLabel={modeLabel}
        detection={detection}
        sustained={sustainedTarget}
        ghostVisible={ghostShouldShow}
        anchored={anchored}
        modelReady={modelReady}
        loadingMsg={loadingMsg}
        captureDisabled={
          !dusk.allowed || !ghostShouldShow || !sustainedTarget || dead
        }
        onCapture={capture}
        onOpenGallery={() => setGalleryOpen(true)}
        captureCount={captures.length}
        onStartAr={
          arMode === 'webxr' && !arRunning && dusk.allowed
            ? () => void startWebXr()
            : undefined
        }
        arRunning={arRunning}
        statusLine={
          !dusk.allowed
            ? dusk.status.reason
            : statusLine || (camera.error ?? undefined)
        }
        health={health}
        bpm={bpm}
        proximity={proximity}
        stunned={stunned}
      />

      {/* Invisible long-press target on brand area for force dusk */}
      <button
        type="button"
        className="brand-longpress"
        aria-label="Long-press for force dusk test"
        onPointerDown={onBrandPointerDown}
        onPointerUp={onBrandPointerUp}
        onPointerLeave={onBrandPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />

      <Gallery
        captures={captures}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      {dead && <DeathScreen onRetry={retryAfterDeath} />}
    </div>
  )
}
