import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { checkWebXrAr, GhostArSession } from './ar/GhostArSession'
import { DreadAudio } from './audio/dreadAudio'
import {
  bpmFromState,
  easedProximity,
  isMelee,
  MAX_HEALTH,
  proximityFromElapsed,
  tensionFor,
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
  hasCompletePolaroidSet,
  hasDemonCapture,
  loadPolaroids,
  polaroidsForRitual,
  savePolaroids,
  uniqueTargetTypes,
} from './inventory/polaroidStore'
import { pickLore } from './lore/spiritLore'
import {
  favorForCapture,
  getItemDef,
  itemStrengthVs,
  loadFavor,
  loadOwnedItems,
  saveFavor,
  saveOwnedItems,
  type OccultItemId,
} from './shop/favorStore'
import {
  clueForLabel,
  findClueById,
  loadHeardClues,
  saveHeardClues,
  STRANGER_CLUES,
  type StrangerClue,
} from './shop/strangerClues'
import { UndertakerCounter } from './shop/UndertakerCounter'
import { StrangerVignette } from './components/StrangerVignette'
import { WhisperJournal } from './components/WhisperJournal'
import { RelicsJournal } from './components/RelicsJournal'
import { DemonFinale } from './components/DemonFinale'
import {
  EpilogueStranger,
  EndTitleCard,
  type EpilogueChoice,
} from './components/EpilogueStranger'
import {
  loadHeardVoiceHints,
  pickVoiceHint,
  saveHeardVoiceHints,
  type VoiceHint,
} from './lore/voiceHints'
import {
  collectibleForLabel,
  findCollectible,
  loadUnlockedCollectibles,
  saveUnlockedCollectibles,
  type LoreCollectible,
} from './lore/collectibles'
import {
  BOSS_UNLOCK_UNIQUE,
  capturePhasesFor,
  isMultiSealKind,
  TRIAL_TRIGGER_LABEL,
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

function readForcePlayground(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('forcePlayground') === '1') return true
    return localStorage.getItem('ghost-lens-force-playground') === '1'
  } catch {
    return false
  }
}

function readForceCollectible(): string | null {
  try {
    const q = new URLSearchParams(window.location.search)
    const id = q.get('forceCollectible')
    if (id && id.length > 0) return id
    return localStorage.getItem('ghost-lens-force-collectible')
  } catch {
    return null
  }
}

function readForceVoiceHint(): string | null {
  try {
    const q = new URLSearchParams(window.location.search)
    const id = q.get('forceVoiceHint')
    if (id && id.length > 0) return id
    return localStorage.getItem('ghost-lens-force-voice')
  } catch {
    return null
  }
}

function readForceTrial(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('forceTrial') === '1') return true
    return localStorage.getItem('ghost-lens-force-trial') === '1'
  } catch {
    return false
  }
}

function readForceDemonWin(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    return q.get('forceDemonWin') === '1'
  } catch {
    return false
  }
}

function readForceEpilogue(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    return q.get('forceEpilogue') === '1'
  } catch {
    return false
  }
}

function readForceStranger(): string | null {
  try {
    const q = new URLSearchParams(window.location.search)
    const id = q.get('forceStranger')
    if (id && id.length > 0) return id
    return localStorage.getItem('ghost-lens-force-stranger')
  } catch {
    return null
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
  const [shopOpen, setShopOpen] = useState(false)
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
  const [forcePlayground, setForcePlayground] = useState(readForcePlayground)
  const [forceTrial, setForceTrial] = useState(readForceTrial)
  const [playgroundArrived, setPlaygroundArrived] = useState(false)
  const [finaleActive, setFinaleActive] = useState(false)
  const [finalePolaroidUrl, setFinalePolaroidUrl] = useState<string | null>(null)
  const [epilogueOpen, setEpilogueOpen] = useState(false)
  const [endCardOpen, setEndCardOpen] = useState(false)
  const [epilogueRefused, setEpilogueRefused] = useState(false)
  const [postGame, setPostGame] = useState(false)
  const [cinematicLock, setCinematicLock] = useState(false)
  const trialOnboardedRef = useRef(
    (() => {
      try {
        return localStorage.getItem('ghost-lens-trial-onboarded') === '1'
      } catch {
        return false
      }
    })(),
  )
  const [activeKind, setActiveKind] = useState<SpiritKind | null>(null)
  const [capturePhase, setCapturePhase] = useState(0)
  const [capturing, setCapturing] = useState(false)
  const [favor, setFavor] = useState(() => loadFavor())
  const [ownedItems, setOwnedItems] = useState<OccultItemId[]>(() => loadOwnedItems())
  const [equippedItem, setEquippedItem] = useState<OccultItemId | null>(null)
  const [itemSpentThisFight, setItemSpentThisFight] = useState(false)
  const [heardClues, setHeardClues] = useState<Set<string>>(() => loadHeardClues())
  const [activeClue, setActiveClue] = useState<StrangerClue | null>(null)
  const [heardVoiceHints, setHeardVoiceHints] = useState<Set<string>>(() =>
    loadHeardVoiceHints(),
  )
  const [activeVoice, setActiveVoice] = useState<VoiceHint | null>(null)
  const [journalOpen, setJournalOpen] = useState(false)
  const [relicsOpen, setRelicsOpen] = useState(false)
  const [unlockedCollectibles, setUnlockedCollectibles] = useState<Set<string>>(
    () => loadUnlockedCollectibles(),
  )
  const [collectibleToast, setCollectibleToast] = useState<string | null>(null)
  const voiceQueuedRef = useRef(false)

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
  const hushUntilRef = useRef(0)
  const drainHaltUntilRef = useRef(0)
  const approachSlowUntilRef = useRef(0)

  const dusk = useDuskGate()

  const uniqueSealed = useMemo(
    () => uniqueTargetTypes(captures).size,
    [captures],
  )
  const bossDefeated = useMemo(() => hasBossCapture(captures), [captures])
  const demonDefeated = useMemo(() => hasDemonCapture(captures), [captures])
  const polaroidSetComplete = useMemo(
    () => hasCompletePolaroidSet(captures),
    [captures],
  )
  const bossUnlocked =
    forceBoss || uniqueSealed >= BOSS_UNLOCK_UNIQUE
  const playgroundUnlocked =
    forcePlayground || polaroidSetComplete || uniqueSealed >= BOSS_UNLOCK_UNIQUE
  const ritualPolaroids = useMemo(() => polaroidsForRitual(captures), [captures])

  useEffect(() => {
    savePolaroids(captures)
  }, [captures])

  useEffect(() => {
    saveFavor(favor)
  }, [favor])

  useEffect(() => {
    saveOwnedItems(ownedItems)
  }, [ownedItems])

  useEffect(() => {
    saveHeardClues(heardClues)
  }, [heardClues])

  useEffect(() => {
    saveHeardVoiceHints(heardVoiceHints)
  }, [heardVoiceHints])

  useEffect(() => {
    saveUnlockedCollectibles(unlockedCollectibles)
  }, [unlockedCollectibles])

  useEffect(() => {
    activeKindRef.current = activeKind
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
    sustainedPlayground,
    sustainedStrangerLabel,
    sustainedCollectibleLabel,
    sustainedTrial,
    classifyFrame,
    resetGhost,
    forceManifest,
    forceTrialManifest,
    clearSustainedStranger,
    clearSustainedCollectible,
  } = useClassifier()

  const atPlayground =
    forcePlayground || playgroundArrived || (playgroundUnlocked && sustainedPlayground)

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
    (detected: TargetType | null, trial = false): SpiritKind | null => {
      // Endgame demon takes priority when at playground and unlocked
      if (
        playgroundUnlocked &&
        !demonDefeated &&
        (forcePlayground || playgroundArrived || sustainedPlayground)
      ) {
        return 'demon'
      }
      // Main targets can become Warden; trial never upgrades to boss
      if (detected && bossUnlocked && !bossDefeated) return 'boss'
      if (detected) return detected
      if (trial || forceTrial) return 'trial'
      return null
    },
    [
      playgroundUnlocked,
      demonDefeated,
      forcePlayground,
      playgroundArrived,
      sustainedPlayground,
      bossUnlocked,
      bossDefeated,
      forceTrial,
    ],
  )

  // Force-manifest demon when arrived/forced without needing a spirit target
  useEffect(() => {
    if (!started || dead || !dusk.allowed) return
    if (!playgroundUnlocked || demonDefeated) return
    if (!(forcePlayground || playgroundArrived || sustainedPlayground)) return
    if (ghostShouldShow && activeKindRef.current === 'demon') return
    // If CLIP already showing something, resolveEncounterKind will upgrade it.
    // If not, force a demon manifestation for reliability.
    if (!ghostShouldShow && (forcePlayground || playgroundArrived)) {
      forceManifest()
      lastTargetRef.current = lastTargetRef.current ?? 'doll'
      if (appearAtRef.current === null) {
        appearAtRef.current = performance.now()
        setActiveKind('demon')
        setAggression(0)
        setProximity(0)
        setCapturePhase(0)
        capturePhaseRef.current = 0
        meleeEnteredAtRef.current = null
        lastHitAtRef.current = 0
        setItemSpentThisFight(false)
        setStatusLine('The Empty Seat waits. Burn the photographs into the seal.')
      }
    }
  }, [
    started,
    dead,
    dusk.allowed,
    playgroundUnlocked,
    demonDefeated,
    forcePlayground,
    playgroundArrived,
    sustainedPlayground,
    ghostShouldShow,
    forceManifest,
  ])

  // Force-manifest trial lesser echo for testing
  useEffect(() => {
    if (!started || dead || !dusk.allowed) return
    if (!forceTrial) return
    if (finaleActive || epilogueOpen || endCardOpen || cinematicLock) return
    if (ghostShouldShow && activeKindRef.current === 'trial') return
    if (playgroundUnlocked && !demonDefeated && (forcePlayground || playgroundArrived)) return
    forceTrialManifest()
    if (appearAtRef.current === null || activeKindRef.current !== 'trial') {
      appearAtRef.current = performance.now()
      setActiveKind('trial')
      setAggression(0)
      setProximity(0)
      setCapturePhase(0)
      capturePhaseRef.current = 0
      meleeEnteredAtRef.current = null
      lastHitAtRef.current = 0
      setItemSpentThisFight(false)
      if (!trialOnboardedRef.current) {
        trialOnboardedRef.current = true
        try {
          localStorage.setItem('ghost-lens-trial-onboarded', '1')
        } catch {
          /* ignore */
        }
        setStatusLine('A thin one. The lens alone will hold it.')
      } else {
        setStatusLine('Lesser echo — trial. Capture with the lens alone.')
      }
    }
  }, [
    started,
    dead,
    dusk.allowed,
    forceTrial,
    forceTrialManifest,
    ghostShouldShow,
    finaleActive,
    epilogueOpen,
    endCardOpen,
    cinematicLock,
    playgroundUnlocked,
    demonDefeated,
    forcePlayground,
    playgroundArrived,
  ])

  // Dev: skip fight and play finale cinematic only
  useEffect(() => {
    if (!started || finaleActive || epilogueOpen) return
    if (!readForceDemonWin()) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('forceDemonWin')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setCinematicLock(true)
    setFinalePolaroidUrl(null)
    setFinaleActive(true)
    void audioRef.current.ensure().then(() => audioRef.current.playDemonFinale())
    if (arRunning && arSessionRef.current) {
      arSessionRef.current.playDemonFinale(null)
    }
    setStatusLine('Force demon win — finale.')
  }, [started, finaleActive, epilogueOpen, arRunning])

  // Dev: skip to Keller epilogue
  useEffect(() => {
    if (!started || epilogueOpen || endCardOpen) return
    if (!readForceEpilogue()) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('forceEpilogue')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setCinematicLock(true)
    setEpilogueOpen(true)
  }, [started, epilogueOpen, endCardOpen])

  // Manifest / flee
  useEffect(() => {
    if (!started || dead || !dusk.allowed) return

    const demonSite =
      playgroundUnlocked &&
      !demonDefeated &&
      (forcePlayground || playgroundArrived || sustainedPlayground)

    if (cinematicLock || finaleActive || epilogueOpen) return

    const show =
      ghostShouldShow ||
      sustainedTrial ||
      forceTrial ||
      (demonSite && (forcePlayground || playgroundArrived) && activeKindRef.current === 'demon')

    if (show && (sustainedTarget || sustainedTrial || forceTrial || demonSite)) {
      setFleeing(false)
      const kind =
        resolveEncounterKind(sustainedTarget, sustainedTrial || forceTrial) ??
        (demonSite ? 'demon' : null)
      if (!kind) return

      if (
        appearAtRef.current === null ||
        (sustainedTarget && lastTargetRef.current !== sustainedTarget) ||
        activeKindRef.current !== kind
      ) {
        appearAtRef.current = performance.now()
        if (sustainedTarget) lastTargetRef.current = sustainedTarget
        setActiveKind(kind)
        setAggression(0)
        setProximity(0)
        setCapturePhase(0)
        capturePhaseRef.current = 0
        meleeEnteredAtRef.current = null
        lastHitAtRef.current = 0
        setItemSpentThisFight(false)
        hushUntilRef.current = 0
        drainHaltUntilRef.current = 0
        approachSlowUntilRef.current = 0
        if (kind === 'demon') {
          setStatusLine('The Empty Seat answers. Burn the photographs into the seal.')
        } else if (kind === 'boss') {
          setStatusLine('The Threshold Warden answers. Seal it in phases.')
        } else if (kind === 'trial') {
          if (!trialOnboardedRef.current) {
            trialOnboardedRef.current = true
            try {
              localStorage.setItem('ghost-lens-trial-onboarded', '1')
            } catch {
              /* ignore */
            }
            setStatusLine('A thin one. The lens alone will hold it.')
          } else {
            setStatusLine('Lesser echo — trial. The lens alone will hold it.')
          }
        }
      }

      if (arRunning && arSessionRef.current) {
        if (placedForRef.current !== kind) {
          arSessionRef.current.requestPlace(kind)
          placedForRef.current = kind
          if (kind === 'demon') {
            setStatusLine('Anchoring on the playground ground…')
          } else if (kind === 'trial') {
            setStatusLine(`Something thin near the ${TRIAL_TRIGGER_LABEL}…`)
          } else if (kind !== 'boss') {
            setStatusLine(`Something wrong near the ${sustainedTarget}…`)
          }
        }
        arSessionRef.current.setAggression(aggression)
        arSessionRef.current.setProximity(proximity)
      }

      void audioRef.current.ensure().then(() => {
        audioRef.current.setPresence(true, Math.max(aggression, proximity))
      })
    } else if (appearAtRef.current !== null && !demonSite) {
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
        playgroundUnlocked && !demonDefeated && !atPlayground
          ? 'Bring the photographs to the playground.'
          : bossUnlocked && !bossDefeated
            ? 'The Warden slipped the frame. It will return.'
            : 'It slipped away.',
      )
      setTimeout(() => setFleeing(false), 900)
    }
  }, [
    ghostShouldShow,
    sustainedTarget,
    sustainedTrial,
    forceTrial,
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
    playgroundUnlocked,
    demonDefeated,
    forcePlayground,
    playgroundArrived,
    sustainedPlayground,
    atPlayground,
    cinematicLock,
    finaleActive,
    epilogueOpen,
  ])

  // Approach + health + hits tick
  useEffect(() => {
    const kindNow = activeKindRef.current
    const showing =
      !cinematicLock &&
      (ghostShouldShow ||
        sustainedTrial ||
        forceTrial ||
        (kindNow === 'demon' &&
          (forcePlayground || playgroundArrived || sustainedPlayground)))

    if (!showing || !appearAtRef.current || dead || !dusk.allowed) {
      if (!showing) {
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

      const kind = activeKindRef.current
      const profile: TensionProfile = tensionFor(kind)
      let elapsed = now - appearAtRef.current
      if (now < approachSlowUntilRef.current) {
        // Iron nail: approach clock crawls
        elapsed *= 0.45
      }
      const raw = proximityFromElapsed(elapsed, profile.approachMs)
      const prox = easedProximity(raw)
      const agg = Math.min(1, elapsed / profile.approachMs)
      setProximity(prox)
      setAggression(agg)
      arSessionRef.current?.setAggression(agg)
      arSessionRef.current?.setProximity(prox)
      audioRef.current.setPresence(true, Math.max(agg, prox))

      let h = healthRef.current
      if (now >= drainHaltUntilRef.current) {
        const drain =
          profile.passiveDrainPerSec * (0.25 + prox * 1.1) * dt
        h = Math.max(0, h - drain)
      }

      if (isMelee(prox)) {
        if (meleeEnteredAtRef.current === null) {
          meleeEnteredAtRef.current = now
          setStatusLine(
            kind === 'demon'
              ? 'Empty seats — keep the ritual!'
              : kind === 'boss'
                ? 'The Warden is on you — keep sealing!'
                : kind === 'trial'
                  ? 'Thin — but still Capture.'
                  : 'It’s on you — Capture!',
          )
        }
        const hushActive = now < hushUntilRef.current
        const sinceMelee = now - meleeEnteredAtRef.current
        const sinceHit = now - lastHitAtRef.current
        const ready =
          !hushActive &&
          sinceMelee >= profile.firstHitDelayMs &&
          (lastHitAtRef.current === 0 || sinceHit >= profile.hitIntervalMs)
        if (ready) {
          lastHitAtRef.current = now
          h = Math.max(0, h - profile.hitDamage)
          setHitFlash(true)
          setStunned(true)
          audioRef.current.playHit()
          setStatusLine(
            kind === 'demon'
              ? 'Chains in your chest. The seat is empty and on you.'
              : kind === 'boss'
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
          kind === 'demon'
            ? 'Ritual faster. The playground does not wait.'
            : kind === 'boss'
              ? 'Seal faster. It does not hesitate.'
              : 'It’s closing in. Capture it.',
        )
      } else if (prox > 0.35 && prox <= 0.7 && kind !== 'boss' && kind !== 'demon') {
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
  }, [
    ghostShouldShow,
    sustainedTrial,
    forceTrial,
    dead,
    dusk.allowed,
    resetGhost,
    forcePlayground,
    playgroundArrived,
    sustainedPlayground,
    cinematicLock,
  ])

  // Announce unlocks
  const unlockedAnnounced = useRef(false)
  const playgroundAnnounced = useRef(false)
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

    if (
      playgroundUnlocked &&
      !demonDefeated &&
      !playgroundAnnounced.current
    ) {
      playgroundAnnounced.current = true
      setStatusLine(
        forcePlayground
          ? 'Force playground armed — the Demon waits on the grounds.'
          : 'Bring the photographs to the playground.',
      )
    }
    if (demonDefeated) playgroundAnnounced.current = true
  }, [
    bossUnlocked,
    bossDefeated,
    started,
    forceBoss,
    playgroundUnlocked,
    demonDefeated,
    forcePlayground,
  ])

  // Mysterious strangers — sustained non-ghost props whisper clues once
  useEffect(() => {
    if (!started || dead || !dusk.allowed || activeClue) return
    if (!sustainedStrangerLabel) return
    // Don't interrupt an active fight
    if (activeKindRef.current && (ghostShouldShow || appearAtRef.current)) return
    const clue = clueForLabel(sustainedStrangerLabel, heardClues)
    if (clue) {
      setActiveClue(clue)
      clearSustainedStranger()
    }
  }, [
    started,
    dead,
    dusk.allowed,
    sustainedStrangerLabel,
    heardClues,
    activeClue,
    ghostShouldShow,
    clearSustainedStranger,
  ])

  // Dev: force a stranger vignette once on boot
  useEffect(() => {
    if (!started || activeClue) return
    const forced = readForceStranger()
    if (!forced) return
    const clue =
      forced === '1'
        ? STRANGER_CLUES.find((c) => !heardClues.has(c.id)) ?? STRANGER_CLUES[0]
        : findClueById(forced)
    if (clue) setActiveClue(clue)
    // one-shot
    try {
      localStorage.removeItem('ghost-lens-force-stranger')
      const url = new URL(window.location.href)
      if (url.searchParams.has('forceStranger')) {
        url.searchParams.delete('forceStranger')
        window.history.replaceState({}, '', url.toString())
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])



  // Hidden lore collectibles — sustained ghost-tied props unlock once
  useEffect(() => {
    if (!started || dead || !dusk.allowed) return

    const unlock = (c: LoreCollectible) => {
      if (unlockedCollectibles.has(c.id)) return
      setUnlockedCollectibles((prev) => {
        const next = new Set(prev)
        next.add(c.id)
        return next
      })
      setCollectibleToast(c.toast)
      window.setTimeout(() => setCollectibleToast(null), 4200)
      clearSustainedCollectible()
    }

    const forced = readForceCollectible()
    if (forced) {
      const c =
        forced === '1'
          ? findCollectible('wilted_offering')
          : findCollectible(forced)
      if (c && !unlockedCollectibles.has(c.id)) {
        unlock(c)
        try {
          localStorage.removeItem('ghost-lens-force-collectible')
          const url = new URL(window.location.href)
          if (url.searchParams.has('forceCollectible')) {
            url.searchParams.delete('forceCollectible')
            window.history.replaceState({}, '', url.toString())
          }
        } catch {
          /* ignore */
        }
      }
      return
    }

    if (!sustainedCollectibleLabel) return
    // Prefer not to interrupt demon/boss mid-fight
    if (
      activeKindRef.current === 'demon' ||
      activeKindRef.current === 'boss'
    ) {
      return
    }
    const c = collectibleForLabel(sustainedCollectibleLabel, unlockedCollectibles)
    if (c) unlock(c)
  }, [
    started,
    dead,
    dusk.allowed,
    sustainedCollectibleLabel,
    unlockedCollectibles,
    clearSustainedCollectible,
  ])

  // Disembodied voices — rare when/where hints (after first capture or on dusk hunt)
  useEffect(() => {
    if (!started || !dusk.allowed || dead || activeVoice || activeClue) return
    const forced = readForceVoiceHint()
    const hasCapture = captures.length > 0
    if (!forced && !hasCapture && !voiceQueuedRef.current) {
      // On dusk enter without captures: small chance after delay
    }
    if (!forced && voiceQueuedRef.current && !hasCapture) return

    const tryQueue = (forceId: string | null) => {
      const hint = pickVoiceHint(heardVoiceHints, forceId)
      if (!hint) return
      if (!forceId && heardVoiceHints.has(hint.id)) return
      // Rare unless forced
      if (!forceId && Math.random() > 0.42 && voiceQueuedRef.current) return
      voiceQueuedRef.current = true
      setActiveVoice(hint)
      void audioRef.current.ensure().then(() => {
        audioRef.current.playWhisperHint()
      })
      if (forceId) {
        try {
          localStorage.removeItem('ghost-lens-force-voice')
          const url = new URL(window.location.href)
          if (url.searchParams.has('forceVoiceHint')) {
            url.searchParams.delete('forceVoiceHint')
            window.history.replaceState({}, '', url.toString())
          }
        } catch {
          /* ignore */
        }
      }
    }

    if (forced) {
      tryQueue(forced)
      return
    }

    // After first polaroid: queue a hint once
    if (hasCapture && !voiceQueuedRef.current) {
      const t = window.setTimeout(() => tryQueue(null), 2800 + Math.random() * 2200)
      return () => clearTimeout(t)
    }

    // Periodic rare voice while hunting at dusk (unheard only)
    if (hasCapture && heardVoiceHints.size < 5) {
      const t = window.setTimeout(() => {
        if (Math.random() < 0.28) tryQueue(null)
      }, 45000 + Math.random() * 40000)
      return () => clearTimeout(t)
    }
  }, [
    started,
    dusk.allowed,
    dead,
    captures.length,
    activeVoice,
    activeClue,
    heardVoiceHints,
  ])

  const dismissVoice = () => {
    if (activeVoice) {
      setHeardVoiceHints((prev) => {
        const next = new Set(prev)
        next.add(activeVoice.id)
        return next
      })
      setStatusLine('A voice fades. Check the whisper journal.')
    }
    setActiveVoice(null)
  }

  const dismissStranger = () => {
    if (activeClue) {
      setHeardClues((prev) => {
        const next = new Set(prev)
        next.add(activeClue.id)
        return next
      })
      setStatusLine('A stranger’s words linger.')
    }
    setActiveClue(null)
  }

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
            target === 'demon'
              ? 'Anchored. The Empty Seat is on the grounds.'
              : target === 'boss'
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
          if (kind === 'demon') {
            ctx.fillStyle = '#0c0808'
            ctx.beginPath()
            ctx.ellipse(0, 10, 70, 130, 0.02, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = '#5a3030'
          } else if (kind === 'boss') {
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
      isDemon: kind === 'demon',
      isTrial: kind === 'trial',
    }
    setCaptures((c) => [cap, ...c])

    const earned = favorForCapture(kind)
    setFavor((f) => f + earned)

    const profile = tensionFor(kind)
    setStatusLine(
      kind === 'demon'
        ? `Sealed: ${lorePick.name}. The ground remembers. (+${earned} Favor)`
        : kind === 'boss'
          ? `Sealed: ${lorePick.name}. The threshold goes quiet. (+${earned} Favor)`
          : kind === 'trial'
            ? `Trial sealed — ${lorePick.name}. Lesser echo. (+${earned} Favor)`
            : `Polaroid sealed — ${lorePick.name}. (+${earned} Favor)`,
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

    if (kind !== 'boss' && kind !== 'demon' && kind !== 'trial') {
      const nextUnique = uniqueTargetTypes([cap, ...captures]).size
      if (nextUnique >= BOSS_UNLOCK_UNIQUE && !hasBossCapture([cap, ...captures])) {
        window.setTimeout(() => {
          setStatusLine('All four sealed. Something worse is listening.')
        }, 1200)
      }
      if (
        hasCompletePolaroidSet([cap, ...captures]) &&
        !hasDemonCapture([cap, ...captures])
      ) {
        window.setTimeout(() => {
          setStatusLine('Bring the photographs to the playground.')
        }, 2200)
      }
    }

    // Big endgame climax after demon seal
    if (kind === 'demon') {
      setCinematicLock(true)
      setFinalePolaroidUrl(polaroidUrl)
      setFinaleActive(true)
      void audioRef.current.ensure().then(() => audioRef.current.playDemonFinale())
      if (arRunning && arSessionRef.current) {
        arSessionRef.current.playDemonFinale(polaroidUrl)
      }
    }
  }

  const capture = () => {
    if (cinematicLock || finaleActive || epilogueOpen) return
    const kind = activeKindRef.current
    const demonShowing =
      kind === 'demon' &&
      (forcePlayground || playgroundArrived || sustainedPlayground || ghostShouldShow)
    const trialShowing =
      kind === 'trial' && (sustainedTrial || forceTrial || ghostShouldShow)
    if (
      (!sustainedTarget && !demonShowing && !trialShowing) ||
      (!ghostShouldShow && !demonShowing && !trialShowing) ||
      dead ||
      !dusk.allowed ||
      capturing
    )
      return
    if (!kind) return

    if (isMultiSealKind(kind)) {
      const phases = capturePhasesFor(kind)
      const phase = capturePhaseRef.current
      if (phase < phases - 1) {
        const next = phase + 1
        capturePhaseRef.current = next
        setCapturePhase(next)
        const profile = tensionFor(kind)
        if (appearAtRef.current != null && profile.phaseKnockback > 0) {
          const now = performance.now()
          const elapsed = now - appearAtRef.current
          const newElapsed = Math.max(
            0,
            elapsed - profile.phaseKnockback * profile.approachMs,
          )
          appearAtRef.current = now - newElapsed
        }
        meleeEnteredAtRef.current = null
        if (kind === 'demon') {
          const labels = [
            'First photograph burns into the seal.',
            'Second photograph — the chains tighten.',
            'Third — an empty seat remembers you.',
            'Fourth — one more and the grounds go quiet.',
          ]
          setStatusLine(labels[Math.min(next - 1, labels.length - 1)])
        } else {
          setStatusLine(
            next === 1
              ? 'First seal holds — keep the frame.'
              : 'Second seal holds — one more.',
          )
        }
        audioRef.current.playHit()
        return
      }
    }

    setCapturing(true)
    void finishCapture(kind).finally(() => setCapturing(false))
  }

  const useEquippedItem = () => {
    if (!equippedItem || itemSpentThisFight || !activeKindRef.current) return
    const def = getItemDef(equippedItem)
    if (!def) return
    const kind = activeKindRef.current
    const strength = itemStrengthVs(equippedItem, kind)
    setItemSpentThisFight(true)
    const now = performance.now()

    if (strength === 'weak') {
      // Wrong tool — nearly useless
      if (appearAtRef.current != null) {
        const elapsed = now - appearAtRef.current
        const profile = tensionFor(kind)
        const newElapsed = Math.max(0, elapsed - 0.06 * profile.approachMs)
        appearAtRef.current = now - newElapsed
      }
      setStatusLine(
        kind === 'boss'
          ? `${def.name} barely troubles the Warden. Wrong measure.`
          : `${def.name} does little. This hunger wants a different remedy.`,
      )
      audioRef.current.playHit()
      setEquippedItem(null)
      return
    }

    // Strong matchup
    if (equippedItem === 'salt_line') {
      if (appearAtRef.current != null) {
        const elapsed = now - appearAtRef.current
        const profile = tensionFor(kind)
        const newElapsed = Math.max(0, elapsed - 0.5 * profile.approachMs)
        appearAtRef.current = now - newElapsed
      }
      meleeEnteredAtRef.current = null
      setStatusLine('Salt line poured. The wet thing recoils from the border.')
    } else if (equippedItem === 'iron_nail') {
      approachSlowUntilRef.current = now + 4000
      if (appearAtRef.current != null) {
        const elapsed = now - appearAtRef.current
        const profile = tensionFor(kind)
        appearAtRef.current = now - Math.max(0, elapsed - 0.2 * profile.approachMs)
      }
      meleeEnteredAtRef.current = null
      setStunned(true)
      window.setTimeout(() => setStunned(false), 700)
      setStatusLine('Iron nail driven. The dirt-hunger staggers.')
    } else if (equippedItem === 'silver_mirror') {
      const healed = Math.min(MAX_HEALTH, healthRef.current + 0.4)
      healthRef.current = healed
      setHealth(healed)
      drainHaltUntilRef.current = now + 3200
      setStatusLine('Silver mirror raised. Vacant eyes flinch — calm returns.')
    } else if (equippedItem === 'hush_charm') {
      hushUntilRef.current = now + 4500
      setStatusLine('Hush charm warm. The vow falls silent awhile.')
    } else if (equippedItem === 'black_crepe') {
      if (appearAtRef.current != null) {
        const elapsed = now - appearAtRef.current
        const profile = tensionFor(kind)
        const newElapsed = Math.max(0, elapsed - 0.55 * profile.approachMs)
        appearAtRef.current = now - newElapsed
      }
      meleeEnteredAtRef.current = null
      hushUntilRef.current = now + 2500
      // Advance ritual phase as the crepe bites
      const phases = capturePhasesFor(kind)
      if (kind === 'demon' && capturePhaseRef.current < phases - 1) {
        const next = capturePhaseRef.current + 1
        capturePhaseRef.current = next
        setCapturePhase(next)
      }
      setStatusLine('Black crepe pinned. The Empty Seat knows its name.')
    }
    audioRef.current.playHit()
    setEquippedItem(null)
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

  const toggleForcePlayground = () => {
    const next = !forcePlayground
    setForcePlayground(next)
    if (next) setPlaygroundArrived(true)
    try {
      localStorage.setItem('ghost-lens-force-playground', next ? '1' : '0')
      const url = new URL(window.location.href)
      if (next) url.searchParams.set('forcePlayground', '1')
      else url.searchParams.delete('forcePlayground')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setStatusLine(
      next
        ? 'Force playground ON — Demon ready on the grounds.'
        : 'Force playground OFF.',
    )
  }

  
  const toggleForceTrial = () => {
    const next = !forceTrial
    setForceTrial(next)
    try {
      localStorage.setItem('ghost-lens-force-trial', next ? '1' : '0')
      const url = new URL(window.location.href)
      if (next) url.searchParams.set('forceTrial', '1')
      else url.searchParams.delete('forceTrial')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setStatusLine(
      next
        ? 'Force trial ON — lesser echo will manifest (chair).'
        : 'Force trial OFF.',
    )
  }

  const onFinaleComplete = useCallback(() => {
    setFinaleActive(false)
    setEpilogueOpen(true)
    setStatusLine('')
  }, [])

  const onEpilogueResolved = useCallback((choice: EpilogueChoice) => {
    setEpilogueOpen(false)
    setEpilogueRefused(choice === 'refuse')
    setEndCardOpen(true)
    setPostGame(true)
    setStatusLine(
      choice === 'refuse'
        ? 'Herr Keller tips his hat. The lens stays cold in your hands.'
        : 'Herr Keller takes the glass. The polaroids remain.',
    )
  }, [])

  const dismissEndCard = useCallback(() => {
    setEndCardOpen(false)
    setCinematicLock(false)
    setStatusLine(
      epilogueRefused
        ? 'Post-hunt quiet. The Undertaker will have opinions.'
        : 'Post-hunt quiet. The lens is gone. The photographs stay.',
    )
  }, [epilogueRefused])

  const confirmPlaygroundArrival = () => {
    setPlaygroundArrived(true)
    setStatusLine('You have arrived. The Empty Seat is listening.')
  }

  const buyItem = (id: OccultItemId) => {
    const def = getItemDef(id)
    if (!def) return
    if (ownedItems.includes(id)) return
    if (favor < def.cost) {
      setStatusLine('The undertaker waits. Favor insufficient.')
      return
    }
    setFavor((f) => f - def.cost)
    setOwnedItems((o) => [...o, id])
    setStatusLine(`Purchased: ${def.name}. Keep it close.`)
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
  const isDemon = activeKind === 'demon'
  const isTrial = activeKind === 'trial'
  const phases = capturePhasesFor(activeKind)
  const demonVisible =
    isDemon &&
    (ghostShouldShow || forcePlayground || playgroundArrived || sustainedPlayground)
  const trialVisible =
    isTrial && (ghostShouldShow || sustainedTrial || forceTrial)

  const modeLabel =
    arMode === 'checking'
      ? 'PROBING…'
      : cinematicLock || finaleActive
        ? 'FINALE'
        : epilogueOpen
          ? 'EPILOGUE'
          : !dusk.allowed
            ? 'LOCKED — DAY'
            : isDemon && demonVisible
              ? 'PLAYGROUND'
              : isBoss && ghostShouldShow
                ? 'WARDEN'
                : isTrial && trialVisible
                  ? 'TRIAL'
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
            <em>doll</em>, or <em>lake</em> — or a <em>chair</em> for a thin
            trial echo the lens alone can hold. Capture into a polaroid before
            it closes the distance. Seal all four to wake the{' '}
            <em>Threshold Warden</em>, then bring the photographs to the{' '}
            <em>playground</em>. Spend Favor at{' '}
            <em>The Undertaker&apos;s Counter</em>.
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
              {demonDefeated
                ? ' · Demon sealed'
                : playgroundUnlocked
                  ? ' · Playground unlocked'
                  : ''}
            </li>
            <li>
              Favor: {favor}
              {ownedItems.length ? ` · tools ${ownedItems.length}/5` : ''}
              {heardClues.size ? ` · clues ${heardClues.size}` : ''}
              {heardVoiceHints.size ? ` · voices ${heardVoiceHints.size}` : ''}
              {unlockedCollectibles.size ? ` · relics ${unlockedCollectibles.size}` : ''}
            </li>
            <li>
              Hunt hours: dusk only
              {dusk.status.windowLabel ? ` (${dusk.status.windowLabel} local)` : ''}
              {dusk.status.sunsetLabel && dusk.status.sunsetLabel !== 'none'
                ? ` · sunset ~${dusk.status.sunsetLabel}`
                : ''}
              {dusk.forceDusk ? ' · FORCE DUSK' : ''}
              {forceBoss ? ' · FORCE BOSS' : ''}
              {forcePlayground ? ' · FORCE PLAYGROUND' : ''}
              {forceTrial ? ' · FORCE TRIAL' : ''}
              {postGame ? ' · POST-HUNT' : ''}
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
          <button
            type="button"
            className={`btn dusk-force-btn ${forcePlayground ? 'on' : ''}`}
            onClick={toggleForcePlayground}
          >
            {forcePlayground
              ? 'Force playground (test): ON'
              : 'Force playground (test): OFF'}
          </button>
          <button
            type="button"
            className={`btn dusk-force-btn ${forceTrial ? 'on' : ''}`}
            onClick={toggleForceTrial}
          >
            {forceTrial ? 'Force trial (test): ON' : 'Force trial (test): OFF'}
          </button>
          <p className="boot-hint">
            Dev: <code>?forceDusk=1</code> · <code>?forceBoss=1</code> ·{' '}
            <code>?forcePlayground=1</code> · <code>?forceTrial=1</code> ·{' '}
            <code>?forceDemonWin=1</code> · <code>?forceEpilogue=1</code> ·{' '}
            <code>?forceStranger=1</code> · long-press title for dusk.
          </p>
          {modelError && <p className="warn">{modelError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`app-root ${hitFlash ? 'app-hit' : ''} ${stunned ? 'app-stun' : ''} ${isBoss ? 'app-boss' : ''} ${isDemon ? 'app-demon' : ''} ${isTrial ? 'app-trial' : ''} ${cinematicLock ? 'app-cinematic' : ''} ${postGame ? 'app-postgame' : ''}`}
    >
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
          ghostVisible={
            !cinematicLock && (ghostShouldShow || fleeing || demonVisible || trialVisible)
          }
          ghostTarget={activeKind ?? sustainedTarget ?? lastTargetRef.current}
          fleeing={fleeing}
          aggression={aggression}
          proximity={proximity}
          hitFlash={hitFlash}
          stunned={stunned}
          isBoss={isBoss}
          isDemon={isDemon}
          isTrial={isTrial}
          onVideoEl={onVideoEl}
        />
      )}

      {arRunning && !cinematicLock && (ghostShouldShow || demonVisible || trialVisible) && (
        <div
          className={`ar-threat-flash ${isBoss ? 'boss-flash' : ''} ${isDemon ? 'demon-flash' : ''}`}
          style={{
            opacity:
              Math.max(aggression, proximity) *
              (isDemon ? 0.65 : isBoss ? 0.55 : 0.4),
          }}
        />
      )}
      {arRunning && hitFlash && <div className="hit-overlay ar-hit" aria-hidden />}

      <DemonFinale
        active={finaleActive}
        polaroidUrl={finalePolaroidUrl}
        onComplete={onFinaleComplete}
      />
      <EpilogueStranger open={epilogueOpen} onResolved={onEpilogueResolved} />
      <EndTitleCard
        open={endCardOpen}
        refused={epilogueRefused}
        onDismiss={dismissEndCard}
      />

      {!cinematicLock && (
      <Hud
        modeLabel={modeLabel}
        detection={detection}
        sustained={sustainedTarget}
        ghostVisible={ghostShouldShow || demonVisible || trialVisible}
        anchored={anchored}
        modelReady={modelReady}
        loadingMsg={loadingMsg}
        captureDisabled={
          !dusk.allowed ||
          !(ghostShouldShow || demonVisible || trialVisible) ||
          (!sustainedTarget && !demonVisible && !trialVisible) ||
          dead ||
          capturing
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
        isBoss={isBoss && (ghostShouldShow || false)}
        isDemon={demonVisible}
        isTrial={trialVisible}
        capturePhase={capturePhase}
        capturePhases={phases}
        uniqueSealed={uniqueSealed}
        bossUnlocked={bossUnlocked && !bossDefeated}
        playgroundUnlocked={playgroundUnlocked && !demonDefeated}
        playgroundReady={atPlayground}
        demonDefeated={demonDefeated}
        ritualPolaroids={isDemon ? ritualPolaroids : []}
        showArrivePlayground={
          playgroundUnlocked &&
          !demonDefeated &&
          !atPlayground &&
          dusk.allowed
        }
        onArrivePlayground={confirmPlaygroundArrival}
      />
      )}

      {/* Favor + shop + tool use strip */}
      {!cinematicLock && (
      <div className="favor-strip">
        <button
          type="button"
          className="btn undertaker-open-btn"
          onClick={() => setShopOpen(true)}
        >
          Undertaker · {favor} Favor
        </button>
        <button
          type="button"
          className="btn journal-open-btn"
          onClick={() => setJournalOpen(true)}
        >
          Whispers · {heardVoiceHints.size + heardClues.size}
        </button>
        <button
          type="button"
          className="btn relics-open-btn"
          onClick={() => setRelicsOpen(true)}
        >
          Relics · {unlockedCollectibles.size}
        </button>
        {equippedItem && (ghostShouldShow || demonVisible) && !itemSpentThisFight && (
          <button
            type="button"
            className="btn use-tool-btn"
            onClick={useEquippedItem}
          >
            Use {getItemDef(equippedItem)?.name}
          </button>
        )}
      </div>
      )}

      {!cinematicLock && (
      <button
        type="button"
        className="brand-longpress"
        aria-label="Long-press for force dusk test"
        onPointerDown={onBrandPointerDown}
        onPointerUp={onBrandPointerUp}
        onPointerLeave={onBrandPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      )}

      <Gallery
        captures={captures}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        uniqueCount={uniqueSealed}
        bossUnlocked={bossUnlocked}
        bossDefeated={bossDefeated}
        playgroundUnlocked={playgroundUnlocked}
        demonDefeated={demonDefeated}
      />

      <UndertakerCounter
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        favor={favor}
        owned={ownedItems}
        onBuy={buyItem}
        equipped={equippedItem}
        onEquip={setEquippedItem}
        postGame={postGame}
        lensReturned={postGame && !epilogueRefused}
      />

      {activeVoice && (
        <div className="voice-subtitle" role="status" onClick={dismissVoice}>
          <p className="voice-kicker">A VOICE WITHOUT A BODY</p>
          <p className="voice-line">&ldquo;{activeVoice.line}&rdquo;</p>
          <p className="voice-dismiss">Tap to commit to the journal</p>
        </div>
      )}

      <WhisperJournal
        open={journalOpen}
        onClose={() => setJournalOpen(false)}
        heardVoiceIds={heardVoiceHints}
        heardClueIds={heardClues}
      />

      <RelicsJournal
        open={relicsOpen}
        onClose={() => setRelicsOpen(false)}
        unlockedIds={unlockedCollectibles}
      />

      {collectibleToast && (
        <div className="collectible-toast" role="status">
          {collectibleToast}
        </div>
      )}

      <StrangerVignette clue={activeClue} onDismiss={dismissStranger} />

      {dead && <DeathScreen onRetry={retryAfterDeath} />}
    </div>
  )
}
