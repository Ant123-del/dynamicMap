import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithGoogle, signOut, type User } from '../firebase/auth'

interface AuthState {
  user: User | null
  loading: boolean
}

export function useAuth() {
  const [{ user, loading }, setState] = useState<AuthState>({ user: null, loading: true })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return onAuthStateChanged((nextUser) => {
      setState({ user: nextUser, loading: false })
    })
  }, [])

  const signIn = useCallback(async () => {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.')
    }
  }, [])

  const logOut = useCallback(async () => {
    await signOut()
  }, [])

  return { user, loading, error, signIn, signOut: logOut }
}
