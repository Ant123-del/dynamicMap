interface MinuteStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  hint?: string
}

/** A ±step control for picking a duration in minutes, in place of a free-text or dropdown input. */
export function MinuteStepper({ label, value, onChange, min, max, step, hint }: MinuteStepperProps) {
  function adjust(delta: number) {
    onChange(Math.min(max, Math.max(min, value + delta)))
  }

  return (
    <div>
      <span className="block text-sm text-slate-300">{label}</span>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className={`flex items-center gap-3 ${hint ? '' : 'mt-1'}`}>
        <button
          type="button"
          onClick={() => adjust(-step)}
          disabled={value <= min}
          aria-label={`Decrease ${label} by ${step} minutes`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-lg text-slate-200 transition hover:border-teal-400 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <div className="flex-1 rounded-lg border border-slate-700 bg-slate-950 py-2 text-center font-mono text-lg tabular-nums text-slate-100">
          {value} min
        </div>
        <button
          type="button"
          onClick={() => adjust(step)}
          disabled={value >= max}
          aria-label={`Increase ${label} by ${step} minutes`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-lg text-slate-200 transition hover:border-teal-400 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}
