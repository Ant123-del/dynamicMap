import type { DeviationEvent } from '../types/cognitiveHub'
import { formatClock } from '../utils/format'

interface DeviationLogProps {
  deviations: DeviationEvent[]
}

export function DeviationLog({ deviations }: DeviationLogProps) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
      <h2 className="mb-1 text-lg font-semibold text-slate-100">Deviation log</h2>
      <p className="mb-4 text-sm text-slate-400">
        {deviations.length === 0
          ? 'No breakpoints logged yet — smooth sailing so far.'
          : `${deviations.length} breakpoint${deviations.length === 1 ? '' : 's'} logged this session.`}
      </p>

      {deviations.length > 0 && (
        <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {deviations.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between rounded-lg border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-sm text-amber-100"
            >
              <span>{event.season}</span>
              <span className="font-mono text-xs tabular-nums opacity-70">
                {formatClock(event.elapsedAtTrigger)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
