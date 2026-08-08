import { useCallback, useEffect, useRef, useState } from 'react'
import type { DeviationEvent, Season, SessionState, Task } from '../types/cognitiveHub'
import { SESSION_STORAGE_KEY } from '../types/cognitiveHub'
import { generateId } from '../utils/id'
import { generateInitialPath } from '../utils/pacingAlgorithm'
import { handleDeviation } from '../utils/reactiveAlgorithm'
import { playEndChime, playStartChime } from '../utils/sound'

const TICK_MS = 250

function loadPersistedSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SessionState) : null
  } catch {
    return null
  }
}

function persistSession(session: SessionState | null): void {
  try {
    if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // localStorage unavailable (private browsing / quota exceeded) — session just won't persist.
  }
}

export function usePacingSession() {
  const [session, setSession] = useState<SessionState | null>(() => loadPersistedSession())
  const [now, setNow] = useState(() => Date.now())
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    persistSession(session)
  }, [session])

  const elapsedTime = !session
    ? 0
    : session.isActive && !session.isPaused && session.startTime !== null
      ? session.elapsedTime + (now - session.startTime)
      : session.elapsedTime

  const totalDurationMs = session?.path.totalDurationMs ?? 0
  const remainingTime = Math.max(totalDurationMs - elapsedTime, 0)
  const isComplete = session !== null && elapsedTime >= totalDurationMs

  const wasCompleteRef = useRef(isComplete)
  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) playEndChime()
    wasCompleteRef.current = isComplete
  }, [isComplete])

  useEffect(() => {
    const shouldTick = session?.isActive && !session.isPaused && !isComplete
    if (!shouldTick) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    intervalRef.current = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [session?.isActive, session?.isPaused, isComplete])

  const activePitstopIndex = (() => {
    if (!session) return -1
    const { pitstops } = session.path
    let index = -1
    for (let i = 0; i < pitstops.length; i++) {
      if (pitstops[i].scheduledTime <= elapsedTime) index = i
      else break
    }
    return index
  })()

  const startSession = useCallback((task: Task) => {
    const path = generateInitialPath(task)
    const startedAt = Date.now()
    setSession({
      task,
      path,
      deviations: [],
      elapsedTime: 0,
      startTime: startedAt,
      isActive: true,
      isPaused: false,
    })
    setNow(startedAt)
    wasCompleteRef.current = false
    playStartChime()
  }, [])

  const pause = useCallback(() => {
    setSession((prev) => {
      if (!prev || !prev.isActive || prev.isPaused || prev.startTime === null) return prev
      return {
        ...prev,
        elapsedTime: prev.elapsedTime + (Date.now() - prev.startTime),
        startTime: null,
        isPaused: true,
      }
    })
  }, [])

  const resume = useCallback(() => {
    const resumedAt = Date.now()
    setSession((prev) => {
      if (!prev || !prev.isActive || !prev.isPaused) return prev
      return { ...prev, startTime: resumedAt, isPaused: false }
    })
    setNow(resumedAt)
  }, [])

  const reset = useCallback(() => {
    setSession(null)
  }, [])

  const recordDeviation = useCallback((season: Season) => {
    setSession((prev) => {
      if (!prev || !prev.isActive) return prev
      const currentElapsed =
        !prev.isPaused && prev.startTime !== null
          ? prev.elapsedTime + (Date.now() - prev.startTime)
          : prev.elapsedTime

      const nextPath = handleDeviation(currentElapsed, season, prev.path, prev.task)
      const strandingMarker = nextPath.pitstops.find(
        (p) => p.kind === 'stranding' && p.scheduledTime === currentElapsed,
      )
      const deviation: DeviationEvent = {
        id: generateId('deviation'),
        timestamp: Date.now(),
        elapsedAtTrigger: currentElapsed,
        season,
        pitstopId: strandingMarker?.id ?? '',
      }

      return {
        ...prev,
        path: nextPath,
        deviations: [...prev.deviations, deviation],
      }
    })
  }, [])

  return {
    session,
    elapsedTime,
    remainingTime,
    activePitstopIndex,
    isComplete,
    startSession,
    pause,
    resume,
    reset,
    recordDeviation,
  }
}
