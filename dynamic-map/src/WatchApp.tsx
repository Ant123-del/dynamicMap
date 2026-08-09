import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CognitiveIslandMap } from './components/CognitiveIslandMap'
import { useAuth } from './hooks/useAuth'
import { usePacingSession } from './hooks/usePacingSession'
import { usePreferences } from './hooks/usePreferences'
import { GoogleIcon } from './pages/SignInPage'
import type { UserPreferences } from './types/cognitiveHub'
import { formatClock } from './utils/format'

const PAGE_COUNT = 3
const TIME_PAGE = 1

function WatchMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh w-dvw items-center justify-center bg-black px-6 text-center text-sm text-slate-300">
      {children}
    </div>
  )
}

function WatchSignIn({ onSignIn, error }: { onSignIn: () => void; error: string | null }) {
  return (
    <div className="flex h-dvh w-dvw flex-col items-center justify-center gap-3 bg-black px-5 text-center text-white">
      <p className="text-sm font-medium">Cognitive Pacing Atlas</p>
      <button
        type="button"
        onClick={onSignIn}
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-medium text-slate-900 active:bg-slate-200"
      >
        <GoogleIcon />
        Sign in
      </button>
      {error && <p className="text-[10px] text-rose-400">{error}</p>}
    </div>
  )
}

interface WatchShellProps {
  uid: string
  preferences: UserPreferences
}

function WatchShell({ uid, preferences }: WatchShellProps) {
  const { session, loaded, remainingTime, activePitstopIndex, isComplete, recordDeviation } =
    usePacingSession(uid, preferences)

  const containerRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(TIME_PAGE)
  const [confirmed, setConfirmed] = useState(false)

  // Land on the Time page by default, without animating.
  useEffect(() => {
    const el = containerRef.current
    if (el) el.scrollLeft = el.clientWidth * TIME_PAGE
  }, [session?.task.id])

  function handleScroll() {
    const el = containerRef.current
    if (!el || el.clientWidth === 0) return
    setPage(Math.round(el.scrollLeft / el.clientWidth))
  }

  function handleCrisis() {
    recordDeviation('Frustration Season')
    setConfirmed(true)
    window.setTimeout(() => setConfirmed(false), 1500)
  }

  if (!loaded) return <WatchMessage>Loading…</WatchMessage>

  if (!session) {
    return (
      <WatchMessage>
        No active session.
        <br />
        Set up a task on another device.
      </WatchMessage>
    )
  }

  const crisisDisabled = !session.isActive || session.isPaused || isComplete

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-black text-white">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex h-full w-full shrink-0 snap-center flex-col items-center justify-center gap-4 px-6">
          <button
            type="button"
            onClick={handleCrisis}
            disabled={crisisDisabled}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-600 text-center text-[11px] font-semibold uppercase leading-tight tracking-wide text-white active:bg-rose-500 disabled:bg-slate-700 disabled:text-slate-400"
          >
            {confirmed ? 'Logged' : 'Something Happened'}
          </button>
        </div>

        <div className="flex h-full w-full shrink-0 snap-center items-center justify-center">
          <span className="font-mono text-5xl font-semibold tabular-nums">
            {formatClock(remainingTime)}
          </span>
        </div>

        <div className="flex h-full w-full shrink-0 snap-center items-center justify-center p-1.5">
          <CognitiveIslandMap
            pitstops={session.path.pitstops}
            activePitstopIndex={activePitstopIndex}
          />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-2 left-0 flex w-full justify-center gap-1.5">
        {Array.from({ length: PAGE_COUNT }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${page === i ? 'bg-white' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  )
}

function WatchAuthenticated({ uid }: { uid: string }) {
  const { preferences, loaded } = usePreferences(uid)

  if (!loaded) return <WatchMessage>Loading…</WatchMessage>

  if (!preferences) {
    return (
      <WatchMessage>
        Finish setup on another device before using the watch view.
      </WatchMessage>
    )
  }

  return <WatchShell uid={uid} preferences={preferences} />
}

export function WatchApp() {
  const { user, loading, error, signIn } = useAuth()

  if (loading) return <WatchMessage>Loading…</WatchMessage>
  if (!user) return <WatchSignIn onSignIn={signIn} error={error} />

  return <WatchAuthenticated uid={user.uid} />
}
