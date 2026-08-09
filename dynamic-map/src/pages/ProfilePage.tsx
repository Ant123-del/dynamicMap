import { PreferencesForm, type PreferencesFormValue } from '../components/PreferencesForm'
import type { UserPreferences } from '../types/cognitiveHub'

interface ProfilePageProps {
  preferences: UserPreferences
  onSave: (value: PreferencesFormValue) => Promise<void>
  onBack: () => void
}

export function ProfilePage({ preferences, onSave, onBack }: ProfilePageProps) {
  async function handleSave(value: PreferencesFormValue) {
    await onSave(value)
    onBack()
  }

  return (
    <div className="min-h-screen bg-slate-950 px-3 py-6 text-slate-100 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-slate-100">Pacing preferences</h1>
        </div>
        <PreferencesForm initial={preferences} variant="profile" onSave={handleSave} onCancel={onBack} />
      </div>
    </div>
  )
}
