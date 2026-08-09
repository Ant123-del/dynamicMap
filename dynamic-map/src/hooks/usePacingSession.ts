import { useCallback, useEffect, useRef, useState } from 'react'
import { clearSession, subscribeToSession, writeSession } from '../firebase/session'
import type {
  DeviationEvent,
  Season,
  SessionState,
  Task,
  UserPreferences,
} from '../types/cognitiveHub'
import { generateId } from '../utils/id'
import { generateInitialPath } from '../utils/pacingAlgorithm'
import { handleDeviation } from '../utils/reactiveAlgorithm'
import { playEndChime, playStartChime } from '../utils/sound'

const TICK_MS = 250

/**
 * Session state lives in Firestore (`sessions/{uid}`), not localStorage, so it
 * survives the machine shutting off and stays in sync across every device the
 * user signs into. Firestore's offline persistence means writes/reads still
 * resolve instantly from a local cache even without connectivity, syncing to
 * the server once back online.
 */
export function usePacingSession(uid: string | null, preferences: UserPreferences) {
  const [session, setSession] = useState<SessionState | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const intervalRef = useRef<number | null>(null)
  const sessionRef = useRef<SessionState | null>(null)
  sessionRef.current = session

  useEffect(() => {
    if (!uid) {
      setSession(null)
      setLoaded(false)
      return
    }
    setLoaded(false)
    return subscribeToSession(uid, (next) => {
      setSession(next)
      setLoaded(true)
      setNow(Date.now())
    })
  }, [uid])

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

  const startSession = useCallback(
    (task: Task) => {
      if (!uid) return
      const path = generateInitialPath(task, preferences)
      const startedAt = Date.now()
      const next: SessionState = {
        task,
        path,
        deviations: [],
        elapsedTime: 0,
        startTime: startedAt,
        isActive: true,
        isPaused: false,
      }
      setNow(startedAt)
      wasCompleteRef.current = false
      playStartChime()
      void writeSession(uid, next)
    },
    [uid, preferences],
  )

  const pause = useCallback(() => {
    if (!uid) return
    const prev = sessionRef.current
    if (!prev || !prev.isActive || prev.isPaused || prev.startTime === null) return
    void writeSession(uid, {
      ...prev,
      elapsedTime: prev.elapsedTime + (Date.now() - prev.startTime),
      startTime: null,
      isPaused: true,
    })
  }, [uid])

  const resume = useCallback(() => {
    if (!uid) return
    const prev = sessionRef.current
    if (!prev || !prev.isActive || !prev.isPaused) return
    const resumedAt = Date.now()
    setNow(resumedAt)
    void writeSession(uid, { ...prev, startTime: resumedAt, isPaused: false })
  }, [uid])

  const reset = useCallback(() => {
    if (!uid) return
    void clearSession(uid)
  }, [uid])

  const recordDeviation = useCallback(
    (season: Season) => {
      if (!uid) return
      const prev = sessionRef.current
      if (!prev || !prev.isActive) return
      const currentElapsed =
        !prev.isPaused && prev.startTime !== null
          ? prev.elapsedTime + (Date.now() - prev.startTime)
          : prev.elapsedTime

      const nextPath = handleDeviation(currentElapsed, season, prev.path, prev.task, preferences)
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

      void writeSession(uid, {
        ...prev,
        path: nextPath,
        deviations: [...prev.deviations, deviation],
      })
    },
    [uid, preferences],
  )

  return {
    session,
    loaded,
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
