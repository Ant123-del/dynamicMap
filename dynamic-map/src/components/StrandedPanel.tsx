import { useState } from 'react'
import type { Season } from '../types/cognitiveHub'
import { DEVIATION_SEASONS } from '../types/cognitiveHub'

interface StrandedPanelProps {
  disabled: boolean
  onStranded: (season: Season) => void
}

export function StrandedPanel({ disabled, onStranded }: StrandedPanelProps) {
  const [season, setSeason] = useState<Season>(DEVIATION_SEASONS[0])
  const [justTriggered, setJustTriggered] = useState(false)

  function handleClick() {
    if (disabled) return
    onStranded(season)
    setJustTriggered(true)
    window.setTimeout(() => setJustTriggered(false), 1500)
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-amber-900/50 bg-amber-950/20 p-6 shadow-xl shadow-black/20">
      <h2 className="mb-1 text-lg font-semibold text-amber-100">Breakpoint</h2>
      <p className="mb-4 text-sm text-amber-200/60">
        Hit friction between pitstops? Log where you're stranded and let the course re-plot.
      </p>

      <label className="mb-4 block text-sm text-amber-100/80">
        Immediate season
        <select
          value={season}
          onChange={(e) => setSeason(e.target.value as Season)}
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-amber-900/60 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {DEVIATION_SEASONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="w-full rounded-lg bg-amber-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {justTriggered ? 'Marker dropped' : 'I am stranded / hit a breakpoint'}
      </button>
    </div>
  )
}
