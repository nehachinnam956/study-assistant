import { useState } from 'react'
const SIMULATIONS = [
  { key: 'malformed', label: 'Malformed JSON' },
  { key: 'wrongShape', label: 'Wrong shape' },
  { key: 'empty', label: 'Empty' },
  { key: 'unknownBlock', label: 'Unknown block' },
  { key: 'slow', label: 'Slow (6s)' },
]

export default function TopicInput({ onGenerate, busy, onReset, showReset }) {
  const [text, setText] = useState('')
  const [showSim, setShowSim] = useState(false)

  const submit = (simulate) => onGenerate(text, simulate)

  // Cmd/Ctrl + Enter submits, which feels natural in a textarea.
  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !busy) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="input">
      <label className="input__label" htmlFor="notes">
        Paste notes or name a topic
      </label>
      <textarea
        id="notes"
        className="input__field"
        placeholder="e.g. the water cycle, or paste a page of your biology notes…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={5}
      />

      <div className="input__actions">
        <button
          className="btn btn--primary"
          onClick={() => submit()}
          disabled={busy || !text.trim()}
        >
          {busy ? 'Generating…' : 'Generate study set'}
        </button>

        {showReset && (
          <button className="btn btn--ghost" onClick={onReset} disabled={busy}>
            Start over
          </button>
        )}

        <button
          className="btn btn--link"
          onClick={() => setShowSim((s) => !s)}
          type="button"
          aria-expanded={showSim}
        >
          {showSim ? 'Hide' : 'Test failure handling'}
        </button>
      </div>

      {showSim && (
        <div className="sim">
          <p className="sim__note">Force a bad response to see how the app recovers:</p>
          <div className="sim__buttons">
            {SIMULATIONS.map((s) => (
              <button
                key={s.key}
                className="btn btn--sim"
                onClick={() => submit(s.key)}
                disabled={busy}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="input__hint">Tip: press ⌘/Ctrl + Enter to generate.</p>
    </section>
  )
}
