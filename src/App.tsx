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
import { useMoonGate } from './hooks/useMoonGate'
import { DEMON_SEAL_BLOCKED_COPY } from './moon/moonPhase'
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
  withoutDemonCaptures,
} from './inventory/polaroidStore'
import { pickLore } from './lore/spiritLore'
import {
  getItemDef,
  itemStrengthVs,
  loadInsight,
  loadEquippedItem,
  loadOwnedItems,
  saveEquippedItem,
  saveInsight,
  saveOwnedItems,
  type OccultItemId,
} from './shop/favorStore'
import {
  bootSave,
  downloadSaveFile,
  importSaveJson,
  onSaveToast,
  patchSave,
  getSave,
} from './save/gameSave'
import { isFieldAuthentic } from './save/fieldAuthenticity'
import {
  grantCatchInsight,
  grantDiscoveryInsight,
  recordFirstCatch,
} from './save/discoveryInsight'
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
import { SpookboxMaker, type SpookboxMakerChoice } from './components/SpookboxMaker'
import { SpookboxCall, ProtectorStunVfx } from './components/SpookboxCall'
import { WhisperJournal } from './components/WhisperJournal'
import { RelicsJournal } from './components/RelicsJournal'
import { DemonFinale } from './components/DemonFinale'
import {
  EpilogueStranger,
  EndTitleCard,
  type EpilogueChoice,
} from './components/EpilogueStranger'

import { WerewolfAttack } from './components/WerewolfAttack'
import { AmbientScanCard } from './components/AmbientScanCard'
import { BazaarIntro, type BazaarIntroChoice } from './components/BazaarIntro'
import { BazaarSmileEpilogue } from './components/BazaarSmileEpilogue'
import { BazaarKellerWestEpilogue } from './components/BazaarKellerWestEpilogue'
import {
  grantKellerCharm,
  hasKellerCharm,
  kellerCharmPerkActive,
  KELLER_CHARM,
  readNgPlusActive,
  spendKellerCharm,
} from './ngplus/kellerCharm'
import {
  grantSpookbox,
  hasSpookbox,
  markCharmTradedForSpookbox,
  markMetSpookboxMaker,
  readForceArchivistStun,
  readForceSpookbox,
  readForceSpookboxMaker,
  SPOOKBOX,
  SPOOKBOX_MAKER_MEET,
} from './ngplus/spookbox'
import { cipherLetterFor } from './ngplus/cipher'
import {
  ambientScanForLabel,
  loadSeenAmbientScans,
  saveSeenAmbientScans,
  readForceScan,
  AMBIENT_SCANS,
  type AmbientScanEntry,
} from './lore/ambientScans'
import {
  isSecretUnlocked,
  markSecretUnlocked,
  readForceSecretGhost,
  SECRET_GHOST,
} from './ngplus/secretGhost'
import {
  hasKeptDemonPolaroid,
  hasTrueGoodEnding,
  incrementClearCount,
  isTrueEndEligible,
  loadClearCount,
  markKellerWestEndingSeen,
  markSmileEndingSeen,
  markTrueGoodEnding,
  readForceKellerWest,
  readForceSmileEnd,
  readForceTrueEnd,
  setKeptDemonPolaroid,
  shouldPlayKellerWestEpilogue,
  shouldPlaySmileEpilogue,
} from './ngplus/progress'
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

function readForceWerewolf(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    return q.get('forceWerewolf') === '1'
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

function readForceIntro(): boolean {
  try {
    const q = new URLSearchParams(window.location.search)
    return q.get('forceIntro') === '1'
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
  const [captureFlash, setCaptureFlash] = useState(false)
  const [saveToast, setSaveToast] = useState<string | null>(null)
  const [savePanelOpen, setSavePanelOpen] = useState(false)
  const fakeOutDoneRef = useRef(false)
  const [stunned, setStunned] = useState(false)
  const [dead, setDead] = useState(false)
  const [started, setStarted] = useState(false)
  const [introOpen, setIntroOpen] = useState(() => {
    if (readForceIntro()) return true
    try {
      return !getSave().introSeen
    } catch {
      return true
    }
  })
  const [introKey, setIntroKey] = useState(0)
  const [forceBoss, setForceBoss] = useState(readForceBoss)
  const [forcePlayground, setForcePlayground] = useState(readForcePlayground)
  const [forceTrial, setForceTrial] = useState(readForceTrial)
  const [playgroundArrived, setPlaygroundArrived] = useState(false)
  const [finaleActive, setFinaleActive] = useState(false)
  const [finalePolaroidUrl, setFinalePolaroidUrl] = useState<string | null>(null)
  const [epilogueOpen, setEpilogueOpen] = useState(false)
  const [endCardOpen, setEndCardOpen] = useState(false)
  const [smileEpilogueOpen, setSmileEpilogueOpen] = useState(false)
  const [kellerWestEpilogueOpen, setKellerWestEpilogueOpen] = useState(false)
  const [epilogueRefused, setEpilogueRefused] = useState(false)
  /** True only on Return (accept) — Keller took the glass; cleared / ignored after true-good cure. */
  const [lensReturnedToKeller, setLensReturnedToKeller] = useState(false)
  const [postGame, setPostGame] = useState(false)
  const [cinematicLock, setCinematicLock] = useState(false)
  const [werewolfActive, setWerewolfActive] = useState(false)
  const [hunterDeath, setHunterDeath] = useState(false)
  const [tradeMode, setTradeMode] = useState(false)
  const [trueGoodEnd, setTrueGoodEnd] = useState(() => hasTrueGoodEnding())
  const [ngPlusActive] = useState(() => readNgPlusActive())
  // Cipher helper retained for NG+ polaroid stamps / status
  void cipherLetterFor
  const [secretUnlocked, setSecretUnlocked] = useState(() => isSecretUnlocked())
  const [spookboxOwned, setSpookboxOwned] = useState(() => {
    readForceSpookbox()
    return hasSpookbox()
  })
  const [spookboxEquipped, setSpookboxEquipped] = useState(false)
  const [makerOpen, setMakerOpen] = useState(false)
  const [hasCharm, setHasCharm] = useState(() => hasKellerCharm())
  const [spookboxCallOpen, setSpookboxCallOpen] = useState(false)
  const [archivistStunned, setArchivistStunned] = useState(false)
  const [protectorVfx, setProtectorVfx] = useState(false)
  const archivistStunnedRef = useRef(false)
  const makerShownRef = useRef(false)
  const [clearCount, setClearCount] = useState(() => loadClearCount())
  const [keptDemonPhoto, setKeptDemonPhoto] = useState(() => hasKeptDemonPolaroid())
  const [activeAmbientScan, setActiveAmbientScan] = useState<AmbientScanEntry | null>(null)
  const [seenAmbientScans, setSeenAmbientScans] = useState<Set<string>>(() => loadSeenAmbientScans())
  const ambientCooldownRef = useRef<Map<string, number>>(new Map())
  const trialOnboardedRef = useRef(
    (() => {
      try {
        return getSave().trialOnboarded
      } catch {
        return false
      }
    })(),
  )
  const [activeKind, setActiveKind] = useState<SpiritKind | null>(null)
  const [capturePhase, setCapturePhase] = useState(0)
  const [capturing, setCapturing] = useState(false)
  const [insight, setInsight] = useState(() => loadInsight())
  const [ownedItems, setOwnedItems] = useState<OccultItemId[]>(() => loadOwnedItems())
  const [equippedItem, setEquippedItem] = useState<OccultItemId | null>(() => loadEquippedItem())
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
  const moon = useMoonGate()

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
    saveInsight(insight)
  }, [insight])

  // Central save blob — migrate legacy keys, wire toast
  useEffect(() => {
    bootSave()
    setInsight(loadInsight())
    onSaveToast((msg) => {
      setSaveToast(msg)
      window.setTimeout(() => setSaveToast(null), 2200)
    })
    return () => onSaveToast(null)
  }, [])

  useEffect(() => {
    saveOwnedItems(ownedItems)
  }, [ownedItems])

  useEffect(() => {
    saveEquippedItem(equippedItem)
  }, [equippedItem])

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

  // Always show getUserMedia preview while hunting unless WebXR owns the view.
  // WebXR-capable phones used to stay on a black screen until "Enter AR".
  const useFallbackCam = started && dusk.allowed && !arRunning
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
    sustainedSecret,
    sustainedAmbientScanLabel,
    clearSustainedAmbientScan,
    sustainedSpookboxMakerLabel,
    clearSustainedSpookboxMaker,
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

  // Classification loop — only while dusk allows hunting.
  // In fallback/preview mode NEVER open a second getUserMedia (mobile often
  // steals/stops the visible camera, leaving frames empty and peak at 0%).
  useEffect(() => {
    if (!started || !modelReady || !dusk.allowed || dead) return
    let cancelled = false
    let raf = 0

    const ensureClassifyVideo = async () => {
      if (useFallbackCam) {
        const v = fallbackVideoRef.current
        if (v && v.readyState >= 2 && v.videoWidth > 0) return v
        // Wait until FallbackLens video has real frames — do not open a 2nd stream.
        return null
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
      if (vid && vid.readyState >= 2 && (vid.videoWidth || 0) > 0) {
        await classifyFrame(vid)
      }
      raf = window.setTimeout(() => void loop(), 50) as unknown as number
    }
    void loop()

    return () => {
      cancelled = true
      clearTimeout(raf)
      // Only tear down the hidden AR classify stream — not the visible fallback camera.
      if (!useFallbackCam) {
        classifyStreamRef.current?.getTracks().forEach((t) => t.stop())
        classifyStreamRef.current = null
      }
    }
  }, [started, modelReady, useFallbackCam, classifyFrame, dusk.allowed, dead, camera.ready])

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
    (detected: TargetType | null, trial = false, secret = false): SpiritKind | null => {
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
      if (ngPlusActive && (secret || readForceSecretGhost())) return 'secret'
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
      ngPlusActive,
    ],
  )

  // Force-manifest demon when arrived/forced without needing a spirit target
  useEffect(() => {
    if (!started || dead || !dusk.allowed) return
    if (cinematicLock || finaleActive || epilogueOpen || werewolfActive || smileEpilogueOpen || kellerWestEpilogueOpen || endCardOpen) return
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
        setStatusLine(
          moon.canSeal
            ? 'The Empty Seat waits. Burn the photographs into the seal.'
            : "The Empty Seat waits — but it won't take the photograph until the moon is full.",
        )
      }
    }
  }, [
    started,
    dead,
    dusk.allowed,
    cinematicLock,
    finaleActive,
    epilogueOpen,
    werewolfActive,
    smileEpilogueOpen,
    kellerWestEpilogueOpen,
    endCardOpen,
    playgroundUnlocked,
    demonDefeated,
    forcePlayground,
    playgroundArrived,
    sustainedPlayground,
    ghostShouldShow,
    forceManifest,
    moon.canSeal,
  ])

  // Force-manifest trial lesser echo for testing
  useEffect(() => {
    if (!started || dead || !dusk.allowed) return
    if (!forceTrial) return
    if (finaleActive || epilogueOpen || endCardOpen || smileEpilogueOpen || kellerWestEpilogueOpen || cinematicLock) return
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
          patchSave({ trialOnboarded: true })
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
    smileEpilogueOpen,
    kellerWestEpilogueOpen,
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
    if (!started || epilogueOpen || endCardOpen || smileEpilogueOpen || kellerWestEpilogueOpen) return
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
  }, [started, epilogueOpen, endCardOpen, smileEpilogueOpen, kellerWestEpilogueOpen])

  // Dev: force werewolf refuse path
  useEffect(() => {
    if (!started || werewolfActive || dead) return
    if (!readForceWerewolf()) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('forceWerewolf')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setCinematicLock(true)
    setWerewolfActive(true)
    if (arRunning && arSessionRef.current) {
      arSessionRef.current.playWerewolfAttack()
    }
    setStatusLine('Force werewolf — Keller refuse path.')
  }, [started, werewolfActive, dead, arRunning])

  // Dev: force true-end trade scene
  useEffect(() => {
    if (!started || epilogueOpen || endCardOpen || smileEpilogueOpen || kellerWestEpilogueOpen) return
    if (!readForceTrueEnd()) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('forceTrueEnd')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setKeptDemonPolaroid(true)
    setKeptDemonPhoto(true)
    setTradeMode(true)
    setCinematicLock(true)
    setEpilogueOpen(true)
    setStatusLine('Force true end — trade the demon polaroid.')
  }, [started, epilogueOpen, endCardOpen, smileEpilogueOpen, kellerWestEpilogueOpen])

  // Dev: force Bazaar Smile meta epilogue
  useEffect(() => {
    if (!started || smileEpilogueOpen || kellerWestEpilogueOpen || endCardOpen || epilogueOpen) return
    if (!readForceSmileEnd()) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('forceSmileEnd')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setCinematicLock(true)
    setSmileEpilogueOpen(true)
    setStatusLine('Force Smile ending — bazaar epilogue.')
  }, [started, smileEpilogueOpen, kellerWestEpilogueOpen, endCardOpen, epilogueOpen])

  // Dev: force Keller West origin epilogue
  useEffect(() => {
    if (!started || kellerWestEpilogueOpen || smileEpilogueOpen || endCardOpen || epilogueOpen) return
    if (!readForceKellerWest()) return
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('forceKellerWest')
      window.history.replaceState({}, '', url.toString())
    } catch {
      /* ignore */
    }
    setCinematicLock(true)
    setKellerWestEpilogueOpen(true)
    setStatusLine('Force Keller West ending — boom-town origin epilogue.')
  }, [started, kellerWestEpilogueOpen, smileEpilogueOpen, endCardOpen, epilogueOpen])

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
      sustainedSecret ||
      readForceSecretGhost() ||
      forceTrial ||
      (demonSite && (forcePlayground || playgroundArrived) && activeKindRef.current === 'demon')

    if (show && (sustainedTarget || sustainedTrial || sustainedSecret || readForceSecretGhost() || forceTrial || demonSite)) {
      setFleeing(false)
      const kind =
        resolveEncounterKind(sustainedTarget, sustainedTrial || forceTrial, sustainedSecret || readForceSecretGhost()) ??
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
        archivistStunnedRef.current = readForceArchivistStun()
        setArchivistStunned(archivistStunnedRef.current)
        if (kind === 'demon') {
          setStatusLine(
            moon.canSeal
              ? 'The Empty Seat answers. Burn the photographs into the seal.'
              : "The Empty Seat answers — but it won't take the photograph until the moon is full.",
          )
        } else if (kind === 'boss') {
          setStatusLine('The Threshold Warden answers. Seal it in phases.')
        } else if (kind === 'secret') {
          setStatusLine(
            `The Pale Archivist answers. ${SECRET_GHOST.epithet}. Seal in phases — Spookbox for the finish.`,
          )
        } else if (kind === 'trial') {
          if (!trialOnboardedRef.current) {
            trialOnboardedRef.current = true
            try {
              patchSave({ trialOnboarded: true })
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
    moon.canSeal,
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
      if (kellerCharmPerkActive()) {
        // Keller's Silver Charm (NG+): hungers hesitate a half-step
        elapsed *= KELLER_CHARM.approachSlowFactor
      }
      const raw = proximityFromElapsed(elapsed, profile.approachMs)
      const prox = easedProximity(raw)
      const agg = Math.min(1, elapsed / profile.approachMs)
      setProximity(prox)
      setAggression(agg)
      arSessionRef.current?.setAggression(agg)
      arSessionRef.current?.setProximity(prox)
      audioRef.current.setPresence(true, Math.max(agg, prox))
      // High hesitation: fake-out lunge before flee-or-hit
      if (
        agg > 0.62 &&
        prox > 0.35 &&
        prox < 0.82 &&
        !fakeOutDoneRef.current &&
        Math.random() < 0.08
      ) {
        fakeOutDoneRef.current = true
        arSessionRef.current?.triggerFakeOut?.()
        audioRef.current.playStinger?.()
        setStatusLine('It almost had you — keep the frame!')
      }
      // Proximity duck then spike
      audioRef.current.setProximityTension?.(prox, agg)

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
          audioRef.current.playStinger?.()
          setStatusLine(
            kind === 'demon'
              ? 'Chains in your chest. The seat is empty and on you.'
              : kind === 'boss'
                ? 'It hits like four graves at once.'
                : 'It struck. Your heart skips.',
          )
          window.setTimeout(() => setHitFlash(false), 380)
          window.setTimeout(() => setStunned(false), 520)
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




  // Spookbox Maker — dusk + workshop/garage/radio/toolbox (or force)
  useEffect(() => {
    if (!started || dead || makerOpen || activeClue || cinematicLock) return
    if (makerShownRef.current && !readForceSpookboxMaker()) return
    // Don't interrupt fights
    if (activeKindRef.current && (ghostShouldShow || appearAtRef.current)) return

    const forced = readForceSpookboxMaker()
    const placeHit = !!sustainedSpookboxMakerLabel
    if (!forced && (!dusk.allowed || !placeHit)) return

    makerShownRef.current = true
    markMetSpookboxMaker()
    setMakerOpen(true)
    setStatusLine(SPOOKBOX_MAKER_MEET.copy)
    clearSustainedSpookboxMaker()
    if (forced) {
      try {
        const url = new URL(window.location.href)
        if (url.searchParams.has('forceSpookboxMaker')) {
          url.searchParams.delete('forceSpookboxMaker')
          window.history.replaceState({}, '', url.toString())
        }
      } catch {
        /* ignore */
      }
    }
  }, [
    started,
    dead,
    dusk.allowed,
    makerOpen,
    activeClue,
    cinematicLock,
    sustainedSpookboxMakerLabel,
    ghostShouldShow,
    clearSustainedSpookboxMaker,
  ])

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
      const g = grantDiscoveryInsight('relic')
      setInsight(loadInsight())
      setCollectibleToast(
        g.field
          ? `${c.toast} (+${g.total} Insight · field)`
          : `${c.toast} (+${g.total} Insight)`,
      )
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


  // Ambient object scans — melancholy readings, no combat spawn
  useEffect(() => {
    if (!started || dead || !dusk.allowed) return
    if (cinematicLock || finaleActive || epilogueOpen || werewolfActive) return
    if (activeAmbientScan) return

    const forced = readForceScan()
    if (forced) {
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete('forceScan')
        window.history.replaceState({}, '', url.toString())
      } catch {
        /* ignore */
      }
      const entry =
        typeof forced === 'string'
          ? AMBIENT_SCANS.find((e) => e.id === forced) ?? AMBIENT_SCANS[0]
          : AMBIENT_SCANS[0]
      if (entry) {
        setActiveAmbientScan(entry)
        setSeenAmbientScans((prev) => {
          if (!prev.has(entry.id)) {
            const g = grantDiscoveryInsight('ambient_scan')
            setInsight(loadInsight())
            setStatusLine(
              g.field
                ? `Ambient reading logged. (+${g.total} Insight · field)`
                : `Ambient reading logged. (+${g.total} Insight)`,
            )
          }
          const next = new Set(prev)
          next.add(entry.id)
          saveSeenAmbientScans(next)
          return next
        })
      }
      return
    }

    if (!sustainedAmbientScanLabel) return
    // Don't interrupt mid-fight with boss/demon/secret
    if (
      activeKindRef.current === 'demon' ||
      activeKindRef.current === 'boss' ||
      activeKindRef.current === 'secret'
    ) {
      return
    }
    const entry = ambientScanForLabel(sustainedAmbientScanLabel)
    if (!entry) {
      clearSustainedAmbientScan()
      return
    }
    const now = performance.now()
    const last = ambientCooldownRef.current.get(entry.id) ?? 0
    // Soft lock: once seen this session, only re-show after 90s cooldown
    if (seenAmbientScans.has(entry.id) && now - last < 90_000) {
      clearSustainedAmbientScan()
      return
    }
    ambientCooldownRef.current.set(entry.id, now)
    setActiveAmbientScan(entry)
    setSeenAmbientScans((prev) => {
      if (!prev.has(entry.id)) {
        const g = grantDiscoveryInsight('ambient_scan')
        setInsight(loadInsight())
        setStatusLine(
          g.field
            ? `Ambient reading logged. (+${g.total} Insight · field)`
            : `Ambient reading logged. (+${g.total} Insight)`,
        )
      }
      const next = new Set(prev)
      next.add(entry.id)
      saveSeenAmbientScans(next)
      return next
    })
    clearSustainedAmbientScan()
  }, [
    started,
    dead,
    dusk.allowed,
    cinematicLock,
    finaleActive,
    epilogueOpen,
    werewolfActive,
    activeAmbientScan,
    sustainedAmbientScanLabel,
    seenAmbientScans,
    clearSustainedAmbientScan,
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
      const first = !heardVoiceHints.has(activeVoice.id)
      setHeardVoiceHints((prev) => {
        const next = new Set(prev)
        next.add(activeVoice.id)
        return next
      })
      if (first) {
        const g = grantDiscoveryInsight('whisper')
        setInsight(loadInsight())
        setStatusLine(
          g.field
            ? `A voice fades. (+${g.total} Insight · field) Journal updated.`
            : `A voice fades. (+${g.total} Insight) Check the whisper journal.`,
        )
      } else {
        setStatusLine('A voice fades. Check the whisper journal.')
      }
    }
    setActiveVoice(null)
  }

  const dismissStranger = () => {
    if (activeClue) {
      const first = !heardClues.has(activeClue.id)
      setHeardClues((prev) => {
        const next = new Set(prev)
        next.add(activeClue.id)
        return next
      })
      if (first) {
        const g = grantDiscoveryInsight('stranger')
        setInsight(loadInsight())
        setStatusLine(
          g.field
            ? `A stranger's words linger. (+${g.total} Insight · field)`
            : `A stranger's words linger. (+${g.total} Insight)`,
        )
      } else {
        setStatusLine("A stranger's words linger.")
      }
    }
    setActiveClue(null)
  }

  const onIntroComplete = (_choice: BazaarIntroChoice) => {
    patchSave({ introSeen: true })
    setIntroOpen(false)
  }

  const openIntroReplay = () => {
    setSavePanelOpen(false)
    setIntroKey((k) => k + 1)
    setIntroOpen(true)
  }

  const startExperience = async () => {
    setStarted(true)
    await audioRef.current.ensure()
  }

  /** Exit AR / overlay hunt back to boot hub without relying on browser Back. */
  const leaveHunt = useCallback(() => {
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
    setGalleryOpen(false)
    setShopOpen(false)
    setJournalOpen(false)
    setRelicsOpen(false)
    setSavePanelOpen(false)
    setStatusLine('')
    setStarted(false)
  }, [arRunning, resetGhost])

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
    const field = isFieldAuthentic()
    const firstLine = recordFirstCatch(kind)
    const isFirst = !!firstLine
    let polaroidUrl = raw.dataUrl
    try {
      polaroidUrl = await makePolaroidStill(raw.dataUrl, kind, lorePick.name, {
        fieldSeal: field,
        firstCatch: isFirst,
      })
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
      isSecret: kind === 'secret',
      fieldSeal: field,
      firstCatch: isFirst,
    }
    setCaptures((c) => [cap, ...c])

    // Completed catch pays Insight (+ field / first bonuses). Mid-ritual taps do not.
    const grant = grantCatchInsight(kind, { isFirstCatch: isFirst, forceField: field })
    setInsight(loadInsight())

    const profile = tensionFor(kind)
    const stamps = [
      field ? 'Field seal' : null,
      isFirst ? 'First catch' : null,
      `+${grant.total} Insight`,
    ].filter(Boolean).join(' · ')
    const baseLine =
      kind === 'demon'
        ? `Sealed: ${lorePick.name}. The ground remembers.`
        : kind === 'boss'
          ? `Sealed: ${lorePick.name}. The threshold goes quiet.`
          : kind === 'trial'
            ? `Trial sealed — ${lorePick.name}. Lesser echo.`
            : kind === 'secret'
              ? `Vault sealed — ${lorePick.name}.`
              : `Polaroid sealed — ${lorePick.name}.`
    setStatusLine(`${baseLine} ${stamps}.`)
    if (firstLine) {
      window.setTimeout(() => setStatusLine(`Undertaker: "${firstLine}"`), 1800)
    }

    // Capture moment: shutter flash, freeze, calm relief
    setCaptureFlash(true)
    window.setTimeout(() => setCaptureFlash(false), 480)
    void audioRef.current.ensure().then(() => {
      audioRef.current.playCaptureShutter?.()
      audioRef.current.playRelief?.()
    })

    appearAtRef.current = null
    meleeEnteredAtRef.current = null
    fakeOutDoneRef.current = false
    setAggression(0)
    setProximity(0)
    setCapturePhase(0)
    setActiveKind(null)
    const healed = Math.min(MAX_HEALTH, healthRef.current + profile.captureHeal)
    healthRef.current = healed
    setHealth(healed)
    setBpm(Math.max(52, Math.round(bpmFromState(0, healed) * 0.85)))
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

    // Endgame after demon seal — true-end may keep the polaroid
    if (kind === 'demon') {
      setCinematicLock(true)
      const nextClears = incrementClearCount()
      setClearCount(nextClears)
      const eligible =
        readForceTrueEnd() ||
        keptDemonPhoto ||
        isTrueEndEligible(secretUnlocked)
      if (eligible) {
        // Suppress hell-hands; player keeps the demon polaroid
        setKeptDemonPolaroid(true)
        setKeptDemonPhoto(true)
        setTradeMode(true)
        setFinalePolaroidUrl(polaroidUrl)
        setEpilogueOpen(true)
        setStatusLine(
          'The ground stays shut. The Empty Seat remains in your hand.',
        )
      } else {
        // Hell-hands consume the print — strip from gallery so NG+ can reseal.
        setCaptures((c) => withoutDemonCaptures(c))
        setKeptDemonPolaroid(false)
        setKeptDemonPhoto(false)
        setFinalePolaroidUrl(polaroidUrl)
        setFinaleActive(true)
        void audioRef.current.ensure().then(() => audioRef.current.playDemonFinale())
        if (arRunning && arSessionRef.current) {
          arSessionRef.current.playDemonFinale(polaroidUrl)
        }
      }
    }

    // NG+ secret character seal
    if (kind === 'secret') {
      markSecretUnlocked()
      setSecretUnlocked(true)
      setStatusLine(
        'The Pale Archivist is filed under emulsion. The vault goes quiet.',
      )
    }
  }

  const capture = () => {
    if (cinematicLock || finaleActive || epilogueOpen || makerOpen || spookboxCallOpen) return
    const kind = activeKindRef.current
    const demonShowing =
      kind === 'demon' &&
      (forcePlayground || playgroundArrived || sustainedPlayground || ghostShouldShow)
    const trialShowing =
      kind === 'trial' && (sustainedTrial || forceTrial || ghostShouldShow)
    const secretShowing =
      kind === 'secret' &&
      (ghostShouldShow || sustainedSecret || readForceSecretGhost())
    if (
      (!sustainedTarget && !demonShowing && !trialShowing && !secretShowing) ||
      (!ghostShouldShow && !demonShowing && !trialShowing && !secretShowing) ||
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
        } else if (kind === 'secret') {
          setStatusLine(
            next === 1
              ? 'First vault seal holds — the catalog wavers.'
              : 'Second seal holds — Spookbox for the finishing blow.',
          )
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
      // Final seal — Pale Archivist requires Spookbox protector stun
      if (kind === 'secret' && !archivistStunnedRef.current && !readForceArchivistStun()) {
        setStatusLine(
          spookboxOwned
            ? 'The vault will not take the final seal. Activate the Spookbox — call a protector. Only way to land the finishing blow.'
            : 'The vault will not take the final seal. You need a Spookbox — and a protector’s touch.',
        )
        return
      }
      // Final seal — Empty Seat requires full moon (true-good-ending path too)
      if (kind === 'demon' && !moon.canSeal) {
        setStatusLine(DEMON_SEAL_BLOCKED_COPY)
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


  const onMakerResolved = (choice: SpookboxMakerChoice) => {
    if (choice === 'trade' && hasCharm && !spookboxOwned) {
      spendKellerCharm()
      markCharmTradedForSpookbox()
      grantSpookbox()
      setHasCharm(false)
      setSpookboxOwned(true)
      setSpookboxEquipped(true)
      setStatusLine(`${SPOOKBOX.name} acquired. Equip and call a protector on the Archivist.`)
    } else if (choice === 'leave') {
      setStatusLine('The workbench ticks on without you.')
    }
  }

  const closeMaker = () => {
    setMakerOpen(false)
  }

  const openSpookboxCall = () => {
    if (!spookboxOwned || !spookboxEquipped) {
      setStatusLine('Equip the Spookbox first.')
      return
    }
    if (activeKindRef.current !== 'secret') {
      setStatusLine('The Spookbox only finds a protector mid-Archivist fight.')
      return
    }
    setSpookboxCallOpen(true)
  }

  const onSpookboxCallSuccess = () => {
    setSpookboxCallOpen(false)
    archivistStunnedRef.current = true
    setArchivistStunned(true)
    setProtectorVfx(true)
    setStunned(true) // brief player-side flash; entity held
    // Knock Archivist back
    if (appearAtRef.current != null) {
      const now = performance.now()
      const profile = tensionFor('secret')
      const elapsed = now - appearAtRef.current
      appearAtRef.current = now - Math.max(0, elapsed - 0.45 * profile.approachMs)
    }
    meleeEnteredAtRef.current = null
    setStatusLine('Protector hold! The Pale Archivist is stunned — land the final seal.')
    window.setTimeout(() => {
      setProtectorVfx(false)
      setStunned(false)
    }, 1400)
    audioRef.current.playHit()
  }

  const retryAfterDeath = () => {
    deadRef.current = false
    setDead(false)
    setHunterDeath(false)
    setWerewolfActive(false)
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
    archivistStunnedRef.current = false
    setArchivistStunned(false)
    setSpookboxCallOpen(false)
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
    if (choice === 'refuse') {
      // Trade refuse: player keeps the demon print (werewolf death follows).
      // Hell-hands refuse: print already gone; lens stay with player until death.
      setEpilogueRefused(true)
      setWerewolfActive(true)
      setStatusLine('Herr Keller’s manners leave him.')
      if (arRunning && arSessionRef.current) {
        arSessionRef.current.playWerewolfAttack()
      }
      return
    }
    if (choice === 'trade') {
      // Lore: photo traded to Keller — archive out of active gallery for NG+ reseal.
      setCaptures((c) => withoutDemonCaptures(c))
      setKeptDemonPolaroid(false)
      setKeptDemonPhoto(false)
      markTrueGoodEnding()
      setTrueGoodEnd(true)
      setTradeMode(false)
      setEpilogueRefused(false)
      setLensReturnedToKeller(false)
      setPostGame(true)
      if (shouldPlayKellerWestEpilogue()) {
        setCinematicLock(true)
        setKellerWestEpilogueOpen(true)
        setStatusLine(
          'The Empty Seat changes hands. The proprietor owes you a boom-town origin.',
        )
      } else if (shouldPlaySmileEpilogue()) {
        setCinematicLock(true)
        setSmileEpilogueOpen(true)
        setStatusLine(
          'The Empty Seat changes hands. Back in the bazaar, the proprietor has one courtesy left.',
        )
      } else {
        setEndCardOpen(true)
        setStatusLine(
          'The Empty Seat changes hands. The moon lets go of Herr Keller.',
        )
      }
      return
    }
    // Return the lens — grant NG+ charm (demon print already consumed by hell-hands).
    setCaptures((c) => withoutDemonCaptures(c))
    grantKellerCharm()
    setHasCharm(true)
    setEpilogueRefused(false)
    setLensReturnedToKeller(true)
    setTradeMode(false)
    setEndCardOpen(true)
    setPostGame(true)
    setStatusLine(
      `Herr Keller takes the glass. He leaves you ${KELLER_CHARM.name}.`,
    )
  }, [arRunning])

  const dismissEndCard = useCallback(() => {
    setEndCardOpen(false)
    setCinematicLock(false)
    setStatusLine(
      trueGoodEnd
        ? 'Post-hunt quiet. A cured hunter walks under a kinder moon.'
        : epilogueRefused
          ? 'Post-hunt quiet. The Undertaker will have opinions.'
          : 'Post-hunt quiet. The lens is gone. The photographs stay.',
    )
  }, [epilogueRefused, trueGoodEnd])

  const onSmileEpilogueComplete = useCallback(() => {
    markSmileEndingSeen()
    setSmileEpilogueOpen(false)
    setCinematicLock(false)
    setPostGame(true)
    setStatusLine('The tale ends. You who played are filed under glass.')
  }, [])

  const onKellerWestEpilogueComplete = useCallback(() => {
    markKellerWestEndingSeen()
    setKellerWestEpilogueOpen(false)
    setPostGame(true)
    // If West was deferred until a later true-good (count ≥ 2), Smile may also be due.
    if (shouldPlaySmileEpilogue()) {
      setSmileEpilogueOpen(true)
      setStatusLine(
        'The telling ends. Back in the bazaar, the proprietor has one courtesy left.',
      )
    } else {
      setEndCardOpen(true)
      setStatusLine(
        'The telling ends. Herr Keller first learned the shutter in alkali dust.',
      )
    }
  }, [])

  const onWerewolfComplete = useCallback(() => {
    setWerewolfActive(false)
    setHunterDeath(true)
    deadRef.current = true
    setDead(true)
    setCinematicLock(false)
    setStatusLine('')
  }, [])

  const confirmPlaygroundArrival = () => {
    setPlaygroundArrived(true)
    setStatusLine('You have arrived. The Empty Seat is listening.')
  }

  const buyItem = (id: OccultItemId) => {
    const def = getItemDef(id)
    if (!def) return
    if (ownedItems.includes(id)) return
    if (insight < def.cost) {
      setStatusLine('The undertaker waits. Insight insufficient.')
      return
    }
    setInsight((n) => n - def.cost)
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
  const isSecret = activeKind === 'secret'
  const phases = capturePhasesFor(activeKind)
  const demonVisible =
    isDemon &&
    (ghostShouldShow || forcePlayground || playgroundArrived || sustainedPlayground)
  const trialVisible =
    isTrial && (ghostShouldShow || sustainedTrial || forceTrial)
  const secretVisible =
    isSecret && (ghostShouldShow || sustainedSecret || readForceSecretGhost())

  const modeLabel =
    arMode === 'checking'
      ? 'PROBING…'
      : smileEpilogueOpen
        ? 'BAZAAR · SMILE'
        : cinematicLock || finaleActive
        ? 'FINALE'
        : epilogueOpen
          ? 'EPILOGUE'
          : !dusk.allowed
            ? 'LOCKED — DAY'
            : isDemon && demonVisible
              ? moon.canSeal
                ? 'PLAYGROUND · FULL MOON'
                : 'PLAYGROUND · WANING'
              : isBoss && ghostShouldShow
                ? 'WARDEN'
                : isTrial && trialVisible
                  ? 'TRIAL'
                  : isSecret && secretVisible
                    ? 'ARCHIVIST'
                  : arRunning
                    ? 'WEBXR ANCHORED'
                    : arMode === 'webxr'
                      ? 'WEBXR READY'
                      : 'OVERLAY FALLBACK'

  if (!started && introOpen) {
    return <BazaarIntro key={introKey} open onComplete={onIntroComplete} audio={audioRef.current} />
  }

  if (!started) {
    return (
      <div className="boot-screen">
        <div className="boot-bg" aria-hidden="true" />
        <div className="boot-scrim" aria-hidden="true" />
        <div className="boot-inner">
          <p className="boot-kicker">FIELD INSTRUMENT</p>
          <h1 className="boot-title">GHOST LENS</h1>
          <p className="boot-tagline">
            A field instrument for what photographs should not keep
          </p>
          <p className="boot-blurb">
            Point the rear camera at a <em>tombstone</em>, <em>ring</em>,{' '}
            <em>doll</em>, or <em>lake</em> — or a <em>chair</em> for a thin
            trial echo the lens alone can hold. Capture into a polaroid before
            it closes the distance. Seal all four to wake the{' '}
            <em>Threshold Warden</em>, then bring the photographs to the{' '}
            <em>playground</em>. Spend Insight at{' '}
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
              Insight: {insight}
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
              {' · ' + moon.status.phaseLabel}
              {moon.forceFullMoon ? ' · FORCE FULL MOON' : ''}
              {forceBoss ? ' · FORCE BOSS' : ''}
              {forcePlayground ? ' · FORCE PLAYGROUND' : ''}
              {forceTrial ? ' · FORCE TRIAL' : ''}
              {clearCount > 0 ? ` · clears ${clearCount}` : ''}
              {secretUnlocked ? ' · SECRET' : ''}
              {spookboxOwned ? ' · SPOOKBOX' : ''}
              {ngPlusActive ? ' · NG+' : ''}
              {postGame ? ' · POST-HUNT' : ''}{ngPlusActive ? ' · NG+' : ''}{trueGoodEnd ? ' · TRUE END' : ''}
            </li>
            {!dusk.allowed && (
              <li className="warn">{dusk.status.reason}</li>
            )}
            {playgroundUnlocked && !demonDefeated && !moon.canSeal && (
              <li className="warn">{DEMON_SEAL_BLOCKED_COPY}</li>
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
            className={`btn dusk-force-btn ${moon.forceFullMoon ? 'on' : ''}`}
            onClick={() => moon.toggleForceFullMoon()}
          >
            {moon.forceFullMoon
              ? 'Force full moon (test): ON'
              : 'Force full moon (test): OFF'}
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
            Dev: <code>?forceIntro=1</code> · <code>?forceDusk=1</code> · <code>?forceFullMoon=1</code> ·{' '}
            <code>?forceBoss=1</code> · <code>?forcePlayground=1</code> ·{' '}
            <code>?forceTrial=1</code> ·{' '}
            <code>?forceDemonWin=1</code> · <code>?forceEpilogue=1</code> ·{' '}
            <code>?forceWerewolf=1</code> · <code>?forceTrueEnd=1</code> · <code>?forceSmileEnd=1</code> · <code>?forceKellerWest=1</code> ·{' '}
            <code>?forceSecretGhost=1</code> · <code>?forceNGPlus=1</code> ·{' '}
            <code>?forceStranger=1</code> · <code>?forceSpookboxMaker=1</code> ·{' '}
            <code>?forceSpookbox=1</code> · <code>?forceArchivistStun=1</code> ·
            long-press title for dusk.
          </p>
          {modelError && <p className="warn">{modelError}</p>}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`app-root ${hitFlash ? 'app-hit app-hit-heavy' : ''} ${captureFlash ? 'app-capture-flash' : ''} ${stunned ? 'app-stun' : ''} ${isBoss ? 'app-boss' : ''} ${isDemon ? 'app-demon' : ''} ${isSecret ? 'app-secret' : ''} ${isTrial ? 'app-trial' : ''} ${cinematicLock ? 'app-cinematic' : ''} ${postGame ? 'app-postgame' : ''}`}
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
          <p className="dusk-window">Dusk gate — scanning paused.</p>
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
          <button
            type="button"
            className="btn ghost-btn leave-hunt-btn"
            onClick={leaveHunt}
          >
            Leave hunt
          </button>
        </div>
      )}

      {useFallbackCam && (
        <FallbackLens
          videoRefAttach={camera.attach}
          videoReady={camera.ready}
          cameraError={camera.error}
          ghostVisible={
            !cinematicLock && (ghostShouldShow || fleeing || demonVisible || trialVisible || secretVisible)
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

      {arRunning && !cinematicLock && (ghostShouldShow || demonVisible || trialVisible || secretVisible) && (
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
      <EpilogueStranger
        open={epilogueOpen}
        tradeMode={tradeMode}
        onResolved={onEpilogueResolved}
      />
      <EndTitleCard
        open={endCardOpen && !smileEpilogueOpen && !kellerWestEpilogueOpen}
        refused={epilogueRefused}
        trueGood={trueGoodEnd}
        onDismiss={dismissEndCard}
      />
      <BazaarSmileEpilogue
        open={smileEpilogueOpen}
        onComplete={onSmileEpilogueComplete}
      />
      <BazaarKellerWestEpilogue
        open={kellerWestEpilogueOpen}
        onComplete={onKellerWestEpilogueComplete}
      />
      <WerewolfAttack active={werewolfActive} onComplete={onWerewolfComplete} />

      {!cinematicLock && (
      <Hud
        modeLabel={modeLabel}
        detection={detection}
        sustained={sustainedTarget}
        ghostVisible={ghostShouldShow || demonVisible || trialVisible || secretVisible}
        anchored={anchored}
        modelReady={modelReady}
        loadingMsg={loadingMsg}
        modelError={modelError}
        duskPaused={!dusk.allowed}
        onLeaveHunt={leaveHunt}
        captureDisabled={
          !dusk.allowed ||
          !(ghostShouldShow || demonVisible || trialVisible || secretVisible) ||
          (!sustainedTarget && !demonVisible && !trialVisible && !secretVisible) ||
          dead ||
          capturing ||
          makerOpen ||
          spookboxCallOpen
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
        isSecret={secretVisible}
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
        moonPhaseLabel={moon.status.phaseLabel}
        moonCanSeal={moon.canSeal}
      />
      )}

      {/* Insight + shop + tool use strip */}
      {!cinematicLock && (
      <div className="insight-strip">
        <button
          type="button"
          className="btn undertaker-open-btn"
          onClick={() => setShopOpen(true)}
        >
          Undertaker · {insight} Insight
        </button>
                <button
          type="button"
          className="btn"
          onClick={() => setSavePanelOpen(true)}
        >
          Save
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
        {equippedItem && (ghostShouldShow || demonVisible || secretVisible) && !itemSpentThisFight && (
          <button
            type="button"
            className="btn use-tool-btn"
            onClick={useEquippedItem}
          >
            Use {getItemDef(equippedItem)?.name}
          </button>
        )}
        {spookboxOwned && (
          <button
            type="button"
            className={`btn use-tool-btn spookbox-equip-btn ${spookboxEquipped ? 'on' : ''}`}
            onClick={() => setSpookboxEquipped((e) => !e)}
          >
            {spookboxEquipped ? 'Spookbox: READY' : 'Equip Spookbox'}
          </button>
        )}
        {spookboxOwned &&
          spookboxEquipped &&
          secretVisible &&
          !archivistStunned &&
          capturePhase >= phases - 1 && (
          <button
            type="button"
            className="btn use-tool-btn spookbox-call-btn"
            onClick={openSpookboxCall}
          >
            Activate Spookbox
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
        ngPlus={ngPlusActive}
      />

      <UndertakerCounter
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        insight={insight}
        owned={ownedItems}
        onBuy={buyItem}
        equipped={equippedItem}
        onEquip={setEquippedItem}
        postGame={postGame}
        lensReturned={lensReturnedToKeller && !trueGoodEnd}
        audio={audioRef.current}
      />

      {activeVoice && (
        <div className="voice-subtitle" role="status" onClick={dismissVoice}>
          <p className="voice-kicker">A VOICE WITHOUT A BODY</p>
          <p className="voice-line">&ldquo;{activeVoice.line}&rdquo;</p>
          <p className="voice-dismiss">Tap to commit to the journal</p>
        </div>
      )}

      
      {saveToast && (
        <div className="save-toast" role="status">{saveToast}</div>
      )}
      {savePanelOpen && (
        <div className="save-panel" role="dialog" aria-label="Save and backup">
          <h2>Save / Backup</h2>
          <p>
            Progress autosaves. Export a JSON backup before clearing browser data —
            especially if you hunt outdoors.
          </p>
          <div className="save-actions">
            <button type="button" className="btn" onClick={() => downloadSaveFile()}>
              Download save JSON
            </button>
            <button
              type="button"
              className="btn ghost-btn"
              onClick={openIntroReplay}
            >
              Replay intro
            </button>
            <button type="button" className="btn ghost-btn" onClick={() => setSavePanelOpen(false)}>
              Close
            </button>
          </div>
          <p>Or paste a save file below:</p>
          <textarea
            id="save-import-box"
            placeholder='{ "v": 1, "insight": ... }'
            spellCheck={false}
          />
          <div className="save-actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                const el = document.getElementById('save-import-box') as HTMLTextAreaElement | null
                const raw = el?.value?.trim() ?? ''
                if (!raw) {
                  setStatusLine('Paste a save JSON first.')
                  return
                }
                const res = importSaveJson(raw)
                if (!res.ok) {
                  setStatusLine(res.error)
                  return
                }
                setInsight(loadInsight())
                setCaptures(res.save.polaroids)
                setOwnedItems(res.save.ownedItems)
                setSavePanelOpen(false)
                setStatusLine('Save imported. Insight and polaroids restored.')
              }}
            >
              Import save
            </button>
          </div>
        </div>
      )}

      {started && introOpen && (
        <BazaarIntro key={introKey} open onComplete={onIntroComplete} audio={audioRef.current} />
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

      {activeAmbientScan && (
        <AmbientScanCard
          entry={activeAmbientScan}
          onDismiss={() => setActiveAmbientScan(null)}
        />
      )}

      {collectibleToast && (
        <div className="collectible-toast" role="status">
          {collectibleToast}
        </div>
      )}

      <SpookboxMaker
        open={makerOpen}
        hasCharm={hasCharm}
        alreadyHasBox={spookboxOwned}
        onResolved={onMakerResolved}
        onClose={closeMaker}
      />
      <SpookboxCall
        open={spookboxCallOpen}
        onSuccess={onSpookboxCallSuccess}
        onCancel={() => setSpookboxCallOpen(false)}
      />
      <ProtectorStunVfx active={protectorVfx} />

      <StrangerVignette clue={activeClue} onDismiss={dismissStranger} />

      {dead && (
        <DeathScreen
          onRetry={retryAfterDeath}
          onLeave={leaveHunt}
          hunterDeath={hunterDeath}
        />
      )}
    </div>
  )
}
