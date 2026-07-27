import { useState } from 'react'

// Follow-up prompt that edits the existing study set instead of regenerating.
// Shows its own inline busy/error state so a failed refine never wipes the set
// the user is looking at.
const SUGGESTIONS = ['Make the quiz harder', 'Add 3 more flashcards', 'Simplify the wording']

export default function RefineBar({ onRefine, busy, error }) {
  const [text, setText] = useState('')

  const submit = () => {
    const t = text.trim()
    if (t && !busy) {
      onRefine(t)
      setText('')
    }
  }

  return (
    <div className="refine">
      <div className="refine__label">Refine this set</div>
      <div className="refine__row">
        <input
          className="refine__input"
          value={text}
          placeholder="e.g. make the quiz harder"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          disabled={busy}
        />
        <button className="btn btn--primary" onClick={submit} disabled={busy || !text.trim()}>
          {busy ? 'Refining…' : 'Refine'}
        </button>
      </div>
      <div className="refine__chips">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip" onClick={() => onRefine(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>
      {error && <p className="refine__error">{error}</p>}
    </div>
  )
}
