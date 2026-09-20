import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CANDIDATE_LABELS,
  TARGET_LABELS,
  type DetectionResult,
  type TargetType,
} from '../types'

type ClassifierFn = (
  input: HTMLCanvasElement | HTMLImageElement | string,
  labels: readonly string[],
  options?: { multi_label?: boolean },
) => Promise<Array<{ label: string; score: number }>>

const INFERENCE_INTERVAL_MS = 700
const CONFIDENCE_THRESHOLD = 0.28
const SUSTAIN_MS = 1200
const FLEE_MS = 1800

export function useClassifier() {
  const [ready, setReady] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Loading vision model…')
  const [error, setError] = useState<string | null>(null)
  const [detection, setDetection] = useState<DetectionResult>({
    label: null,
    confidence: 0,
    scores: {},
  })
  const [sustainedTarget, setSustainedTarget] = useState<TargetType | null>(null)
  const [ghostShouldShow, setGhostShouldShow] = useState(false)

  const classifierRef = useRef<ClassifierFn | null>(null)
  const busyRef = useRef(false)
  const lastInferRef = useRef(0)
  const sustainStartRef = useRef<number | null>(null)
  const lastSeenRef = useRef<number | null>(null)
  const currentCandidateRef = useRef<TargetType | null>(null)

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

      const negativeMax = Math.max(
        scores['empty room'] ?? 0,
        scores['plain wall'] ?? 0,
        scores['none of the above'] ?? 0,
        scores['person'] ?? 0,
        scores['furniture'] ?? 0,
      )

      const accepted =
        bestTarget &&
        bestScore >= CONFIDENCE_THRESHOLD &&
        bestScore > negativeMax * 0.95

      const label = accepted ? bestTarget : null
      const confidence = accepted ? bestScore : bestScore

      setDetection({ label, confidence, scores })

      const t = performance.now()
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
    sustainStartRef.current = null
    currentCandidateRef.current = null
    lastSeenRef.current = null
  }, [])

  return {
    ready,
    loadingMsg,
    error,
    detection,
    sustainedTarget,
    ghostShouldShow,
    classifyFrame,
    resetGhost,
  }
}
