// A plain summary card: an optional title and a paragraph of key ideas.
export default function Note({ block }) {
  return (
    <div className="note">
      {block.title && <div className="note__title">{block.title}</div>}
      <p className="note__text">{block.text}</p>
    </div>
  )
}
