// ---------------------------------------------------------------------------
// Frontend API wrapper.
//
// Sends either a generate request { prompt } or a refine request
// { refine, current } to our backend. Accepts an AbortSignal so App can cancel
// an in-flight request when a newer one starts.
// ---------------------------------------------------------------------------

export async function generateStudySet({ prompt, simulate, refine, current, signal }) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, simulate, refine, current }),
    signal,
  })

  if (!res.ok) {
    let message = `Request failed (${res.status}).`
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // response body wasn't JSON — keep the generic message
    }
    throw new Error(message)
  }

  // Throws on malformed JSON (our "malformed" simulation) — App catches it.
  return res.json()
}
