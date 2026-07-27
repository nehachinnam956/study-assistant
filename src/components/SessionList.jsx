// Lists saved study sets. Clicking one reloads it without calling the model;
// the trash button removes it. Purely presentational — App owns the data.

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function SessionList({ sessions, activeId, onLoad, onDelete }) {
  if (sessions.length === 0) return null

  return (
    <section className="sessions">
      <div className="sessions__head">Saved sets</div>
      <ul className="sessions__list">
        {sessions.map((s) => (
          <li key={s.id} className={`session ${s.id === activeId ? 'is-active' : ''}`}>
            <button className="session__open" onClick={() => onLoad(s)}>
              <span className="session__label">{s.label}</span>
              <span className="session__time">{timeAgo(s.createdAt)}</span>
            </button>
            <button
              className="session__del"
              onClick={() => onDelete(s.id)}
              aria-label={`Delete ${s.label}`}
              title="Delete"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
