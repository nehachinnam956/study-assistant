// Session persistence (localStorage).
const KEY = 'recall.sessions.v1'

export function loadSessions() {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function persist(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // out of space or storage disabled — nothing we can do; keep the app running
  }
}

// Insert a new session at the top (newest first).
export function addSession(session) {
  const list = loadSessions()
  const next = [session, ...list].slice(0, 50) // cap history so storage can't grow forever
  persist(next)
  return next
}

// Replace the data of an existing session (used after a refine).
export function updateSession(id, data) {
  const list = loadSessions().map((s) => (s.id === id ? { ...s, data } : s))
  persist(list)
  return list
}

export function deleteSession(id) {
  const list = loadSessions().filter((s) => s.id !== id)
  persist(list)
  return list
}
