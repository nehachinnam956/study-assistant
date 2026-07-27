import { useState, useEffect, useCallback } from 'react'

// Flip through cards one at a time. The flip is the app's signature interaction.
// Keyboard: ← / → move between cards, Space or Enter flips the current one.
export default function Flashcards({ cards }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const total = cards.length
  const card = cards[index]

  const go = useCallback(
    (delta) => {
      setFlipped(false) // always land on the question side of the next card
      setIndex((i) => (i + delta + total) % total)
    },
    [total]
  )

  const flip = useCallback(() => setFlipped((f) => !f), [])

  // Reset when a brand-new set arrives (different length is a good-enough signal).
  useEffect(() => {
    setIndex(0)
    setFlipped(false)
  }, [cards])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') go(1)
    else if (e.key === 'ArrowLeft') go(-1)
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      flip()
    }
  }

  return (
    <div className="cards">
      <div className="cards__counter">
        Card {index + 1} of {total}
      </div>

      {/* The card is a button so it's focusable and keyboard-operable for free. */}
      <button
        className={`card ${flipped ? 'is-flipped' : ''}`}
        onClick={flip}
        onKeyDown={onKeyDown}
        aria-label={flipped ? 'Answer. Press space to see the question.' : 'Question. Press space to reveal the answer.'}
      >
        <div className="card__inner">
          <div className="card__face card__face--front">
            <span className="card__tag">Question</span>
            <p className="card__text">{card.question}</p>
            <span className="card__hint">Tap to flip</span>
          </div>
          <div className="card__face card__face--back">
            <span className="card__tag">Answer</span>
            <p className="card__text">{card.answer}</p>
            <span className="card__hint">Tap to flip</span>
          </div>
        </div>
      </button>

      <div className="cards__nav">
        <button className="btn btn--ghost" onClick={() => go(-1)} disabled={total < 2}>
          ← Prev
        </button>
        <button className="btn btn--ghost" onClick={() => go(1)} disabled={total < 2}>
          Next →
        </button>
      </div>
    </div>
  )
}
