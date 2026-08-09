import { useState } from 'react'
import type { CognitiveLevel, DurationMinutes, RateOfChange, Season, Task } from '../types/cognitiveHub'
import { ENTRY_SEASONS } from '../types/cognitiveHub'
import { generateId } from '../utils/id'

const DURATIONS: DurationMinutes[] = [17, 35, 50]
const LEVELS: CognitiveLevel[] = [1, 2, 3, 4, 5]
const RATES: RateOfChange[] = ['Low', 'Medium', 'High']

interface TaskPacingFormProps {
  onStart: (task: Task) => void
  defaultSeason: Season
}

export function TaskPacingForm({ onStart, defaultSeason }: TaskPacingFormProps) {
  const [name, setName] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<DurationMinutes>(35)
  const [minCognitiveLevel, setMinCognitiveLevel] = useState<CognitiveLevel>(2)
  const [cognitiveLimit, setCognitiveLimit] = useState<CognitiveLevel>(4)
  const [entrySeason, setEntrySeason] = useState<Season>(defaultSeason)
  const [rateOfChange, setRateOfChange] = useState<RateOfChange>('Medium')

  function handleMinChange(value: CognitiveLevel) {
    setMinCognitiveLevel(value)
    if (value > cognitiveLimit) setCognitiveLimit(value)
  }

  function handleMaxChange(value: CognitiveLevel) {
    setCognitiveLimit(value)
    if (value < minCognitiveLevel) setMinCognitiveLevel(value)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onStart({
      id: generateId('task'),
      name: name.trim(),
      durationMinutes,
      minCognitiveLevel,
      cognitiveLimit,
      entrySeason,
      rateOfChange,
      createdAt: Date.now(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20"
    >
      <h2 className="mb-1 text-lg font-semibold text-slate-100">Set your baseline</h2>
      <p className="mb-6 text-sm text-slate-400">Chart the pacing loop before you cast off.</p>

      <label className="mb-4 block text-sm text-slate-300">
        Task
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Draft the proposal"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
          required
        />
      </label>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2">
        <label className="text-sm text-slate-300">
          Duration
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value) as DurationMinutes)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100 outline-none focus:border-teal-400"
          >
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-300">
          Rate
          <select
            value={rateOfChange}
            onChange={(e) => setRateOfChange(e.target.value as RateOfChange)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100 outline-none focus:border-teal-400"
          >
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-4">
        <span className="block text-sm text-slate-300">Cognitive load range</span>
        <p className="mb-2 text-xs text-slate-500">
          The minimum cognition needed to make progress, up to the ceiling before you're overloaded.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-slate-300">
            Min load
            <select
              value={minCognitiveLevel}
              onChange={(e) => handleMinChange(Number(e.target.value) as CognitiveLevel)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100 outline-none focus:border-teal-400"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Max load
            <select
              value={cognitiveLimit}
              onChange={(e) => handleMaxChange(Number(e.target.value) as CognitiveLevel)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100 outline-none focus:border-teal-400"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  Level {l}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <label className="mb-6 block text-sm text-slate-300">
        Entry season
        <select
          value={entrySeason}
          onChange={(e) => setEntrySeason(e.target.value as Season)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-teal-400"
        >
          {ENTRY_SEASONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="w-full rounded-lg bg-teal-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!name.trim()}
      >
        Chart the course
      </button>
    </form>
  )
}
