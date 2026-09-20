import type { VoiceHint } from '../lore/voiceHints'
import { VOICE_HINTS } from '../lore/voiceHints'
import type { StrangerClue } from '../shop/strangerClues'
import { STRANGER_CLUES } from '../shop/strangerClues'

interface Props {
  open: boolean
  onClose: () => void
  heardVoiceIds: Set<string>
  heardClueIds: Set<string>
}

export function WhisperJournal({
  open,
  onClose,
  heardVoiceIds,
  heardClueIds,
}: Props) {
  if (!open) return null

  const voices = VOICE_HINTS.filter((h) => heardVoiceIds.has(h.id))
  const clues = STRANGER_CLUES.filter((c) => heardClueIds.has(c.id))

  return (
    <div className="whisper-journal" role="dialog" aria-label="Whisper journal">
      <header className="wj-header">
        <div>
          <p className="wj-kicker">FIELD NOTES</p>
          <h2>Whisper Journal</h2>
          <p className="wj-sub">
            Voices: {voices.length}/{VOICE_HINTS.length} · Strangers:{' '}
            {clues.length}/{STRANGER_CLUES.length}
          </p>
        </div>
        <button type="button" className="btn ghost-btn" onClick={onClose}>
          Close
        </button>
      </header>

      <section className="wj-section">
        <h3>Disembodied voices</h3>
        {voices.length === 0 ? (
          <p className="wj-empty">No voices yet. Hunt at dusk — they speak rarely.</p>
        ) : (
          <ul className="wj-list">
            {voices.map((h: VoiceHint) => (
              <li key={h.id} className="wj-entry voice">
                <blockquote>&ldquo;{h.line}&rdquo;</blockquote>
                <p className="wj-meta">
                  <span>{h.when}</span>
                  <span>·</span>
                  <span>{h.where}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="wj-section">
        <h3>Stranger whispers</h3>
        {clues.length === 0 ? (
          <p className="wj-empty">
            No strangers yet. Voices hint when and where — frame the right object.
          </p>
        ) : (
          <ul className="wj-list">
            {clues.map((c: StrangerClue) => (
              <li key={c.id} className="wj-entry stranger">
                <p className="wj-who">{c.stranger}</p>
                <blockquote>&ldquo;{c.whisper}&rdquo;</blockquote>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
