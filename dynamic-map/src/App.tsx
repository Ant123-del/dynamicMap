import { ActiveTimerPanel } from './components/ActiveTimerPanel'
import { CognitiveIslandMap } from './components/CognitiveIslandMap'
import { DeviationLog } from './components/DeviationLog'
import { StrandedPanel } from './components/StrandedPanel'
import { TaskPacingForm } from './components/TaskPacingForm'
import { usePacingSession } from './hooks/usePacingSession'

function App() {
  const {
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
  } = usePacingSession()

  return (
    <div className="min-h-screen bg-slate-950 px-3 py-6 text-slate-100 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 text-center sm:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
            Cognitive Pacing Atlas
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Chart the loop, hold the pace, and re-plot when the season turns.
          </p>
        </header>

        {!session ? (
          <div className="flex justify-center">
            <TaskPacingForm onStart={startSession} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="flex flex-col items-center gap-6">
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
      </div>
    </div>
  )
}

export default App
