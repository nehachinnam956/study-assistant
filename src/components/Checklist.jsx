import { useState, useEffect } from 'react'

// A check-off list of things to review. Stateful: each item can be ticked, and
// I show progress. State is local to the block and resets when a new set loads.
export default function Checklist({ block }) {
  const [checked, setChecked] = useState(() => block.items.map(() => false))

  useEffect(() => {
    setChecked(block.items.map(() => false))
  }, [block])

  const toggle = (i) =>
    setChecked((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })

  const done = checked.filter(Boolean).length

  return (
    <div className="checklist">
      <div className="checklist__head">
        <span>{block.title}</span>
        <span className="checklist__count">
          {done}/{block.items.length}
        </span>
      </div>
      <ul className="checklist__list">
        {block.items.map((item, i) => (
          <li key={i}>
            <label className={`check ${checked[i] ? 'is-done' : ''}`}>
              <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
