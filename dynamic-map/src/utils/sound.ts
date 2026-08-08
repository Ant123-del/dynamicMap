let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) audioContext = new Ctor()
  if (audioContext.state === 'suspended') void audioContext.resume()
  return audioContext
}

function playTone(ctx: AudioContext, frequency: number, startOffset: number, duration: number): void {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency

  const startTime = ctx.currentTime + startOffset
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.05)
}

/** Two-note ascending chime played when a pacing session begins. */
export function playStartChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  playTone(ctx, 523.25, 0, 0.15) // C5
  playTone(ctx, 783.99, 0.12, 0.2) // G5
}

/** Three-note resolving chime played when the session's duration completes. */
export function playEndChime(): void {
  const ctx = getAudioContext()
  if (!ctx) return
  playTone(ctx, 783.99, 0, 0.15) // G5
  playTone(ctx, 659.25, 0.14, 0.15) // E5
  playTone(ctx, 523.25, 0.28, 0.3) // C5
}
