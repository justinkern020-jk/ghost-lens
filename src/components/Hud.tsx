import type { Capture, DetectionResult, TargetType } from '../types'

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
  isDemon?: boolean
  isTrial?: boolean
  isSecret?: boolean
  /** Multi-phase capture progress 0..phases */
  capturePhase?: number
  capturePhases?: number
  uniqueSealed?: number
  bossUnlocked?: boolean
  playgroundUnlocked?: boolean
  playgroundReady?: boolean
  demonDefeated?: boolean
  /** Polaroids laid into the seal ritual during demon fight */
  ritualPolaroids?: Capture[]
  onArrivePlayground?: () => void
  showArrivePlayground?: boolean
  /** Moon phase chip (demon seal gate) */
  moonPhaseLabel?: string
  moonCanSeal?: boolean
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
  isDemon,
  isTrial = false,
  isSecret = false,
  capturePhase = 0,
  capturePhases = 1,
  uniqueSealed = 0,
  bossUnlocked = false,
  playgroundUnlocked = false,
  playgroundReady = false,
  demonDefeated = false,
  ritualPolaroids = [],
  onArrivePlayground,
  showArrivePlayground = false,
  moonPhaseLabel,
  moonCanSeal = false,
}: Props) {
  const pct = Math.round(detection.confidence * 100)
  const healthPct = Math.round(Math.max(0, Math.min(1, health)) * 100)
  const beatSec = Math.max(0.28, 60 / Math.max(bpm, 40))
  const endgame = !!(isBoss || isDemon || isSecret)
  const critical = health < 0.35 || proximity > 0.85 || endgame

  const captureLabel = isTrial
    ? 'Capture'
    : isDemon
    ? capturePhase >= capturePhases - 1
      ? 'Seal'
      : `Ritual ${capturePhase + 1}/${capturePhases}`
    : isSecret
      ? capturePhase >= capturePhases - 1
        ? 'Final seal'
        : `Capture ${capturePhase + 1}/${capturePhases}`
    : isBoss
      ? capturePhase >= capturePhases - 1
        ? 'Seal'
        : `Capture ${capturePhase + 1}/${capturePhases}`
      : 'Capture'

  const calmLabel = isDemon
    ? 'DEMON'
    : isBoss
      ? 'WARDEN'
      : isSecret
        ? 'ARCHIVIST'
      : isTrial
        ? 'TRIAL'
        : healthPct >= 70
          ? 'CALM'
          : healthPct >= 40
            ? 'ELEVATED'
            : 'PANIC'

  return (
    <div
      className={`hud ${isBoss ? 'hud-boss' : ''} ${isDemon ? 'hud-demon' : ''} ${isSecret ? 'hud-secret' : ''} ${isTrial ? 'hud-trial' : ''}`}
      id="ar-overlay"
    >
      <div className="hud-top">
        <div className="brand">
          <span className="brand-mark">◈</span>
          <span>GHOST LENS</span>
        </div>
        <div className="hud-top-right">
          <div className="mode-chip">{modeLabel}</div>
          {moonPhaseLabel && (
            <div
              className={`moon-chip ${moonCanSeal ? 'moon-full' : 'moon-waning'}`}
              title={
                moonCanSeal
                  ? 'Full moon — Empty Seat final seal allowed'
                  : 'Demon final seal waits for the full moon'
              }
            >
              {moonPhaseLabel}
              {isDemon && ghostVisible
                ? moonCanSeal
                  ? ' · seal ready'
                  : ' · seal waits'
                : ''}
            </div>
          )}
        </div>
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
          {calmLabel}
          {proximity > 0.5 && ghostVisible ? ' · APPROACHING' : ''}
          {stunned ? ' · STUNNED' : ''}
        </div>
      </div>

      {endgame && ghostVisible && (
        <div className="boss-phase-meter" aria-label="Seal progress">
          {Array.from({ length: capturePhases }, (_, i) => (
            <span
              key={i}
              className={`phase-pip ${i < capturePhase ? 'filled' : ''} ${isDemon ? 'demon-pip' : ''}`}
            />
          ))}
        </div>
      )}

      {isDemon && ghostVisible && ritualPolaroids.length > 0 && (
        <div className="ritual-strip" aria-label="Polaroids in the seal">
          {ritualPolaroids.map((p, i) => (
            <div
              key={p.id}
              className={`ritual-shot ${i < capturePhase ? 'burned' : 'waiting'}`}
              title={p.lore.name}
            >
              <img src={p.dataUrl} alt={p.lore.name} />
            </div>
          ))}
        </div>
      )}

      <div className="hud-mid">
        {!modelReady && loadingMsg && (
          <div className="status-pill warn">{loadingMsg}</div>
        )}
        {modelReady && (
          <div className="status-pill">
            {isDemon && ghostVisible ? (
              <>
                <strong>The Empty Seat</strong> at the playground · burn the photographs
                {!moonCanSeal ? ' · waits for the full moon' : ''}
              </>
            ) : isBoss && ghostVisible ? (
              <>
                <strong>Threshold Warden</strong> manifested · seal it in phases
              </>
            ) : isTrial && ghostVisible ? (
              <>
                <strong>The Thin One</strong> · lesser echo · trial · lens alone
              </>
            ) : isSecret && ghostVisible ? (
              <>
                <strong>The Pale Archivist</strong> · vault seal · Spookbox for the finish
              </>
            ) : detection.label ? (
              <>
                Sensing <strong>{detection.label}</strong> · {pct}%
                {!sustained && detection.label && ' · holding…'}
                {sustained && ghostVisible && anchored && ' · anchored'}
                {sustained && ghostVisible && !anchored && ' · manifested'}
              </>
            ) : detection.trialLabel ? (
              <>
                Sensing <strong>{detection.trialLabel}</strong> · trial / lesser echo
                {isTrial && ghostVisible ? ' · manifested' : ' · holding…'}
              </>
            ) : detection.playgroundLabel ? (
              <>
                Sensing <strong>{detection.playgroundLabel}</strong> · playground
                {playgroundUnlocked ? ' · endgame ground' : ''}
              </>
            ) : (
              <>
                Scanning for tombstone · ring · doll · lake · chair (trial) · {pct}% peak
                {bossUnlocked ? ' · warden unlocked' : ''}
                {playgroundUnlocked && !demonDefeated ? ' · playground unlocked' : ''}
              </>
            )}
          </div>
        )}
        {statusLine && <div className="status-pill dim">{statusLine}</div>}
        <div className="status-pill dim collection-pill">
          Sealed types {uniqueSealed}/4
          {bossUnlocked ? (isBoss ? ' · WARDEN FIGHT' : ' · warden ready') : ''}
          {playgroundUnlocked && !demonDefeated
            ? playgroundReady
              ? isDemon
                ? ' · DEMON FIGHT'
                : ' · playground ready'
              : ' · bring photos to playground'
            : ''}
          {demonDefeated ? ' · demon sealed' : ''}
        </div>
        {showArrivePlayground && onArrivePlayground && (
          <button
            type="button"
            className="btn arrive-playground-btn"
            onClick={onArrivePlayground}
          >
            I&apos;ve arrived at the playground
          </button>
        )}
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
          className={`btn capture-btn ${isBoss ? 'boss-capture' : ''} ${isDemon ? 'demon-capture' : ''}`}
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
