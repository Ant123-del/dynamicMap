import type { SessionState } from '../types/cognitiveHub'
import { formatClock } from '../utils/format'
import { getPitstopStatus } from '../utils/pitstopStatus'

interface ActiveTimerPanelProps {
  session: SessionState
  elapsedTime: number
  remainingTime: number
  phase: 'task' | 'break'
  lapCount: number
  activePitstopIndex: number
  isComplete: boolean
  onPause: () => void
  onResume: () => void
  onReset: () => void
}

const STATUS_STYLES: Record<string, string> = {
  past: 'border-slate-800 bg-slate-900/40 text-slate-500',
  active: 'border-teal-400 bg-teal-500/10 text-teal-200 shadow-lg shadow-teal-500/10',
  next: 'border-pink-400 bg-pink-500/10 text-pink-200',
  future: 'border-slate-800 bg-slate-900/60 text-slate-300',
  deviation: 'border-amber-400 bg-amber-500/10 text-amber-200',
}

export function ActiveTimerPanel({
  session,
  elapsedTime,
  remainingTime,
  phase,
  lapCount,
  activePitstopIndex,
  isComplete,
  onPause,
  onResume,
  onReset,
}: ActiveTimerPanelProps) {
  const isBreak = phase === 'break'
  const phaseDurationMs = isBreak ? session.breakDurationMs : session.path.totalDurationMs
  const progress = Math.min(1, Math.max(0, elapsedTime / phaseDurationMs))

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{session.task.name}</h2>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {session.task.entrySeason}
        </span>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${
            isBreak ? 'bg-sky-500/10 text-sky-300' : 'bg-teal-500/10 text-teal-300'
          }`}
        >
          {isBreak ? 'Break' : 'Working'}
        </span>
        <span className="text-xs text-slate-500">
          Laps done <span className="font-mono text-slate-300">{lapCount}</span>
        </span>
      </div>

      <div className="my-6 text-center">
        <div className="font-mono text-5xl font-semibold tabular-nums text-slate-50">
          {formatClock(remainingTime)}
        </div>
        <div className="mt-1 text-xs text-slate-500">{`${formatClock(elapsedTime)} elapsed`}</div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-[width] duration-300 ${isBreak ? 'bg-sky-400' : 'bg-teal-400'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        {session.isPaused ? (
          <button
            type="button"
            onClick={onResume}
            disabled={isComplete}
            className="flex-1 rounded-lg bg-teal-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resume
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            disabled={isComplete}
            className="flex-1 rounded-lg bg-slate-700 px-4 py-2 font-medium text-slate-100 transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
        >
          End session
        </button>
      </div>

      <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {session.path.pitstops.map((pitstop, index) => {
          const status = getPitstopStatus(index, pitstop.kind, activePitstopIndex)
          return (
            <li
              key={pitstop.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${STATUS_STYLES[status]}`}
            >
              <span className="flex items-center gap-2">
                {status === 'past' && <span className="text-slate-500">✓</span>}
                {status === 'active' && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />
                )}
                {status === 'next' && <span className="h-2 w-2 rounded-full bg-pink-400" />}
                {pitstop.label}
              </span>
              <span className="font-mono text-xs tabular-nums opacity-70">
                {formatClock(pitstop.scheduledTime)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
