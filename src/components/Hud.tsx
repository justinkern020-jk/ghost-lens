import type { DetectionResult, TargetType } from '../types'

interface Props {
  modeLabel: string
  detection: DetectionResult
  sustained: TargetType | null
  ghostVisible: boolean
  anchored: boolean
  modelReady: boolean
  loadingMsg: string
  captureDisabled: boolean
  onCapture: () => void
  onOpenGallery: () => void
  captureCount: number
  onStartAr?: () => void
  arRunning?: boolean
  statusLine?: string
  /** Calm / health 0–1 */
  health: number
  /** Heartbeat BPM */
  bpm: number
  proximity: number
  stunned?: boolean
  isBoss?: boolean
  /** Boss multi-phase capture progress 0..phases */
  capturePhase?: number
  capturePhases?: number
  uniqueSealed?: number
  bossUnlocked?: boolean
}

export function Hud({
  modeLabel,
  detection,
  sustained,
  ghostVisible,
  anchored,
  modelReady,
  loadingMsg,
  captureDisabled,
  onCapture,
  onOpenGallery,
  captureCount,
  onStartAr,
  arRunning,
  statusLine,
  health,
  bpm,
  proximity,
  stunned,
  isBoss,
  capturePhase = 0,
  capturePhases = 1,
  uniqueSealed = 0,
  bossUnlocked = false,
}: Props) {
  const pct = Math.round(detection.confidence * 100)
  const healthPct = Math.round(Math.max(0, Math.min(1, health)) * 100)
  const beatSec = Math.max(0.28, 60 / Math.max(bpm, 40))
  const critical = health < 0.35 || proximity > 0.85 || !!isBoss

  const captureLabel = isBoss
    ? capturePhase >= capturePhases - 1
      ? 'Seal'
      : `Capture ${capturePhase + 1}/${capturePhases}`
    : 'Capture'

  return (
    <div className={`hud ${isBoss ? 'hud-boss' : ''}`} id="ar-overlay">
      <div className="hud-top">
        <div className="brand">
          <span className="brand-mark">◈</span>
          <span>GHOST LENS</span>
        </div>
        <div className="mode-chip">{modeLabel}</div>
      </div>

      <div className="heartbeat-meter" data-critical={critical || undefined}>
        <div className="heartbeat-label">
          <span className="heart-icon" style={{ animationDuration: `${beatSec}s` }}>
            ♥
          </span>
          <span className="bpm-readout">{bpm} BPM</span>
        </div>
        <div className="heartbeat-track" aria-hidden>
          <div
            className="heartbeat-fill"
            style={{ width: `${healthPct}%` }}
          />
          <svg className="ecg-line" viewBox="0 0 120 20" preserveAspectRatio="none">
            <polyline
              points="0,10 18,10 24,4 30,16 36,10 54,10 60,2 66,18 72,10 120,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              style={{ animationDuration: `${beatSec}s` }}
            />
          </svg>
        </div>
        <div className="calm-label">
          {isBoss
            ? 'WARDEN'
            : healthPct >= 70
              ? 'CALM'
              : healthPct >= 40
                ? 'ELEVATED'
                : 'PANIC'}
          {proximity > 0.5 && ghostVisible ? ' · APPROACHING' : ''}
          {stunned ? ' · STUNNED' : ''}
        </div>
      </div>

      {isBoss && ghostVisible && (
        <div className="boss-phase-meter" aria-label="Seal progress">
          {Array.from({ length: capturePhases }, (_, i) => (
            <span
              key={i}
              className={`phase-pip ${i < capturePhase ? 'filled' : ''}`}
            />
          ))}
        </div>
      )}

      <div className="hud-mid">
        {!modelReady && loadingMsg && (
          <div className="status-pill warn">{loadingMsg}</div>
        )}
        {modelReady && (
          <div className="status-pill">
            {isBoss && ghostVisible ? (
              <>
                <strong>Threshold Warden</strong> manifested · seal it in phases
              </>
            ) : detection.label ? (
              <>
                Sensing <strong>{detection.label}</strong> · {pct}%
                {!sustained && detection.label && ' · holding…'}
                {sustained && ghostVisible && anchored && ' · anchored'}
                {sustained && ghostVisible && !anchored && ' · manifested'}
              </>
            ) : (
              <>
                Scanning for tombstone · ring · doll · lake · {pct}% peak
                {bossUnlocked ? ' · warden unlocked' : ''}
              </>
            )}
          </div>
        )}
        {statusLine && <div className="status-pill dim">{statusLine}</div>}
        <div className="status-pill dim collection-pill">
          Sealed types {uniqueSealed}/4
          {bossUnlocked ? (isBoss ? ' · FIGHT' : ' · boss ready') : ''}
        </div>
      </div>

      <div className="hud-bottom">
        <button
          type="button"
          className="btn gallery-btn"
          onClick={onOpenGallery}
        >
          Polaroids ({captureCount})
        </button>
        <button
          type="button"
          className={`btn capture-btn ${isBoss ? 'boss-capture' : ''}`}
          disabled={captureDisabled}
          onClick={onCapture}
        >
          {captureLabel}
        </button>
        {onStartAr && !arRunning && (
          <button type="button" className="btn ar-btn" onClick={onStartAr}>
            Enter AR
          </button>
        )}
      </div>
    </div>
  )
}
