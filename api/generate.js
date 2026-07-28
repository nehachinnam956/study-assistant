// ---------------------------------------------------------------------------
// Vercel serverless function.
//
// Locally, `npm start` uses the Express server in server/index.js (via the
// Vite dev proxy). On Vercel, there's no long-running server — instead, any
// file in /api becomes its own endpoint. This file is the production
// equivalent of server/index.js's POST /api/generate route, adapted to
// Vercel's (req, res) function signature. The logic is intentionally the same
// as the Express version; see the README for why it's duplicated rather than
// shared.
// ---------------------------------------------------------------------------

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You turn a student's notes or topic into study material.
Return ONLY a JSON object of this shape:
{
  "title": string,
  "blocks": [ ...one or more of the block types below... ]
}

Block types (include the ones that fit the material):
- Flashcards: { "type": "flashcards", "cards": [ { "question": string, "answer": string } ] }   // 5-8 cards
- Quiz:       { "type": "quiz", "questions": [ { "question": string, "options": [string,string,string,string], "correctIndex": number } ] }  // 4-6 questions, 0-based correctIndex
- Checklist:  { "type": "checklist", "title": string, "items": [string] }   // key things to review
- Chart:      { "type": "chart", "title": string, "data": [ { "label": string, "value": number } ] }  // e.g. relative importance of subtopics, values 0-100
- Note:       { "type": "note", "title": string, "text": string }   // a short key-idea summary

Always include at least a flashcards block and a quiz block. Add checklist,
chart, or note blocks when they genuinely help. Output only the JSON object.`

const REFINE_SYSTEM = `You edit an existing study set. You will be given the
current study set as JSON and an instruction. Apply the instruction and return
the COMPLETE updated JSON object in the exact same shape ({ "title", "blocks" }
with the same block types). Keep everything the instruction doesn't ask you to
change. Output only the JSON object.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const { prompt, simulate, refine, current } = req.body || {}

  // --- Simulated failures (for demos) ----------------------------------
  if (simulate === 'malformed') {
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).send('{ "title": "Broken", "blocks": [ {')
  }
  if (simulate === 'wrongShape') {
    return res.status(200).json({ title: 'Wrong shape', blocks: 'not an array' })
  }
  if (simulate === 'empty') {
    return res.status(200).json({})
  }
  if (simulate === 'unknownBlock') {
    return res.status(200).json({
      title: 'Unknown block demo',
      blocks: [
        { type: 'note', title: 'This renders', text: 'The block below has an unknown type.' },
        { type: 'hologram', mystery: true },
      ],
    })
  }
  if (simulate === 'slow') {
    await new Promise((r) => setTimeout(r, 6000))
  }

  const isRefine = refine && current
  const userPrompt = isRefine
    ? `Current study set:\n${JSON.stringify(current)}\n\nInstruction: ${refine}`
    : prompt

  if (!isRefine && (!prompt || typeof prompt !== 'string' || !prompt.trim())) {
    return res.status(400).json({ error: 'Please enter some notes or a topic.' })
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY
  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: 'Server is missing GROQ_API_KEY. Set it in the Vercel project\'s environment variables.',
    })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000) // stay under Vercel's function limit

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: isRefine ? REFINE_SYSTEM : SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    })
    clearTimeout(timeout)

    if (!upstream.ok) {
      const detail = await upstream.text()
      console.error('Groq error:', upstream.status, detail)
      return res.status(502).json({ error: `The model service returned an error (${upstream.status}).` })
    }

    const completion = await upstream.json()
    const content = completion?.choices?.[0]?.message?.content
    if (!content) {
      return res.status(502).json({ error: 'The model returned an empty response.' })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      return res.status(502).json({ error: 'The model returned invalid JSON.' })
    }
    return res.status(200).json(parsed)
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'The model took too long to respond.' })
    }
    console.error('Unexpected server error:', err)
    return res.status(500).json({ error: 'Something went wrong on the server.' })
  }
}