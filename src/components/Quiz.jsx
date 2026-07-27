import { useState, useEffect } from 'react'

// A multiple-choice quiz. The signature feature is the retry loop: after you
// submit, you can re-test just the questions you got wrong, which is the whole
// point of studying. State we track:
//   pool     — the questions currently being asked (all, or just the wrong ones)
//   selected — chosen option index per question in the pool (or null)
//   submitted — whether we've graded yet
export default function Quiz({ questions }) {
  const [pool, setPool] = useState(questions)
  const [selected, setSelected] = useState(() => questions.map(() => null))
  const [submitted, setSubmitted] = useState(false)

  // If a new study set arrives, start fresh.
  useEffect(() => {
    setPool(questions)
    setSelected(questions.map(() => null))
    setSubmitted(false)
  }, [questions])

  const choose = (qIndex, optIndex) => {
    if (submitted) return
    setSelected((prev) => {
      const next = [...prev]
      next[qIndex] = optIndex
      return next
    })
  }

  const allAnswered = selected.every((s) => s !== null)
  const score = pool.reduce(
    (n, q, i) => (selected[i] === q.correctIndex ? n + 1 : n),
    0
  )
  const wrong = pool.filter((q, i) => selected[i] !== q.correctIndex)

  const restart = (nextPool) => {
    setPool(nextPool)
    setSelected(nextPool.map(() => null))
    setSubmitted(false)
  }

  return (
    <div className="quiz">
      {pool.map((q, qi) => {
        return (
          <fieldset className="quiz__q" key={qi}>
            <legend className="quiz__prompt">
              <span className="quiz__num">{qi + 1}</span>
              {q.question}
            </legend>
            <div className="quiz__options">
              {q.options.map((opt, oi) => {
                const isChosen = selected[qi] === oi
                const isCorrect = q.correctIndex === oi
                // After grading, colour the right answer and any wrong pick.
                let stateClass = ''
                if (submitted) {
                  if (isCorrect) stateClass = 'is-correct'
                  else if (isChosen) stateClass = 'is-wrong'
                }
                return (
                  <label key={oi} className={`option ${isChosen ? 'is-chosen' : ''} ${stateClass}`}>
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      checked={isChosen}
                      onChange={() => choose(qi, oi)}
                      disabled={submitted}
                    />
                    <span>{opt}</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        )
      })}

      {!submitted ? (
        <button
          className="btn btn--primary"
          onClick={() => setSubmitted(true)}
          disabled={!allAnswered}
        >
          {allAnswered ? 'Check answers' : `Answer all ${pool.length} to check`}
        </button>
      ) : (
        <div className="quiz__result">
          <p className="quiz__score">
            You got <strong>{score}</strong> of {pool.length} right.
          </p>
          <div className="quiz__result-actions">
            {wrong.length > 0 && (
              <button className="btn btn--primary" onClick={() => restart(wrong)}>
                Re-test {wrong.length} wrong
              </button>
            )}
            <button className="btn btn--ghost" onClick={() => restart(questions)}>
              Restart full quiz
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
