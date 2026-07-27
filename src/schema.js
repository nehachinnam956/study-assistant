// Validation layer (block-based).

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

const isStr = (v) => typeof v === 'string' && v.trim().length > 0
const isNum = (v) => typeof v === 'number' && Number.isFinite(v)

// Each validator returns a cleaned block, or null to drop it.
const validators = {
  flashcards(b) {
    if (!Array.isArray(b.cards)) return null
    const cards = b.cards
      .filter((c) => c && isStr(c.question) && isStr(c.answer))
      .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }))
    return cards.length ? { type: 'flashcards', cards } : null
  },

  quiz(b) {
    if (!Array.isArray(b.questions)) return null
    const questions = b.questions
      .filter((q) => {
        if (!q || !isStr(q.question)) return false
        if (!Array.isArray(q.options) || q.options.length < 2) return false
        if (!q.options.every(isStr)) return false
        const i = q.correctIndex
        return Number.isInteger(i) && i >= 0 && i < q.options.length
      })
      .map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex,
      }))
    return questions.length ? { type: 'quiz', questions } : null
  },

  checklist(b) {
    if (!Array.isArray(b.items)) return null
    const items = b.items.filter(isStr).map((s) => s.trim())
    return items.length ? { type: 'checklist', title: isStr(b.title) ? b.title.trim() : 'Checklist', items } : null
  },

  chart(b) {
    if (!Array.isArray(b.data)) return null
    const data = b.data
      .filter((d) => d && isStr(d.label) && isNum(d.value) && d.value >= 0)
      .map((d) => ({ label: d.label.trim(), value: d.value }))
    return data.length ? { type: 'chart', title: isStr(b.title) ? b.title.trim() : 'Chart', data } : null
  },

  note(b) {
    if (!isStr(b.text)) return null
    return { type: 'note', title: isStr(b.title) ? b.title.trim() : '', text: b.text.trim() }
  },
}

function validateBlock(b) {
  if (!b || typeof b !== 'object' || !isStr(b.type)) return null
  const validate = validators[b.type]
  if (!validate) return { type: b.type, unsupported: true } // keep for fallback renderer
  return validate(b)
}

export function validateStudySet(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.blocks)) {
    throw new ValidationError('The response was not in the expected format.')
  }

  const blocks = data.blocks.map(validateBlock).filter(Boolean)

  const hasUsable = blocks.some((b) => !b.unsupported)
  if (!hasUsable) {
    throw new ValidationError('No usable study content was found.')
  }

  return {
    title: isStr(data.title) ? data.title.trim() : 'Study set',
    blocks,
  }
}
