import { useRef, useState, useCallback, useEffect } from 'react'
import { generateStudySet } from './api.js'
import { validateStudySet, ValidationError } from './schema.js'
import { loadSessions, addSession, updateSession, deleteSession } from './storage.js'
import TopicInput from './components/TopicInput.jsx'
import StudySet from './components/StudySet.jsx'
import RefineBar from './components/RefineBar.jsx'
import SessionList from './components/SessionList.jsx'
import { LoadingState, ErrorState, EmptyState } from './components/States.jsx'

const STATUS = { IDLE: 'idle', LOADING: 'loading', READY: 'ready', ERROR: 'error' }

const makeId = () =>
  (crypto?.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(16).slice(2)}`

export default function App() {
  // Main flow
  const [status, setStatus] = useState(STATUS.IDLE)
  const [studySet, setStudySet] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')

  // Refine has its own inline state so a failed refine keeps the current set on screen
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState('')

  // Sessions
  const [sessions, setSessions] = useState([])
  const [activeSessionId, setActiveSessionId] = useState(null)

  // Theme
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('recall.theme')
      if (saved) return saved
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // Stale-response guard, shared by BOTH generate and refine: any newer request
  // (of either kind) invalidates older ones, so results can't arrive out of order.
  const requestIdRef = useRef(0)
  const abortRef = useRef(null)

  useEffect(() => setSessions(loadSessions()), [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('recall.theme', theme)
    } catch {}
  }, [theme])

  // Generate a fresh set 
  const run = useCallback(async (prompt, simulate) => {
    const trimmed = (prompt || '').trim()
    if (!trimmed && !simulate) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const myId = ++requestIdRef.current

    setLastPrompt(trimmed)
    setRefineError('')
    setStatus(STATUS.LOADING)
    setErrorMessage('')

    try {
      const raw = await generateStudySet({ prompt: trimmed, simulate, signal: controller.signal })
      if (myId !== requestIdRef.current) return // a newer request won

      const validated = validateStudySet(raw)
      setStudySet(validated)
      setStatus(STATUS.READY)

      // Save it as a session so it survives a refresh.
      const session = {
        id: makeId(),
        label: validated.title || trimmed.slice(0, 40) || 'Study set',
        createdAt: Date.now(),
        data: validated,
      }
      setSessions(addSession(session))
      setActiveSessionId(session.id)
    } catch (err) {
      if (err.name === 'AbortError') return
      if (myId !== requestIdRef.current) return
      setErrorMessage(
        err instanceof ValidationError
          ? `The model's answer didn't fit the format (${err.message}) Try again.`
          : err.message || 'Something went wrong.'
      )
      setStatus(STATUS.ERROR)
    }
  }, [])

  //Refine the existing set 
  const refine = useCallback(
    async (instruction) => {
      if (!studySet) return

      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const myId = ++requestIdRef.current

      setRefining(true)
      setRefineError('')

      try {
        const raw = await generateStudySet({
          refine: instruction,
          current: studySet,
          prompt: lastPrompt,
          signal: controller.signal,
        })
        if (myId !== requestIdRef.current) return

        const validated = validateStudySet(raw)
        setStudySet(validated)
        if (activeSessionId) setSessions(updateSession(activeSessionId, validated))
        setRefining(false)
      } catch (err) {
        if (err.name === 'AbortError') return
        if (myId !== requestIdRef.current) return
        // Keep the current set visible; just report the refine failure inline.
        setRefineError(
          err instanceof ValidationError ? `Couldn't apply that (${err.message})` : err.message || 'Refine failed.'
        )
        setRefining(false)
      }
    },
    [studySet, lastPrompt, activeSessionId]
  )

  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort()
    requestIdRef.current++
    setStatus(STATUS.IDLE)
    setStudySet(null)
    setErrorMessage('')
    setRefining(false)
    setRefineError('')
    setActiveSessionId(null)
  }

  const loadSession = (s) => {
    if (abortRef.current) abortRef.current.abort()
    requestIdRef.current++ // invalidate anything in flight
    setStudySet(s.data)
    setStatus(STATUS.READY)
    setActiveSessionId(s.id)
    setErrorMessage('')
    setRefineError('')
    setRefining(false)
  }

  const removeSession = (id) => {
    setSessions(deleteSession(id))
    if (id === activeSessionId) setActiveSessionId(null)
  }

  return (
    <div className="app">
      <header className="app__header">
        <span className="app__mark">Recall</span>
        <span className="app__tagline">notes in, study set out</span>
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>

      <main className="app__main">
        <TopicInput
          onGenerate={run}
          busy={status === STATUS.LOADING}
          onReset={handleReset}
          showReset={status === STATUS.READY || status === STATUS.ERROR}
        />

        {status === STATUS.IDLE && <EmptyState />}
        {status === STATUS.LOADING && <LoadingState />}
        {status === STATUS.ERROR && <ErrorState message={errorMessage} onRetry={() => run(lastPrompt)} />}
        {status === STATUS.READY && studySet && (
          <>
            <StudySet data={studySet} />
            <RefineBar onRefine={refine} busy={refining} error={refineError} />
          </>
        )}

        <SessionList
          sessions={sessions}
          activeId={activeSessionId}
          onLoad={loadSession}
          onDelete={removeSession}
        />
      </main>
    </div>
  )
}
