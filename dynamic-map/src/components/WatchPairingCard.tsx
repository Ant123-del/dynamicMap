import { useState } from 'react'
import { createWatchPairingPassword } from '../firebase/auth'

export function WatchPairingCard() {
  const [pairing, setPairing] = useState<{ email: string; password: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const result = await createWatchPairingPassword()
      setPairing(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate a watch password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h3 className="text-base font-semibold text-slate-100">Apple Watch pairing</h3>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        The watch app can't use Google sign-in directly, so it signs in with a one-time password
        linked to this same account. Generate one, then enter it on the watch — you'll only see it
        once.
      </p>

      {pairing && (
        <div className="mb-3 space-y-2 rounded-lg border border-teal-800 bg-teal-950/30 p-4 text-sm">
          <div>
            <span className="text-slate-500">Email</span>
            <p className="font-mono text-teal-200">{pairing.email}</p>
          </div>
          <div>
            <span className="text-slate-500">Password</span>
            <p className="font-mono text-lg tracking-wide text-teal-200">{pairing.password}</p>
          </div>
          <p className="text-xs text-amber-400">Copy this now — it won't be shown again.</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Generating…' : pairing ? 'Regenerate (invalidates the old one)' : 'Generate watch password'}
      </button>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
    </div>
  )
}
