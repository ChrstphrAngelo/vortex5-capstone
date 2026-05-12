import { useEffect, useState, useRef, useCallback } from 'react'

// Module-level cache shared by all hook calls. Keyed by URL.
// Survives navigations within a session — cleared on page reload.
const cache = new Map()
// Tracks in-flight requests so concurrent mounts don't duplicate work.
const inFlight = new Map()

/**
 * Cached fetch with optional polling.
 * Returns cached data immediately if present, refetches in the background.
 *
 * @param {string|null} url      - URL to fetch. Null/undefined disables the fetch.
 * @param {string|null} token    - Bearer token; sent as Authorization header.
 * @param {object} opts
 * @param {number|null} opts.pollInterval - Re-fetch every N ms while mounted.
 */
export function useCachedFetch(url, token, { pollInterval = null } = {}) {
  const cached = url ? cache.get(url) : null
  const [data, setData] = useState(cached?.data ?? null)
  const [error, setError] = useState(null)
  // If we already have cached data, we're not "loading" — we have something to show.
  const [loading, setLoading] = useState(!cached)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!url) return null

    // Coalesce simultaneous fetches for the same URL.
    if (inFlight.has(url)) {
      try {
        const json = await inFlight.get(url)
        if (!mountedRef.current) return null
        setData(json)
        setError(null)
        return json
      } catch (err) {
        if (mountedRef.current) setError(err.message)
        return null
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    const promise = (async () => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(url, { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
      return json
    })()

    inFlight.set(url, promise)

    try {
      const json = await promise
      cache.set(url, { data: json, ts: Date.now() })
      if (!mountedRef.current) return json
      setData(json)
      setError(null)
      return json
    } catch (err) {
      if (mountedRef.current) setError(err.message)
      return null
    } finally {
      inFlight.delete(url)
      if (mountedRef.current) setLoading(false)
    }
  }, [url, token])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    let interval
    if (pollInterval) interval = setInterval(fetchData, pollInterval)
    return () => {
      mountedRef.current = false
      if (interval) clearInterval(interval)
    }
  }, [fetchData, pollInterval])

  return { data, loading, error, refetch: fetchData }
}

/** Manually invalidate a cached URL (e.g. after a mutation). */
export function invalidateCache(url) {
  cache.delete(url)
}
