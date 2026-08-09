import { useCallback, useEffect, useState } from 'react'
import { subscribeToPreferences, writePreferences } from '../firebase/preferences'
import type { UserPreferences } from '../types/cognitiveHub'

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
      setPreferences(next)
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
