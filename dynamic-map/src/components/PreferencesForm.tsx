import { useState } from 'react'
import type { CyclePattern, Season, SplitType, UserPreferences } from '../types/cognitiveHub'
import { ENTRY_SEASONS } from '../types/cognitiveHub'
import { MinuteStepper } from './MinuteStepper'

const BREAK_MIN = 5
const BREAK_MAX = 60
const BREAK_STEP = 5

interface OptionDef<T extends string> {
  value: T
  title: string
  description: string
  pattern?: string
}

const CYCLE_OPTIONS: OptionDef<CyclePattern>[] = [
  {
    value: 'mirror',
    title: 'Rise and fall',
    description: 'Ease back down before climbing again — like breathing in and out.',
    pattern: '1 → 2 → 3 → 2 → 1 → 2 → 3 …',
  },
  {
    value: 'ramp',
    title: 'Reset and rebuild',
    description: 'Return to the floor each time you peak, then build back up fresh.',
    pattern: '1 → 2 → 3 → 1 → 2 → 3 …',
  },
]

const SPLIT_OPTIONS: OptionDef<SplitType>[] = [
  {
    value: 'even',
    title: 'Even split',
    description: 'Every stage gets roughly the same amount of time, no matter the effort level.',
  },
  {
    value: 'negative',
    title: 'Negative split',
    description:
      'Start with longer stretches, then let each stage get shorter and shorter as the session goes on.',
  },
  {
    value: 'positive',
    title: 'Positive split',
    description:
      'Start with short stretches, then let each stage get longer and longer as the session goes on.',
  },
]

const SEASON_OPTIONS: OptionDef<Season>[] = [
  {
    value: 'Battle',
    title: 'Battle',
    description: 'You show up ready to push — high energy, straight into the hard part.',
  },
  {
    value: 'Flow',
    title: 'Flow',
    description: 'Steady, balanced energy — you ease into a rhythm and hold it.',
  },
  {
    value: 'Exhaustion/Recovery',
    title: 'Exhaustion / Recovery',
    description: "You're often running on empty and need to ease in gently before ramping up.",
  },
]

function OptionCard<T extends string>({
  option,
  selected,
  onSelect,
}: {
  option: OptionDef<T>
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-teal-400 bg-teal-500/10 text-teal-100'
          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{option.title}</span>
        {option.pattern && (
          <span className="font-mono text-xs tabular-nums opacity-70">{option.pattern}</span>
        )}
      </div>
      <p className="mt-1 text-sm opacity-80">{option.description}</p>
    </button>
  )
}

export interface PreferencesFormValue {
  cyclePattern: CyclePattern
  splitType: SplitType
  preferredSeason: Season
  breakMinutes: number
}

const DEFAULT_VALUE: PreferencesFormValue = {
  cyclePattern: 'mirror',
  splitType: 'even',
  preferredSeason: ENTRY_SEASONS[0],
  breakMinutes: 5,
}

interface PreferencesFormProps {
  initial?: UserPreferences | null
  variant: 'onboarding' | 'profile'
  onSave: (value: PreferencesFormValue) => void | Promise<void>
  onCancel?: () => void
}

export function PreferencesForm({ initial, variant, onSave, onCancel }: PreferencesFormProps) {
  const [value, setValue] = useState<PreferencesFormValue>(
    initial
      ? {
          cyclePattern: initial.cyclePattern,
          splitType: initial.splitType,
          preferredSeason: initial.preferredSeason,
          breakMinutes: initial.breakMinutes,
        }
      : DEFAULT_VALUE,
  )
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const steps = [
    {
      key: 'cycle',
      question: 'When you cycle through effort levels, what feels natural?',
      hint: 'This shapes the rhythm of the whole session — how your cognitive load rises and falls over time.',
      content: (
        <div className="space-y-3">
          {CYCLE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              option={opt}
              selected={value.cyclePattern === opt.value}
              onSelect={() => setValue((v) => ({ ...v, cyclePattern: opt.value }))}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'split',
      question: 'How do you like to pace your time across a session?',
      hint: "Runners call this a \"split.\" Picture your session as laps at different effort levels — even splits keep each lap the same length, a negative split starts long and shrinks lap by lap, a positive split starts short and grows lap by lap.",
      content: (
        <div className="space-y-3">
          {SPLIT_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              option={opt}
              selected={value.splitType === opt.value}
              onSelect={() => setValue((v) => ({ ...v, splitType: opt.value }))}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'season',
      question: 'What state do you usually show up in when starting a task?',
      hint: 'This sets your default starting point — you can always override it per task.',
      content: (
        <div className="space-y-3">
          {SEASON_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              option={opt}
              selected={value.preferredSeason === opt.value}
              onSelect={() => setValue((v) => ({ ...v, preferredSeason: opt.value }))}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'break',
      question: 'How long should your break be between laps?',
      hint: 'When a lap finishes, a break timer starts automatically for this long, then loops back into the next lap — until you end the session.',
      content: (
        <MinuteStepper
          label="Break length"
          value={value.breakMinutes}
          onChange={(breakMinutes) => setValue((v) => ({ ...v, breakMinutes }))}
          min={BREAK_MIN}
          max={BREAK_MAX}
          step={BREAK_STEP}
        />
      ),
    },
  ]

  async function handleSave() {
    setSaving(true)
    await onSave(value)
    setSaving(false)
  }

  if (variant === 'profile') {
    return (
      <div className="w-full max-w-md space-y-6">
        {steps.map((s) => (
          <div key={s.key} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-base font-semibold text-slate-100">{s.question}</h3>
            <p className="mt-1 mb-4 text-sm text-slate-500">{s.hint}</p>
            {s.content}
          </div>
        ))}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-teal-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    )
  }

  const current = steps[step]
  const isLastStep = step === steps.length - 1

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
      <div className="mb-5 flex justify-center gap-1.5">
        {steps.map((s, i) => (
          <span
            key={s.key}
            className={`h-1.5 w-8 rounded-full transition ${i <= step ? 'bg-teal-400' : 'bg-slate-700'}`}
          />
        ))}
      </div>

      <h2 className="text-lg font-semibold text-slate-100">{current.question}</h2>
      <p className="mt-1 mb-5 text-sm text-slate-400">{current.hint}</p>

      {current.content}

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => (isLastStep ? handleSave() : setStep((s) => s + 1))}
          disabled={saving}
          className="flex-1 rounded-lg bg-teal-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLastStep ? (saving ? 'Starting…' : 'Start pacing') : 'Continue'}
        </button>
      </div>
    </div>
  )
}
