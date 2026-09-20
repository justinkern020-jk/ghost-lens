import { useCallback, useEffect, useRef, useState } from 'react'
import { checkWebXrAr, GhostArSession } from './ar/GhostArSession'
import { DreadAudio } from './audio/dreadAudio'
import { FallbackLens } from './components/FallbackLens'
import { Gallery } from './components/Gallery'
import { Hud } from './components/Hud'
import { useCamera } from './hooks/useCamera'
import { useClassifier } from './hooks/useClassifier'
import type { ArMode, Capture, TargetType } from './types'
import './App.css'

const AGGRESSION_RAMP_MS = 8000

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
  const [started, setStarted] = useState(false)

  const xrCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const arSessionRef = useRef<GhostArSession | null>(null)
  const fallbackVideoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef(new DreadAudio())
  const appearAtRef = useRef<number | null>(null)
  const lastTargetRef = useRef<TargetType | null>(null)
  const placedForRef = useRef<TargetType | null>(null)

  const useFallbackCam = started && (arMode === 'fallback' || arMode === 'unsupported') && !arRunning
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

  // Classification loop (fallback video OR note: WebXR cam is compositor-owned;
  // we still run classify on a getUserMedia peek when in fallback.
  // For WebXR we open a silent rear camera stream for classification only.)
  const classifyStreamRef = useRef<MediaStream | null>(null)
  const classifyVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!started || !modelReady) return
    let cancelled = false
    let raf = 0

    const ensureClassifyVideo = async () => {
      if (useFallbackCam && fallbackVideoRef.current) {
        return fallbackVideoRef.current
      }
      // Side channel for WebXR: classify from a parallel camera stream
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
  }, [started, modelReady, useFallbackCam, classifyFrame])

  // Manifest / flee / aggression
  useEffect(() => {
    if (!started) return

    if (ghostShouldShow && sustainedTarget) {
      setFleeing(false)
      if (appearAtRef.current === null || lastTargetRef.current !== sustainedTarget) {
        appearAtRef.current = performance.now()
        lastTargetRef.current = sustainedTarget
        setAggression(0)
      }

      if (arRunning && arSessionRef.current) {
        if (placedForRef.current !== sustainedTarget) {
          arSessionRef.current.requestPlace(sustainedTarget)
          placedForRef.current = sustainedTarget
          setStatusLine(`Something wrong near the ${sustainedTarget}…`)
        }
        arSessionRef.current.setAggression(aggression)
      }

      void audioRef.current.ensure().then(() => {
        audioRef.current.setPresence(true, aggression)
      })
    } else if (appearAtRef.current !== null) {
      // Lost target — flee
      setFleeing(true)
      setAnchored(false)
      placedForRef.current = null
      appearAtRef.current = null
      if (arSessionRef.current) arSessionRef.current.hideGhost()
      audioRef.current.setPresence(false, 0)
      setStatusLine('It slipped away.')
      setTimeout(() => setFleeing(false), 900)
    }
  }, [ghostShouldShow, sustainedTarget, arRunning, aggression, started])

  // Aggression ramps while entity is visible and uncaptured
  useEffect(() => {
    if (!ghostShouldShow || !appearAtRef.current) {
      setAggression(0)
      return
    }
    const id = window.setInterval(() => {
      if (!appearAtRef.current) return
      const t = (performance.now() - appearAtRef.current) / AGGRESSION_RAMP_MS
      const next = Math.min(1, t)
      setAggression(next)
      arSessionRef.current?.setAggression(next)
      audioRef.current.setPresence(true, next)
      if (next > 0.7) {
        setStatusLine('It’s noticing you. Capture it.')
      } else if (next > 0.35) {
        setStatusLine('Don’t look away. Keep it framed.')
      }
    }, 200)
    return () => clearInterval(id)
  }, [ghostShouldShow])

  const startExperience = async () => {
    setStarted(true)
    await audioRef.current.ensure()
  }

  const startWebXr = async () => {
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
    if (!sustainedTarget || !ghostShouldShow) return
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
        // Composite CSS entity via offscreen approximation — stamp label + silhouette
        ctx.fillStyle = 'rgba(10,12,10,0.25)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        const ent = document.querySelector('.horror-entity') as HTMLElement | null
        if (ent) {
          // Draw a dread mark in center
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
    setAggression(0)
    resetGhost()
    arSessionRef.current?.hideGhost()
    placedForRef.current = null
    audioRef.current.setPresence(false, 0)
  }

  const modeLabel =
    arMode === 'checking'
      ? 'PROBING…'
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
            stand where it shouldn’t. Capture it before it notices you
            hesitating.
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
          </ul>
          <button type="button" className="btn capture-btn boot-go" onClick={() => void startExperience()}>
            Open the lens
          </button>
          {modelError && <p className="warn">{modelError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="app-root">
      <canvas
        ref={xrCanvasRef}
        className={`xr-canvas ${arRunning ? 'active' : ''}`}
      />

      {useFallbackCam && (
        <FallbackLens
          videoRefAttach={camera.attach}
          videoReady={camera.ready}
          ghostVisible={ghostShouldShow || fleeing}
          ghostTarget={sustainedTarget ?? lastTargetRef.current}
          fleeing={fleeing}
          aggression={aggression}
          onVideoEl={onVideoEl}
        />
      )}

      {arRunning && ghostShouldShow && (
        <div className="ar-threat-flash" style={{ opacity: aggression * 0.35 }} />
      )}

      <Hud
        modeLabel={modeLabel}
        detection={detection}
        sustained={sustainedTarget}
        ghostVisible={ghostShouldShow}
        anchored={anchored}
        modelReady={modelReady}
        loadingMsg={loadingMsg}
        captureDisabled={!ghostShouldShow || !sustainedTarget}
        onCapture={capture}
        onOpenGallery={() => setGalleryOpen(true)}
        captureCount={captures.length}
        onStartAr={arMode === 'webxr' && !arRunning ? () => void startWebXr() : undefined}
        arRunning={arRunning}
        statusLine={statusLine || (camera.error ?? undefined)}
      />

      <Gallery
        captures={captures}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  )
}
