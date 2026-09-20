import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CANDIDATE_LABELS,
  SECRET_TRIGGER_LABELS,
  SPOOKBOX_MAKER_LABELS,
  PLAYGROUND_LABELS,
  COLLECTIBLE_SCENE_LABELS,
  STRANGER_SCENE_LABELS,
  TARGET_LABELS,
  TRIAL_TRIGGER_ALIASES,
  TRIAL_TRIGGER_LABEL,
  type DetectionResult,
  type PlaygroundLabel,
  type TargetType,
  type TrialTriggerLabel,
} from '../types'
import { allAmbientScanLabels } from '../lore/ambientScans'

type ClassifierFn = (
  input: HTMLCanvasElement | HTMLImageElement | string,
  labels: readonly string[],
  options?: { multi_label?: boolean },
) => Promise<Array<{ label: string; score: number }>>

const INFERENCE_INTERVAL_MS = 700
const CONFIDENCE_THRESHOLD = 0.28
const PLAYGROUND_CONFIDENCE_THRESHOLD = 0.26
const STRANGER_CONFIDENCE_THRESHOLD = 0.27
const COLLECTIBLE_CONFIDENCE_THRESHOLD = 0.26
/** Trial chair — easier / earlier spawn. */
const TRIAL_CONFIDENCE_THRESHOLD = 0.16
const SUSTAIN_MS = 1200
const TRIAL_SUSTAIN_MS = 500
const FLEE_MS = 1800

export function useClassifier() {
  const [ready, setReady] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Loading vision model…')
  const [error, setError] = useState<string | null>(null)
  const [detection, setDetection] = useState<DetectionResult>({
    label: null,
    confidence: 0,
    scores: {},
    playgroundConfidence: 0,
    playgroundLabel: null,
    strangerLabel: null,
    strangerConfidence: 0,
    collectibleLabel: null,
    collectibleConfidence: 0,
    trialLabel: null,
    trialConfidence: 0,
    secretConfidence: 0,
    ambientScanLabel: null,
    ambientScanConfidence: 0,
    spookboxMakerLabel: null,
    spookboxMakerConfidence: 0,
  })
  const [sustainedTarget, setSustainedTarget] = useState<TargetType | null>(null)
  const [ghostShouldShow, setGhostShouldShow] = useState(false)
  const [playgroundDetected, setPlaygroundDetected] = useState(false)
  const [sustainedPlayground, setSustainedPlayground] = useState(false)
  const [sustainedStrangerLabel, setSustainedStrangerLabel] = useState<string | null>(
    null,
  )
  const [sustainedCollectibleLabel, setSustainedCollectibleLabel] = useState<
    string | null
  >(null)
  const [sustainedTrial, setSustainedTrial] = useState(false)
  const [sustainedSecret, setSustainedSecret] = useState(false)
  const [sustainedAmbientScanLabel, setSustainedAmbientScanLabel] = useState<
    string | null
  >(null)
  const [sustainedSpookboxMakerLabel, setSustainedSpookboxMakerLabel] = useState<
    string | null
  >(null)

  const classifierRef = useRef<ClassifierFn | null>(null)
  const busyRef = useRef(false)
  const lastInferRef = useRef(0)
  const sustainStartRef = useRef<number | null>(null)
  const lastSeenRef = useRef<number | null>(null)
  const currentCandidateRef = useRef<TargetType | null>(null)
  const playgroundSustainRef = useRef<number | null>(null)
  const lastPlaygroundSeenRef = useRef<number | null>(null)
  const strangerSustainRef = useRef<number | null>(null)
  const strangerCandidateRef = useRef<string | null>(null)
  const lastStrangerSeenRef = useRef<number | null>(null)
  const collectibleSustainRef = useRef<number | null>(null)
  const collectibleCandidateRef = useRef<string | null>(null)
  const lastCollectibleSeenRef = useRef<number | null>(null)
  const trialSustainRef = useRef<number | null>(null)
  const lastTrialSeenRef = useRef<number | null>(null)
  const secretSustainRef = useRef<number | null>(null)
  const lastSecretSeenRef = useRef<number | null>(null)
  const ambientSustainRef = useRef<number | null>(null)
  const ambientCandidateRef = useRef<string | null>(null)
  const lastAmbientSeenRef = useRef<number | null>(null)
  const makerSustainRef = useRef<number | null>(null)
  const makerCandidateRef = useRef<string | null>(null)
  const lastMakerSeenRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoadingMsg('Downloading CLIP (first load may take a minute)…')
        const { pipeline, env } = await import('@xenova/transformers')
        env.allowLocalModels = false
        env.useBrowserCache = true
        const clf = await pipeline(
          'zero-shot-image-classification',
          'Xenova/clip-vit-base-patch32',
        )
        if (cancelled) return
        classifierRef.current = clf as unknown as ClassifierFn
        setReady(true)
        setLoadingMsg('')
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load vision model')
        setLoadingMsg('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const classifyFrame = useCallback(async (source: HTMLCanvasElement | HTMLVideoElement) => {
    if (!classifierRef.current || busyRef.current) return
    const now = performance.now()
    if (now - lastInferRef.current < INFERENCE_INTERVAL_MS) return
    lastInferRef.current = now
    busyRef.current = true

    try {
      let canvas: HTMLCanvasElement
      if (source instanceof HTMLCanvasElement) {
        canvas = source
      } else {
        const w = Math.min(320, source.videoWidth || 320)
        const h = source.videoHeight
          ? Math.round((w / source.videoWidth) * source.videoHeight)
          : 240
        canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx || !source.videoWidth) {
          busyRef.current = false
          return
        }
        ctx.drawImage(source, 0, 0, w, h)
      }

      const results = await classifierRef.current(canvas, [...CANDIDATE_LABELS], {
        multi_label: false,
      })

      const scores: Record<string, number> = {}
      for (const r of results) scores[r.label] = r.score

      let bestTarget: TargetType | null = null
      let bestScore = 0
      for (const t of TARGET_LABELS) {
        const s = scores[t] ?? 0
        if (s > bestScore) {
          bestScore = s
          bestTarget = t
        }
      }

      let bestPlayground: PlaygroundLabel | null = null
      let bestPlaygroundScore = 0
      for (const p of PLAYGROUND_LABELS) {
        const s = scores[p] ?? 0
        if (s > bestPlaygroundScore) {
          bestPlaygroundScore = s
          bestPlayground = p
        }
      }

      let bestStranger: string | null = null
      let bestStrangerScore = 0
      for (const sLabel of STRANGER_SCENE_LABELS) {
        const s = scores[sLabel] ?? 0
        if (s > bestStrangerScore) {
          bestStrangerScore = s
          bestStranger = sLabel
        }
      }

      let bestCollectible: string | null = null
      let bestCollectibleScore = 0
      for (const cLabel of COLLECTIBLE_SCENE_LABELS) {
        const s = scores[cLabel] ?? 0
        if (s > bestCollectibleScore) {
          bestCollectibleScore = s
          bestCollectible = cLabel
        }
      }

      const AMBIENT_LABELS = allAmbientScanLabels()
      let bestAmbient: string | null = null
      let bestAmbientScore = 0
      for (const aLabel of AMBIENT_LABELS) {
        const s = scores[aLabel] ?? 0
        if (s > bestAmbientScore) {
          bestAmbientScore = s
          bestAmbient = aLabel
        }
      }


      let bestMaker: string | null = null
      let bestMakerScore = 0
      for (const mLabel of SPOOKBOX_MAKER_LABELS) {
        const s = scores[mLabel] ?? 0
        if (s > bestMakerScore) {
          bestMakerScore = s
          bestMaker = mLabel
        }
      }

      const secretScore = Math.max(0, ...SECRET_TRIGGER_LABELS.map((l) => scores[l] ?? 0))
      const trialScore = Math.max(
        0,
        ...TRIAL_TRIGGER_ALIASES.map((l) => scores[l] ?? 0),
      )

      const negativeMax = Math.max(
        scores['empty room'] ?? 0,
        scores['plain wall'] ?? 0,
        scores['none of the above'] ?? 0,
        scores['person'] ?? 0,
        scores['furniture'] ?? 0,
      )
      // Chair≈furniture in CLIP — don't let the furniture label kill the trial haunt.
      const trialNegativeMax = Math.max(
        scores['empty room'] ?? 0,
        scores['plain wall'] ?? 0,
        scores['none of the above'] ?? 0,
        scores['person'] ?? 0,
      )

      const accepted =
        bestTarget &&
        bestScore >= CONFIDENCE_THRESHOLD &&
        bestScore > negativeMax * 0.95

      const playgroundHit =
        bestPlayground &&
        bestPlaygroundScore >= PLAYGROUND_CONFIDENCE_THRESHOLD &&
        bestPlaygroundScore > negativeMax * 0.9

      const strangerHit =
        bestStranger &&
        bestStrangerScore >= STRANGER_CONFIDENCE_THRESHOLD &&
        bestStrangerScore > negativeMax * 0.88 &&
        // Prefer not to fire strangers while a ghost target is winning hard
        (!accepted || bestStrangerScore >= bestScore * 0.92)

      const collectibleHit =
        bestCollectible &&
        bestCollectibleScore >= COLLECTIBLE_CONFIDENCE_THRESHOLD &&
        bestCollectibleScore > negativeMax * 0.85

      const AMBIENT_CONFIDENCE_THRESHOLD = 0.24
      const ambientHit =
        bestAmbient &&
        bestAmbientScore >= AMBIENT_CONFIDENCE_THRESHOLD &&
        bestAmbientScore > negativeMax * 0.82 &&
        // Prefer not to steal focus from a hard ghost lock
        (!accepted || bestAmbientScore >= bestScore * 0.9)

      // Trial chair: easier threshold; furniture is a near-neighbor so loosen veto.
      // Prefer main ghost targets when they clearly win.
      const trialHit =
        trialScore >= TRIAL_CONFIDENCE_THRESHOLD &&
        trialScore > trialNegativeMax * 0.65 &&
        (!accepted || trialScore >= bestScore * 0.98)

      const SECRET_CONFIDENCE_THRESHOLD = 0.22
      const secretHit =
        secretScore >= SECRET_CONFIDENCE_THRESHOLD &&
        secretScore > negativeMax * 0.8 &&
        (!accepted || secretScore >= bestScore * 1.02)

      const MAKER_CONFIDENCE_THRESHOLD = 0.26
      const makerHit =
        bestMaker &&
        bestMakerScore >= MAKER_CONFIDENCE_THRESHOLD &&
        bestMakerScore > negativeMax * 0.85 &&
        (!accepted || bestMakerScore >= bestScore * 0.9)

      const label = accepted ? bestTarget : null
      const confidence = accepted ? bestScore : bestScore
      const trialLabel: TrialTriggerLabel | null = trialHit
        ? TRIAL_TRIGGER_LABEL
        : null

      setDetection({
        label,
        confidence,
        scores,
        playgroundConfidence: bestPlaygroundScore,
        playgroundLabel: playgroundHit ? bestPlayground : null,
        strangerLabel: strangerHit ? bestStranger : null,
        strangerConfidence: bestStrangerScore,
        collectibleLabel: collectibleHit ? bestCollectible : null,
        collectibleConfidence: bestCollectibleScore,
        trialLabel,
        trialConfidence: trialScore,
        secretConfidence: secretScore,
        ambientScanLabel: ambientHit ? bestAmbient : null,
        ambientScanConfidence: bestAmbientScore,
        spookboxMakerLabel: makerHit ? bestMaker : null,
        spookboxMakerConfidence: bestMakerScore,
      })
      setPlaygroundDetected(!!playgroundHit)

      const t = performance.now()

      if (playgroundHit) {
        lastPlaygroundSeenRef.current = t
        if (!playgroundSustainRef.current) playgroundSustainRef.current = t
        if (
          playgroundSustainRef.current &&
          t - playgroundSustainRef.current >= SUSTAIN_MS
        ) {
          setSustainedPlayground(true)
        }
      } else {
        playgroundSustainRef.current = null
        if (
          lastPlaygroundSeenRef.current &&
          t - lastPlaygroundSeenRef.current > FLEE_MS
        ) {
          setSustainedPlayground(false)
        }
      }

      if (strangerHit && bestStranger) {
        lastStrangerSeenRef.current = t
        if (strangerCandidateRef.current !== bestStranger) {
          strangerCandidateRef.current = bestStranger
          strangerSustainRef.current = t
          setSustainedStrangerLabel(null)
        } else if (
          strangerSustainRef.current &&
          t - strangerSustainRef.current >= SUSTAIN_MS
        ) {
          setSustainedStrangerLabel(bestStranger)
        }
      } else {
        strangerCandidateRef.current = null
        strangerSustainRef.current = null
        if (
          lastStrangerSeenRef.current &&
          t - lastStrangerSeenRef.current > FLEE_MS
        ) {
          setSustainedStrangerLabel(null)
        }
      }

      if (collectibleHit && bestCollectible) {
        lastCollectibleSeenRef.current = t
        if (collectibleCandidateRef.current !== bestCollectible) {
          collectibleCandidateRef.current = bestCollectible
          collectibleSustainRef.current = t
          setSustainedCollectibleLabel(null)
        } else if (
          collectibleSustainRef.current &&
          t - collectibleSustainRef.current >= SUSTAIN_MS
        ) {
          setSustainedCollectibleLabel(bestCollectible)
        }
      } else {
        collectibleCandidateRef.current = null
        collectibleSustainRef.current = null
        if (
          lastCollectibleSeenRef.current &&
          t - lastCollectibleSeenRef.current > FLEE_MS
        ) {
          setSustainedCollectibleLabel(null)
        }
      }

      if (ambientHit && bestAmbient) {
        lastAmbientSeenRef.current = t
        if (ambientCandidateRef.current !== bestAmbient) {
          ambientCandidateRef.current = bestAmbient
          ambientSustainRef.current = t
          setSustainedAmbientScanLabel(null)
        } else if (
          ambientSustainRef.current &&
          t - ambientSustainRef.current >= SUSTAIN_MS
        ) {
          setSustainedAmbientScanLabel(bestAmbient)
        }
      } else {
        ambientCandidateRef.current = null
        ambientSustainRef.current = null
        if (
          lastAmbientSeenRef.current &&
          t - lastAmbientSeenRef.current > FLEE_MS
        ) {
          setSustainedAmbientScanLabel(null)
        }
      }


      if (makerHit && bestMaker) {
        lastMakerSeenRef.current = t
        if (makerCandidateRef.current !== bestMaker) {
          makerCandidateRef.current = bestMaker
          makerSustainRef.current = t
          setSustainedSpookboxMakerLabel(null)
        } else if (
          makerSustainRef.current &&
          t - makerSustainRef.current >= SUSTAIN_MS
        ) {
          setSustainedSpookboxMakerLabel(bestMaker)
        }
      } else {
        makerCandidateRef.current = null
        makerSustainRef.current = null
        if (
          lastMakerSeenRef.current &&
          t - lastMakerSeenRef.current > FLEE_MS
        ) {
          setSustainedSpookboxMakerLabel(null)
        }
      }


      if (trialHit) {
        lastTrialSeenRef.current = t
        if (!trialSustainRef.current) trialSustainRef.current = t
        if (
          trialSustainRef.current &&
          t - trialSustainRef.current >= TRIAL_SUSTAIN_MS
        ) {
          setSustainedTrial(true)
        }
      } else {
        trialSustainRef.current = null
        if (
          lastTrialSeenRef.current &&
          t - lastTrialSeenRef.current > FLEE_MS
        ) {
          setSustainedTrial(false)
        }
      }

      if (secretHit) {
        lastSecretSeenRef.current = t
        if (!secretSustainRef.current) secretSustainRef.current = t
        if (
          secretSustainRef.current &&
          t - secretSustainRef.current >= SUSTAIN_MS
        ) {
          setSustainedSecret(true)
        }
      } else {
        secretSustainRef.current = null
        if (
          lastSecretSeenRef.current &&
          t - lastSecretSeenRef.current > FLEE_MS
        ) {
          setSustainedSecret(false)
        }
      }


      if (label) {
        lastSeenRef.current = t
        if (currentCandidateRef.current !== label) {
          currentCandidateRef.current = label
          sustainStartRef.current = t
          setSustainedTarget(null)
          setGhostShouldShow(false)
        } else if (
          sustainStartRef.current &&
          t - sustainStartRef.current >= SUSTAIN_MS
        ) {
          setSustainedTarget(label)
          setGhostShouldShow(true)
        }
      } else {
        currentCandidateRef.current = null
        sustainStartRef.current = null
        if (lastSeenRef.current && t - lastSeenRef.current > FLEE_MS) {
          setGhostShouldShow(false)
          setSustainedTarget(null)
        }
      }
    } catch (e) {
      console.warn('classify error', e)
    } finally {
      busyRef.current = false
    }
  }, [])

  const resetGhost = useCallback(() => {
    setGhostShouldShow(false)
    setSustainedTarget(null)
    setSustainedTrial(false)
    sustainStartRef.current = null
    currentCandidateRef.current = null
    lastSeenRef.current = null
    trialSustainRef.current = null
    lastTrialSeenRef.current = null
  }, [])

  const forceManifest = useCallback(() => {
    setGhostShouldShow(true)
  }, [])

  const forceTrialManifest = useCallback(() => {
    setSustainedTrial(true)
    setGhostShouldShow(true)
  }, [])

  const clearSustainedStranger = useCallback(() => {
    setSustainedStrangerLabel(null)
    strangerCandidateRef.current = null
    strangerSustainRef.current = null
  }, [])

  const clearSustainedCollectible = useCallback(() => {
    setSustainedCollectibleLabel(null)
    collectibleCandidateRef.current = null
    collectibleSustainRef.current = null
  }, [])

  const clearSustainedAmbientScan = useCallback(() => {
    setSustainedAmbientScanLabel(null)
    ambientCandidateRef.current = null
    ambientSustainRef.current = null
  }, [])

  const clearSustainedSpookboxMaker = useCallback(() => {
    setSustainedSpookboxMakerLabel(null)
    makerCandidateRef.current = null
    makerSustainRef.current = null
  }, [])

  return {
    ready,
    loadingMsg,
    error,
    detection,
    sustainedTarget,
    ghostShouldShow,
    playgroundDetected,
    sustainedPlayground,
    sustainedStrangerLabel,
    sustainedCollectibleLabel,
    sustainedTrial,
    sustainedSecret,
    sustainedAmbientScanLabel,
    sustainedSpookboxMakerLabel,
    classifyFrame,
    resetGhost,
    forceManifest,
    forceTrialManifest,
    clearSustainedStranger,
    clearSustainedCollectible,
    clearSustainedAmbientScan,
    clearSustainedSpookboxMaker,
  }
}
