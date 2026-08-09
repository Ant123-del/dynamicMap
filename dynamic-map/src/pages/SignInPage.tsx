interface SignInPageProps {
  onSignIn: () => void
  error: string | null
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.96h5.52c-.24 1.44-1.68 4.2-5.52 4.2-3.32 0-6.03-2.75-6.03-6.15S8.68 6.06 12 6.06c1.89 0 3.16.8 3.89 1.5l2.65-2.55C16.9 3.36 14.68 2.4 12 2.4 6.82 2.4 2.6 6.62 2.6 11.8s4.22 9.4 9.4 9.4c5.42 0 9.02-3.8 9.02-9.16 0-.62-.07-1.09-.15-1.56H12z"
      />
    </svg>
  )
}

export function SignInPage({ onSignIn, error }: SignInPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-xl shadow-black/20">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Cognitive Pacing Atlas</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to chart your pacing loop. Your timer and course stay synced across every device.
        </p>

        <button
          type="button"
          onClick={onSignIn}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-700 bg-white px-4 py-2.5 font-medium text-slate-900 transition hover:bg-slate-100"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

        <p className="mt-6 text-xs text-slate-500">
          We only support Google sign-in — no separate passwords to manage.
        </p>
      </div>
    </div>
  )
}
