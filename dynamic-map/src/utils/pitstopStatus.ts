import type { PitstopStatus } from '../types/cognitiveHub'

export function getPitstopStatus(
  index: number,
  kind: string,
  activePitstopIndex: number,
): PitstopStatus {
  if (kind === 'stranding') return 'deviation'
  if (index < activePitstopIndex) return 'past'
  if (index === activePitstopIndex) return 'active'
  if (index === activePitstopIndex + 1) return 'next'
  return 'future'
}
