# Recall — a study assistant

Paste your notes or name a topic, and Recall turns it into a study set:
**flashcards**, a **quiz**, and — when they help — a **checklist**, a **chart**,
and a **key-idea note**. Flip cards, take the quiz, re-test what you missed,
refine the set with follow-up prompts, and reload past sets after a refresh.

The model returns **structured JSON**, not chat text. The frontend parses it,
validates it, and renders it as interactive components. When the model returns
something broken — malformed, wrong-shaped, empty, or slow — the app recovers
instead of crashing. That failure handling is the part I focused on most.

**Stack:** React (Vite) · Express · Groq · plain CSS.

---

## Quick start

**Prerequisites:** Node 18+ (developed on Node 22).

```bash
npm install
cp .env.example .env      # then paste your Groq key into .env
npm start                 # opens the app at http://localhost:5173
```

`npm start` launches two processes together (via `concurrently`):

| Process           | Port   | Role                                             |
| ----------------- | ------ | ------------------------------------------------ |
| Express API server | `3001` | Holds the API key and calls the model            |
| Vite dev server    | `5173` | Serves the React app; proxies `/api` → `:3001`   |

**Get a free Groq key:** https://console.groq.com/keys (free tier, no card).
Prefer another provider? Swap the single `fetch` call in `server/index.js` — the
frontend doesn't change.

---

## Project structure

```
study-assistant/
├── server/
│   └── index.js          # Express proxy: holds the key, calls Groq, forces JSON
├── src/
│   ├── App.jsx           # state machine + stale-response guard + sessions/theme
│   ├── api.js            # abortable fetch wrapper
│   ├── schema.js         # validates and salvages the model's output
│   ├── storage.js        # saved sessions (localStorage)
│   ├── index.css         # design tokens, dark mode, all styles
│   └── components/
│       ├── TopicInput.jsx    # free-form input + failure-test panel
│       ├── StudySet.jsx      # renderer registry: block type → component
│       ├── Flashcards.jsx    # flip + keyboard navigation
│       ├── Quiz.jsx          # scoring + re-test wrong answers
│       ├── Checklist.jsx     # check-off list with progress
│       ├── Chart.jsx         # dependency-free bar chart
│       ├── Note.jsx          # key-idea card
│       ├── RefineBar.jsx     # follow-up prompts that edit the set
│       ├── SessionList.jsx   # reload / delete saved sets
│       └── States.jsx        # loading / error / empty
├── vite.config.js        # dev proxy /api → :3001
├── .env.example
└── package.json
```

---

## Usage

1. Paste notes or type a topic, then **Generate study set** (or ⌘/Ctrl + Enter).
2. **Flashcards** — click a card (or press Space) to flip; ← / → to move.
3. **Quiz** — answer each question, **Check answers**, then **Re-test wrong**.
4. **Refine** — a follow-up like "make the quiz harder" or "add 3 more cards" edits the set in place.
5. **Saved sets** — every set is saved; click to reload, ✕ to delete. Survives a refresh.
6. **Theme** — ☾ / ☀ toggle in the header; remembers your choice.
7. **Test failure handling** — the link under the input forces bad responses so you can see the app recover.

---

## How it works

**API key safety.** The browser only ever calls our own `/api/generate`. Only
the Express server sees `GROQ_API_KEY`, and it lives in `.env` (gitignored). The
key never reaches the client bundle.

**Structured output.** The server asks Groq for a single JSON object
(`response_format: { type: "json_object" }`) of shape `{ title, blocks: [...] }`,
where each block carries a `type`.

**Validation before render (`src/schema.js`).** Nothing reaches React state
until it's validated. Each block passes through a per-type validator: a malformed
block is dropped, an unknown type is kept but flagged for a fallback, and if
nothing usable is left the app throws and shows a retry screen.

**Renderer registry (`src/components/StudySet.jsx`).** A plain lookup maps each
block `type` to a component, with an `Unsupported` fallback for anything
unrecognised. Adding a new block type is one component plus one line — no changes
to the data flow.

**No stale overwrites (`src/App.jsx`).** Every request — generate *and* refine —
gets an incrementing id and an `AbortController`. A new request aborts the old
fetch, and a resolved response is applied only if its id is still the latest, so
a slow older response can never replace a newer one.

**Refine keeps your work.** Refine runs on its own inline state, so a failed
refine shows an error but leaves the current set on screen instead of wiping it.

**Sessions (`src/storage.js`).** Each set is saved to `localStorage`, with every
read and write wrapped in try/catch so private mode or a full quota degrades
quietly instead of crashing.

**Theming.** Every colour is a CSS variable, so dark mode is a single override
block — it defaults to your OS preference and is remembered across visits.

---

## Handling bad AI output

The model *will* sometimes return something broken. Each case has a defined
outcome, and none of them crash the app:

| What goes wrong          | What the app does                                  |
| ------------------------ | -------------------------------------------------- |
| Malformed JSON           | Caught on parse → error screen with **Retry**      |
| Wrong shape / empty      | Rejected by validation → error screen with **Retry** |
| Unknown block type       | Kept and rendered as a graceful fallback notice    |
| Slow / no response       | 30s server timeout; cancellable by a new request   |
| Network / server error   | The real error message is shown, not a blank screen |
| Stale (out-of-order) response | Discarded by the request-id check             |

You can trigger each of these on demand from the **Test failure handling** panel.

---

## AI-usage note

I used Claude as a coding assistant to build this project, then worked through
the code to understand how each part fits together. I can explain and extend the
key decisions: how the Express proxy keeps the API key off the client, why every
model response is validated before rendering, how the request-id and
`AbortController` guard prevents a stale response from overwriting a newer one,
and how the renderer registry maps block types to components. I chose the study
assistant, the block structure, and the failure-handling approach, and reviewed
the code as it came together.

---

## Known limitations

- **Model quality varies.** Validation catches broken *shapes*, not wrong
  *facts* — the footer reminds users to check anything important.
- **No streaming.** The set appears all at once after generation (see below).
- **Session interaction state isn't saved.** Reloading a set restores its
  content but resets which cards you flipped or answered.
- **The failure-test panel ships in the build.** Handy for the demo; in
  production I'd gate it behind a dev flag.
- **English-tuned prompt.**

## What I'd do next

- **Streaming:** stream tokens for live progress, then parse and render the
  blocks once the JSON completes (partial JSON isn't safely renderable mid-stream).
- Persist interaction state (flipped / answered) inside each saved session.
- Spaced repetition: prioritise cards you keep getting wrong across sessions.

