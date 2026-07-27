// The three non-content states. Kept together because they're small and share
// the same visual shell. Copy follows the design guidance: errors say what
// happened and how to fix it, and the empty state invites an action.

export function LoadingState() {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="state__spinner" aria-hidden="true" />
      <p className="state__title">Building your study set…</p>
      <p className="state__sub">Reading the notes and writing questions.</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title">That didn't work</p>
      <p className="state__sub">{message}</p>
      {onRetry && (
        <button className="btn btn--primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="state state--empty">
      <p className="state__title">Nothing to study yet</p>
      <p className="state__sub">
        Paste some notes or type a topic above, then generate a set of flashcards and a quiz.
      </p>
    </div>
  )
}
