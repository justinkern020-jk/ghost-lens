import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { checkWebXrAr, GhostArSession } from './ar/GhostArSession'
import { DreadAudio } from './audio/dreadAudio'
import {
  BOSS_PHASE_KNOCKBACK,
  BOSS_TENSION,
  bpmFromState,
  easedProximity,
  isMelee,
  MAX_HEALTH,
  NORMAL_TENSION,
  proximityFromElapsed,
  type TensionProfile,
} from './combat/tension'
import { DeathScreen } from './components/DeathScreen'
import { FallbackLens } from './components/FallbackLens'
import { Gallery } from './components/Gallery'
import { Hud } from './components/Hud'
import { useCamera } from './hooks/useCamera'
import { useClassifier } from './hooks/useClassifier'
import { useDuskGate } from './hooks/useDuskGate'
import { makePolaroidStill } from './inventory/makePolaroid'
import {
  countOfKind,
  hasBossCapture,
  loadPolaroids,
  savePolaroids,
  uniqueTargetTypes,
} from './inventory/polaroidStore'
import { pickLore } from './lore/spiritLore'
import {
  BOSS_CAPTURE_PHASES,
  BOSS_UNLOCK_UNIQUE,
  type ArMode,
  type Capture,
  type SpiritKind,
  type TargetType,
} from './types'
import './App.css'

function readForceBoss(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('forceBoss') === '1') return true
    return localStorage.getItem('ghost-lens-force-boss') === '1'
  } catch {
    return false
  }
}

export default function App() {
  const [arMode, setArMode] = useState<ArMode>('checking')
  const [arReason, setArReason] = useState('')
  const [arRunning, setArRunning] = useState(false)
  const [anchored, setAnchored] = useState(false)
  const [fleeing, setFleeing] = useState(false)
  const [captures, setCaptures] = useState<Capture[]>(() => loadPolaroids())
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
  const [forceBoss, setForceBoss] = useState(readForceBoss)
  const [activeKind, setActiveKind] = useState<SpiritKind | null>(null)
  const [capturePhase, setCapturePhase] = useState(0)
  const [capturing, setCapturing] = useState(false)

  const xrCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const arSessionRef = useRef<GhostArSession | null>(null)
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef(new DreadAudio())
  const appearAtRef = useRef<number | null>(null)
  const lastTargetRef = useRef<TargetType | null>(null)
  const placedForRef = useRef<SpiritKind | null>(null)
  const healthRef = useRef(MAX_HEALTH)
  const lastHitAtRef = useRef(0)
  const meleeEnteredAtRef = useRef<number | null>(null)
  const deadRef = useRef(false)
  const longPressRef = useRef<number | null>(null)
  const activeKindRef = useRef<SpiritKind | null>(null)
  const capturePhaseRef = useRef(0)
  const isBossRef = useRef(false)

  const dusk = useDuskGate()

  const uniqueSealed = useMemo(
    () => uniqueTargetTypes(captures).size,
    [captures],
  )
  const bossDefeated = useMemo(() => hasBossCapture(captures), [captures])
  const bossUnlocked =
    forceBoss || uniqueSealed >= BOSS_UNLOCK_UNIQUE

  useEffect(() => {
    savePolaroids(captures)
  }, [captures])

  useEffect(() => {
    activeKindRef.current = activeKind
    isBossRef.current = activeKind === 'boss'
  }, [activeKind])

  useEffect(() => {
    capturePhaseRef.current = capturePhase
  }, [capturePhase])

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
    setActiveKind(null)
    setCapturePhase(0)
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

  const resolveEncounterKind = useCallback(
    (detected: TargetType): SpiritKind => {
      if (bossUnlocked && !bossDefeated) return 'boss'
      return detected
    },
    [bossUnlocked, bossDefeated],
  )

  // Manifest / flee
  useEffect(() => {
    if (!started || dead || !dusk.allowed) return

    if (ghostShouldShow && sustainedTarget) {
      setFleeing(false)
      const kind = resolveEncounterKind(sustainedTarget)

      if (
        appearAtRef.current === null ||
        lastTargetRef.current !== sustainedTarget ||
        activeKindRef.current !== kind
      ) {
        appearAtRef.current = performance.now()
        lastTargetRef.current = sustainedTarget
        setActiveKind(kind)
        setAggression(0)
        setProximity(0)
        setCapturePhase(0)
        capturePhaseRef.current = 0
        meleeEnteredAtRef.current = null
        lastHitAtRef.current = 0
        if (kind === 'boss') {
          setStatusLine('The Threshold Warden answers. Seal it in phases.')
        }
      }

      if (arRunning && arSessionRef.current) {
        if (placedForRef.current !== kind) {
          arSessionRef.current.requestPlace(kind)
          placedForRef.current = kind
          if (kind !== 'boss') {
            setStatusLine(`Something wrong near the ${sustainedTarget}…`)
          }
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
      setCapturePhase(0)
      setActiveKind(null)
      if (arSessionRef.current) arSessionRef.current.hideGhost()
      audioRef.current.setPresence(false, 0)
      audioRef.current.setHeartbeat(bpm, false)
      setStatusLine(
        bossUnlocked && !bossDefeated
          ? 'The Warden slipped the frame. It will return.'
          : 'It slipped away.',
      )
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
    resolveEncounterKind,
    bossUnlocked,
    bossDefeated,
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

      const profile: TensionProfile = isBossRef.current
        ? BOSS_TENSION
        : NORMAL_TENSION
      const elapsed = now - appearAtRef.current
      const raw = proximityFromElapsed(elapsed, profile.approachMs)
      const prox = easedProximity(raw)
      const agg = Math.min(1, elapsed / profile.approachMs)
      setProximity(prox)
      setAggression(agg)
      arSessionRef.current?.setAggression(agg)
      arSessionRef.current?.setProximity(prox)
      audioRef.current.setPresence(true, Math.max(agg, prox))

      let h = healthRef.current
      const drain =
        profile.passiveDrainPerSec * (0.25 + prox * 1.1) * dt
      h = Math.max(0, h - drain)

      if (isMelee(prox)) {
        if (meleeEnteredAtRef.current === null) {
          meleeEnteredAtRef.current = now
          setStatusLine(
            isBossRef.current
              ? 'The Warden is on you — keep sealing!'
              : 'It’s on you — Capture!',
          )
        }
        const sinceMelee = now - meleeEnteredAtRef.current
        const sinceHit = now - lastHitAtRef.current
        const ready =
          sinceMelee >= profile.firstHitDelayMs &&
          (lastHitAtRef.current === 0 || sinceHit >= profile.hitIntervalMs)
        if (ready) {
          lastHitAtRef.current = now
          h = Math.max(0, h - profile.hitDamage)
          setHitFlash(true)
          setStunned(true)
          audioRef.current.playHit()
          setStatusLine(
            isBossRef.current
              ? 'It hits like four graves at once.'
              : 'It struck. Your heart skips.',
          )
          window.setTimeout(() => setHitFlash(false), 220)
          window.setTimeout(() => setStunned(false), 380)
        }
      }

      healthRef.current = h
      setHealth(h)
      const nextBpm = bpmFromState(prox, h)
      setBpm(nextBpm)
      audioRef.current.setHeartbeat(nextBpm, true)

      if (prox > 0.7 && !isMelee(prox)) {
        setStatusLine(
          isBossRef.current
            ? 'Seal faster. It does not hesitate.'
            : 'It’s closing in. Capture it.',
        )
      } else if (prox > 0.35 && prox <= 0.7 && !isBossRef.current) {
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
        setCapturePhase(0)
        setActiveKind(null)
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

  // Announce boss unlock once
  const unlockedAnnounced = useRef(false)
  useEffect(() => {
    if (!started) return
    if (bossUnlocked && !bossDefeated && !unlockedAnnounced.current) {
      unlockedAnnounced.current = true
      setStatusLine(
        forceBoss
          ? 'Force boss armed — next manifestation is the Warden.'
          : 'All four sealed. Something worse is listening.',
      )
    }
    if (bossDefeated) unlockedAnnounced.current = true
  }, [bossUnlocked, bossDefeated, started, forceBoss])

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
          setStatusLine(
            target === 'boss'
              ? 'Anchored. The Warden is in the room.'
              : `Anchored. The ${target} thing is in the room.`,
          )
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

  const grabRawStill = (): { dataUrl: string; mode: Capture['mode'] } | null => {
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
        const kind = activeKindRef.current
        if (kind) {
          ctx.save()
          ctx.translate(canvas.width / 2, canvas.height * 0.42)
          ctx.globalAlpha = 0.75
          if (kind === 'boss') {
            ctx.fillStyle = '#120808'
            ctx.beginPath()
            ctx.ellipse(0, 10, 80, 120, 0.05, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = '#7a2020'
          } else {
            ctx.fillStyle = '#1a1814'
            ctx.beginPath()
            ctx.ellipse(0, 0, 60, 90, 0.1, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = '#b8ffe0'
          }
          ctx.font = '12px monospace'
          ctx.globalAlpha = 0.55
          ctx.fillText(kind, -24, 120)
          ctx.restore()
        }
        dataUrl = canvas.toDataURL('image/jpeg', 0.9)
      }
    }

    if (!dataUrl) return null
    return { dataUrl, mode }
  }

  const finishCapture = async (kind: SpiritKind) => {
    const raw = grabRawStill()
    if (!raw) return

    const prior = countOfKind(captures, kind)
    const lorePick = pickLore(kind, prior)
    let polaroidUrl = raw.dataUrl
    try {
      polaroidUrl = await makePolaroidStill(raw.dataUrl, kind, lorePick.name)
    } catch {
      /* keep raw */
    }

    const cap: Capture = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      target: kind,
      timestamp: Date.now(),
      dataUrl: polaroidUrl,
      mode: raw.mode,
      lore: {
        name: lorePick.name,
        epithet: lorePick.epithet,
        trappedNote: lorePick.trappedNote,
      },
      loreVariant: lorePick.variant,
      isBoss: kind === 'boss',
    }
    setCaptures((c) => [cap, ...c])

    const profile = kind === 'boss' ? BOSS_TENSION : NORMAL_TENSION
    setStatusLine(
      kind === 'boss'
        ? `Sealed: ${lorePick.name}. The threshold goes quiet.`
        : `Polaroid sealed — ${lorePick.name}.`,
    )
    appearAtRef.current = null
    meleeEnteredAtRef.current = null
    setAggression(0)
    setProximity(0)
    setCapturePhase(0)
    setActiveKind(null)
    const healed = Math.min(MAX_HEALTH, healthRef.current + profile.captureHeal)
    healthRef.current = healed
    setHealth(healed)
    setBpm(bpmFromState(0, healed))
    resetGhost()
    arSessionRef.current?.hideGhost()
    placedForRef.current = null
    audioRef.current.setPresence(false, 0)
    audioRef.current.setHeartbeat(56, false)

    if (kind !== 'boss') {
      const nextUnique = uniqueTargetTypes([cap, ...captures]).size
      if (nextUnique >= BOSS_UNLOCK_UNIQUE && !hasBossCapture([cap, ...captures])) {
        window.setTimeout(() => {
          setStatusLine('All four sealed. Something worse is listening.')
        }, 1200)
      }
    }
  }

  const capture = () => {
    if (!sustainedTarget || !ghostShouldShow || dead || !dusk.allowed || capturing)
      return
    const kind = activeKindRef.current
    if (!kind) return

    if (kind === 'boss') {
      const phase = capturePhaseRef.current
      if (phase < BOSS_CAPTURE_PHASES - 1) {
        const next = phase + 1
        capturePhaseRef.current = next
        setCapturePhase(next)
        // Knock the Warden back briefly
        if (appearAtRef.current != null) {
          const now = performance.now()
          const elapsed = now - appearAtRef.current
          const newElapsed = Math.max(
            0,
            elapsed - BOSS_PHASE_KNOCKBACK * BOSS_TENSION.approachMs,
          )
          appearAtRef.current = now - newElapsed
        }
        meleeEnteredAtRef.current = null
        setStatusLine(
          next === 1
            ? 'First seal holds — keep the frame.'
            : 'Second seal holds — one more.',
        )
        audioRef.current.playHit()
        return
      }
    }

    setCapturing(true)
    void finishCapture(kind).finally(() => setCapturing(false))
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
    setCapturePhase(0)
    setActiveKind(null)
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

  const toggleForceBoss = () => {
    const next = !forceBoss
    setForceBoss(next)
    try {
      localStorage.setItem('ghost-lens-force-boss', next ? '1' : '0')
      const url = new URL(window.location.href)
      if (next) url.searchParams.set('forceBoss', '1')
      else url.searchParams.delete('forceBoss')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setStatusLine(
      next
        ? 'Force boss ON — next manifestation is the Warden.'
        : 'Force boss OFF.',
    )
  }

  // Long-press brand → toggle force dusk (dev)
  const onBrandPointerDown = () => {
    longPressRef.current = window.setTimeout(() => {
      const next = !dusk.forceDusk
      dusk.setForceDusk(next)
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

  const isBoss = activeKind === 'boss'

  const modeLabel =
    arMode === 'checking'
      ? 'PROBING…'
      : !dusk.allowed
        ? 'LOCKED — DAY'
        : isBoss && ghostShouldShow
          ? 'WARDEN'
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
            stand where it shouldn’t. Capture it into a polaroid before it
            closes the distance — hesitate, and you may die of fright. Seal
            all four to wake the <em>Threshold Warden</em>.
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
              Inventory: {captures.length} polaroid
              {captures.length === 1 ? '' : 's'} · {uniqueSealed}/4 types
              {bossDefeated ? ' · Warden sealed' : bossUnlocked ? ' · Warden unlocked' : ''}
            </li>
            <li>
              Hunt hours: dusk only
              {dusk.status.windowLabel ? ` (${dusk.status.windowLabel} local)` : ''}
              {dusk.status.sunsetLabel && dusk.status.sunsetLabel !== 'none'
                ? ` · sunset ~${dusk.status.sunsetLabel}`
                : ''}
              {dusk.forceDusk ? ' · FORCE DUSK' : ''}
              {forceBoss ? ' · FORCE BOSS' : ''}
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
          <button
            type="button"
            className={`btn dusk-force-btn ${forceBoss ? 'on' : ''}`}
            onClick={toggleForceBoss}
          >
            {forceBoss ? 'Force boss (test): ON' : 'Force boss (test): OFF'}
          </button>
          <p className="boot-hint">
            Dev: <code>?forceDusk=1</code> · <code>?forceBoss=1</code> · long-press
            title in-hunt for dusk.
          </p>
          {modelError && <p className="warn">{modelError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={`app-root ${hitFlash ? 'app-hit' : ''} ${stunned ? 'app-stun' : ''} ${isBoss ? 'app-boss' : ''}`}>
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
          ghostTarget={activeKind ?? sustainedTarget ?? lastTargetRef.current}
          fleeing={fleeing}
          aggression={aggression}
          proximity={proximity}
          hitFlash={hitFlash}
          stunned={stunned}
          isBoss={isBoss}
          onVideoEl={onVideoEl}
        />
      )}

      {arRunning && ghostShouldShow && (
        <div
          className={`ar-threat-flash ${isBoss ? 'boss-flash' : ''}`}
          style={{ opacity: Math.max(aggression, proximity) * (isBoss ? 0.55 : 0.4) }}
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
          !dusk.allowed || !ghostShouldShow || !sustainedTarget || dead || capturing
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
        isBoss={isBoss && ghostShouldShow}
        capturePhase={capturePhase}
        capturePhases={BOSS_CAPTURE_PHASES}
        uniqueSealed={uniqueSealed}
        bossUnlocked={bossUnlocked && !bossDefeated}
      />

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
        uniqueCount={uniqueSealed}
        bossUnlocked={bossUnlocked}
        bossDefeated={bossDefeated}
      />

      {dead && <DeathScreen onRetry={retryAfterDeath} />}
    </div>
  )
}
