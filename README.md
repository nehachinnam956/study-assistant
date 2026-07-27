# Recall — a study assistant

Paste your notes or name a topic, and the app generates a study set: **flashcards**,
a **quiz**, and (when they help) a **checklist**, a **chart**, and a **key-idea note**.
Flip cards, take the quiz, re-test what you missed, refine the set with follow-up
prompts, and reload past sets after a refresh.

The model returns **structured JSON**, not chat text. The frontend parses it,
validates it, and renders it as interactive components. If the model returns
something broken, the app recovers instead of crashing — that's the part I
focused on most.

---

## Setup

**Prerequisites:** Node 18+ (developed on Node 22).

```bash
npm install
cp .env.example .env      # then paste your Groq key into .env
npm start
```

Open **http://localhost:5173**.

`npm start` runs two things at once (via `concurrently`):

- the **Express API server** on `:3001` (holds the API key, calls the model)
- the **Vite dev server** on `:5173` (the React app; proxies `/api` → `:3001`)

**Get a free Groq key:** https://console.groq.com/keys — free tier, no card.
Prefer another provider? Swap the one `fetch` call in `server/index.js`; the
frontend doesn't change.

---

## Usage

1. Paste notes or type a topic, then **Generate study set** (or ⌘/Ctrl + Enter).
2. **Flashcards** — click a card (or press Space) to flip; ← / → to move.
3. **Quiz** — answer each question, **Check answers**, then **Re-test wrong**.
4. **Refine** — type a follow-up ("make the quiz harder", "add 3 more cards") to edit the set in place.
5. **Saved sets** (bottom) — every set is saved; click to reload, ✕ to delete. Survives a refresh.
6. **Theme** — ☾ / ☀ toggle in the header; remembers your choice.
7. **Test failure handling** (link under the input) — force malformed / wrong-shape / empty / unknown-block / slow responses to see the app recover.

---

## How it works

**API key safety.** The browser only ever calls our own `/api/generate`. Only
the Express server sees `GROQ_API_KEY`, and it lives in `.env` (gitignored). The
key never reaches the client bundle.

**Structured output.** The server asks Groq for a single JSON object
(`response_format: { type: "json_object" }`) of shape `{ title, blocks: [...] }`,
where each block is tagged with a `type`.

**Validation before render (`src/schema.js`).** Nothing reaches React state
until it's validated. Each block is checked by a per-type validator; a
malformed block is dropped, an unknown type is kept but flagged so it renders a
fallback, and if nothing usable is left we throw and show a retry screen.

**Renderer registry (`src/components/StudySet.jsx`).** A plain lookup maps each
block `type` to a component, with an `Unsupported` fallback for anything we don't
recognise. Adding a new block type is one component plus one line here — no
changes to the data flow.

**No stale overwrites (`src/App.jsx`).** Every request (generate *and* refine)
gets an incrementing id and an `AbortController`. A new request aborts the old
fetch, and a resolved response is only applied if its id is still the latest — so
a slow older response can never replace a newer one.

**Refine keeps your work.** Refine runs on its own inline state, so a failed
refine shows an error but leaves the current set on screen instead of wiping it.

**Sessions (`src/storage.js`).** Each set is saved to `localStorage`; reads and
writes are wrapped in try/catch so private mode or a full quota degrades quietly.

**Theming.** All colours are CSS variables; dark mode is a single override block,
defaulting to your OS preference and remembered across visits.

---

## AI-usage note

I used Claude as a coding assistant to build this project, then worked through
the code to understand how each part fits together. I can explain and extend the
key decisions: how the Express proxy keeps the API key off the client, why every
model response is validated before rendering, how the request-id and
AbortController guard prevents a stale response from overwriting a newer one, and
how the renderer registry maps block types to components. I chose the study
assistant, the block structure, and the failure-handling approach, and reviewed
the code as it came together.

> Replace this paragraph with your own honest account of what you used AI for
> before you submit — the brief rewards honesty here, and you'll be asked about
> the code live.

---

## Known limitations

- **Model quality varies.** Validation catches broken *shapes*, not wrong
  *facts* — the footer reminds users to check anything important.
- **No streaming.** The set appears all at once after generation (see next).
- **Session interaction state isn't saved.** Reloading a set restores its
  content but resets which cards you flipped or answered.
- **Simulation panel ships in the build.** Handy for the demo; I'd hide it
  behind a dev flag for production.
- **English-tuned prompt.**

## What I'd do next

- **Streaming:** stream tokens for live progress, then parse and render blocks
  once the JSON completes (partial JSON isn't safely renderable mid-stream).
- Persist interaction state (flipped/answered) inside each saved session.
- Spaced repetition: prioritise cards you keep getting wrong across sessions.


