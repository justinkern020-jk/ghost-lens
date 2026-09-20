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
}: Props) {
  const pct = Math.round(detection.confidence * 100)
  return (
    <div className="hud" id="ar-overlay">
      <div className="hud-top">
        <div className="brand">
          <span className="brand-mark">◈</span>
          <span>GHOST LENS</span>
        </div>
        <div className="mode-chip">{modeLabel}</div>
      </div>

      <div className="hud-mid">
        {!modelReady && loadingMsg && (
          <div className="status-pill warn">{loadingMsg}</div>
        )}
        {modelReady && (
          <div className="status-pill">
            {detection.label ? (
              <>
                Sensing <strong>{detection.label}</strong> · {pct}%
                {!sustained && detection.label && ' · holding…'}
                {sustained && ghostVisible && anchored && ' · anchored'}
                {sustained && ghostVisible && !anchored && ' · manifested'}
              </>
            ) : (
              <>Scanning for tombstone · ring · doll · lake · {pct}% peak</>
            )}
          </div>
        )}
        {statusLine && <div className="status-pill dim">{statusLine}</div>}
      </div>

      <div className="hud-bottom">
        <button
          type="button"
          className="btn gallery-btn"
          onClick={onOpenGallery}
        >
          Gallery ({captureCount})
        </button>
        <button
          type="button"
          className="btn capture-btn"
          disabled={captureDisabled}
          onClick={onCapture}
        >
          Capture
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
