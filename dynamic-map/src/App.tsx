import { useState } from 'react'
import { ActiveTimerPanel } from './components/ActiveTimerPanel'
import { CognitiveIslandMap } from './components/CognitiveIslandMap'
import { DeviationLog } from './components/DeviationLog'
import { GuidingQuestionNote } from './components/GuidingQuestionNote'
import { PreferencesForm } from './components/PreferencesForm'
import { StrandedPanel } from './components/StrandedPanel'
import { TaskPacingForm } from './components/TaskPacingForm'
import { useAuth } from './hooks/useAuth'
import { usePacingSession } from './hooks/usePacingSession'
import { usePreferences } from './hooks/usePreferences'
import { ProfilePage } from './pages/ProfilePage'
import { SignInPage } from './pages/SignInPage'
import type { UserPreferences } from './types/cognitiveHub'

interface AppShellProps {
  uid: string
  photoURL: string | null
  preferences: UserPreferences
  onSignOut: () => void
  onOpenProfile: () => void
}

function AppShell({ uid, photoURL, preferences, onSignOut, onOpenProfile }: AppShellProps) {
  const {
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
  } = usePacingSession(uid, preferences)

  return (
    <div className="min-h-screen bg-slate-950 px-3 py-6 text-slate-100 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
          <div className="w-8 sm:w-32" />
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
              Cognitive Pacing Atlas
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Chart the loop, hold the pace, and re-plot when the season turns.
            </p>
          </div>
          <div className="flex w-8 items-center justify-end gap-2 sm:w-32">
            {photoURL && (
              <img
                src={photoURL}
                alt=""
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full border border-slate-700"
              />
            )}
            <button
              type="button"
              onClick={onOpenProfile}
              className="hidden rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200 sm:block"
            >
              Profile
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="hidden rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-200 sm:block"
            >
              Sign out
            </button>
          </div>
        </header>

        {!loaded ? (
          <p className="py-20 text-center text-sm text-slate-500">Loading your session…</p>
        ) : !session ? (
          <div className="flex justify-center">
            <TaskPacingForm onStart={startSession} defaultSeason={preferences.preferredSeason} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col items-center gap-6">
              {session.task.guidingQuestion && (
                <GuidingQuestionNote question={session.task.guidingQuestion} />
              )}
              <ActiveTimerPanel
                session={session}
                elapsedTime={elapsedTime}
                remainingTime={remainingTime}
                activePitstopIndex={activePitstopIndex}
                isComplete={isComplete}
                onPause={pause}
                onResume={resume}
                onReset={reset}
              />
              <StrandedPanel
                disabled={!session.isActive || session.isPaused || isComplete}
                onStranded={recordDeviation}
              />
              <DeviationLog deviations={session.deviations} />
            </div>

            <div className="order-first flex justify-center lg:order-none lg:sticky lg:top-10 lg:self-start">
              <CognitiveIslandMap
                pitstops={session.path.pitstops}
                activePitstopIndex={activePitstopIndex}
              />
            </div>
          </div>
        )}

        <div className="mx-auto mt-8 flex justify-center gap-4 sm:hidden">
          <button type="button" onClick={onOpenProfile} className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline">
            Profile
          </button>
          <button type="button" onClick={onSignOut} className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline">
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}

interface AuthenticatedAppProps {
  uid: string
  photoURL: string | null
  onSignOut: () => void
}

function AuthenticatedApp({ uid, photoURL, onSignOut }: AuthenticatedAppProps) {
  const { preferences, loaded, savePreferences } = usePreferences(uid)
  const [view, setView] = useState<'app' | 'profile'>('app')

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950 px-4 py-10 text-slate-100">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Welcome aboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            A few quick questions so we can chart pacing that actually fits how you work.
          </p>
        </div>
        <PreferencesForm variant="onboarding" onSave={savePreferences} />
      </div>
    )
  }

  if (view === 'profile') {
    return (
      <ProfilePage
        preferences={preferences}
        onSave={savePreferences}
        onBack={() => setView('app')}
      />
    )
  }

  return (
    <AppShell
      uid={uid}
      photoURL={photoURL}
      preferences={preferences}
      onSignOut={onSignOut}
      onOpenProfile={() => setView('profile')}
    />
  )
}

function App() {
  const { user, loading, error, signIn, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <SignInPage onSignIn={signIn} error={error} />
  }

  return <AuthenticatedApp uid={user.uid} photoURL={user.photoURL} onSignOut={signOut} />
}

export default App
