import { generateId } from './id'
import type {
  CognitiveLevel,
  MapCoordinates,
  PacingPath,
  Pitstop,
  PitstopKind,
  RateOfChange,
  Season,
  Task,
} from '../types/cognitiveHub'

/** Island interior bounds (percentages of the map viewBox) that nodes may scatter within. */
export const MAP_BOUNDS = { minX: 14, maxX: 86, minY: 20, maxY: 80 }

const MIN_NODE_DISTANCE = 9
const MAX_PLACEMENT_ATTEMPTS = 24

const SPACING_MINUTES_BY_RATE: Record<RateOfChange, number> = {
  Low: 9,
  Medium: 6,
  High: 4,
}

const OSCILLATION_PERIOD_BY_RATE: Record<RateOfChange, number> = {
  Low: 5,
  Medium: 4,
  High: 3,
}

const AMPLITUDE_BY_RATE: Record<RateOfChange, number> = {
  Low: 1,
  Medium: 1.5,
  High: 2.5,
}

function distance(a: MapCoordinates, b: MapCoordinates): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function randomCoordinate(existing: MapCoordinates[]): MapCoordinates {
  let candidate: MapCoordinates = { x: 0, y: 0 }
  for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
    candidate = {
      x: MAP_BOUNDS.minX + Math.random() * (MAP_BOUNDS.maxX - MAP_BOUNDS.minX),
      y: MAP_BOUNDS.minY + Math.random() * (MAP_BOUNDS.maxY - MAP_BOUNDS.minY),
    }
    const tooClose = existing.some((node) => distance(node, candidate) < MIN_NODE_DISTANCE)
    if (!tooClose) return candidate
  }
  return candidate
}

export function clampLevel(level: number, cognitiveLimit: CognitiveLevel): CognitiveLevel {
  return Math.min(cognitiveLimit, Math.max(1, Math.round(level))) as CognitiveLevel
}

function baseLevelForSeason(entrySeason: Season, cognitiveLimit: CognitiveLevel): number {
  switch (entrySeason) {
    case 'Battle':
      return cognitiveLimit - 1
    case 'Exhaustion/Recovery':
      return 2
    case 'Flow':
    default:
      return Math.ceil(cognitiveLimit / 2) + 1
  }
}

/** Builds the oscillating Level 2 -> 3 -> 4 -> 2 style loop, clamped to the cognitive limit. */
export function buildLevelSequence(
  count: number,
  cognitiveLimit: CognitiveLevel,
  entrySeason: Season,
  rateOfChange: RateOfChange,
): CognitiveLevel[] {
  const base = baseLevelForSeason(entrySeason, cognitiveLimit)
  const amplitude = AMPLITUDE_BY_RATE[rateOfChange]
  const period = OSCILLATION_PERIOD_BY_RATE[rateOfChange]

  return Array.from({ length: count }, (_, i) => {
    const wave = base + amplitude * Math.sin((2 * Math.PI * i) / period)
    return clampLevel(wave, cognitiveLimit)
  })
}

export function kindForLevel(
  index: number,
  count: number,
  level: CognitiveLevel,
  cognitiveLimit: CognitiveLevel,
  entrySeason: Season,
): PitstopKind {
  if (index === 0) return 'start'
  if (index === count - 1) return 'end'
  if (entrySeason === 'Exhaustion/Recovery' && level <= 2) return 'recovery'
  if (level >= cognitiveLimit) return 'peak'
  return 'work'
}

const LABEL_BY_KIND: Record<PitstopKind, string> = {
  start: 'Start',
  end: 'End',
  work: 'Work',
  peak: 'Peak',
  recovery: 'Recovery',
  grounding: 'Grounding',
  stranding: 'Stranded',
}

export function labelFor(kind: PitstopKind, level: CognitiveLevel): string {
  if (kind === 'start' || kind === 'end') return LABEL_BY_KIND[kind]
  return `${LABEL_BY_KIND[kind]} · L${level}`
}

/** Number of pitstops (including start/end) for a given duration and rate of change. */
export function pitstopCountFor(durationMinutes: number, rateOfChange: RateOfChange): number {
  const spacing = SPACING_MINUTES_BY_RATE[rateOfChange]
  const count = Math.round(durationMinutes / spacing) + 1
  return Math.min(16, Math.max(4, count))
}

/**
 * Lays out scheduledTime offsets (ms) evenly across [startMs, startMs + durationMs],
 * with mild organic jitter, while preserving monotonic ordering and a minimum gap.
 */
export function layoutSchedule(count: number, startMs: number, durationMs: number): number[] {
  if (count === 1) return [startMs]
  const spacing = durationMs / (count - 1)
  const minGap = spacing * 0.4
  const times: number[] = []
  for (let i = 0; i < count; i++) {
    const base = startMs + i * spacing
    const jitter = i === 0 || i === count - 1 ? 0 : (Math.random() - 0.5) * spacing * 0.3
    const time = base + jitter
    const prev = times[i - 1]
    times.push(prev === undefined ? time : Math.max(time, prev + minGap))
  }
  // Clamp the final point back to the exact end so the total duration is preserved.
  times[times.length - 1] = startMs + durationMs
  return times
}

export function generateInitialPath(task: Task): PacingPath {
  const totalDurationMs = task.durationMinutes * 60_000
  const count = pitstopCountFor(task.durationMinutes, task.rateOfChange)
  const levels = buildLevelSequence(count, task.cognitiveLimit, task.entrySeason, task.rateOfChange)
  const schedule = layoutSchedule(count, 0, totalDurationMs)

  const pitstops: Pitstop[] = []
  for (let i = 0; i < count; i++) {
    const level = levels[i]
    const kind = kindForLevel(i, count, level, task.cognitiveLimit, task.entrySeason)
    const mapCoordinates = randomCoordinate(pitstops.map((p) => p.mapCoordinates))
    pitstops.push({
      id: generateId('pitstop'),
      label: labelFor(kind, level),
      level,
      season: task.entrySeason,
      kind,
      scheduledTime: schedule[i],
      mapCoordinates,
      ...(i === 0 ? { realTimeTrigger: Date.now() } : {}),
    })
  }

  return { pitstops, totalDurationMs }
}
