import { useCallback, useEffect, useState } from 'react'
import { subscribeToPreferences, writePreferences } from '../firebase/preferences'
import type { UserPreferences } from '../types/cognitiveHub'

/** Break length, in minutes, for preference docs saved before break length was configurable. */
const DEFAULT_BREAK_MINUTES = 5

export function usePreferences(uid: string | null) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!uid) {
      setPreferences(null)
      setLoaded(false)
      return
    }
    setLoaded(false)
    return subscribeToPreferences(uid, (next) => {
      setPreferences(
        next
          ? {
              ...next,
              breakMinutes: Number.isFinite(next.breakMinutes) ? next.breakMinutes : DEFAULT_BREAK_MINUTES,
            }
          : null,
      )
      setLoaded(true)
    })
  }, [uid])

  const savePreferences = useCallback(
    async (next: Omit<UserPreferences, 'updatedAt'>) => {
      if (!uid) return
      await writePreferences(uid, { ...next, updatedAt: Date.now() })
    },
    [uid],
  )

  return { preferences, loaded, savePreferences }
}
