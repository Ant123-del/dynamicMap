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
  // Guards against a non-finite value (e.g. an older saved preference missing this field)
  // ever getting passed back into onChange, which would otherwise lock the control on NaN.
  const safeValue = Number.isFinite(value) ? value : min

  function adjust(delta: number) {
    onChange(Math.min(max, Math.max(min, safeValue + delta)))
  }

  return (
    <div>
      <span className="block text-sm text-slate-300">{label}</span>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className={`flex items-center gap-3 ${hint ? '' : 'mt-1'}`}>
        <button
          type="button"
          onClick={() => adjust(-step)}
          disabled={safeValue <= min}
          aria-label={`Decrease ${label} by ${step} minutes`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-lg text-slate-200 transition hover:border-teal-400 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <div className="flex-1 rounded-lg border border-slate-700 bg-slate-950 py-2 text-center font-mono text-lg tabular-nums text-slate-100">
          {safeValue} min
        </div>
        <button
          type="button"
          onClick={() => adjust(step)}
          disabled={safeValue >= max}
          aria-label={`Increase ${label} by ${step} minutes`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-lg text-slate-200 transition hover:border-teal-400 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}
