import { generateId } from './id'
import type {
  CognitiveLevel,
  CyclePattern,
  MapCoordinates,
  PacingPath,
  Pitstop,
  PitstopKind,
  RateOfChange,
  Season,
  SplitType,
  Task,
  UserPreferences,
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

/** Fraction of the half-range (max - min) / 2 that the oscillation swings by. */
const AMPLITUDE_FRACTION_BY_RATE: Record<RateOfChange, number> = {
  Low: 0.4,
  Medium: 0.7,
  High: 1,
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

export function clampLevel(
  level: number,
  minLevel: CognitiveLevel,
  maxLevel: CognitiveLevel,
): CognitiveLevel {
  return Math.min(maxLevel, Math.max(minLevel, Math.round(level))) as CognitiveLevel
}

function baseLevelForSeason(
  entrySeason: Season,
  minLevel: CognitiveLevel,
  maxLevel: CognitiveLevel,
): number {
  const midpoint = (minLevel + maxLevel) / 2
  switch (entrySeason) {
    case 'Battle':
      return maxLevel - 1
    case 'Exhaustion/Recovery':
      return minLevel
    case 'Flow':
    default:
      return midpoint
  }
}

/**
 * Builds the cognitive-level sequence for a path, ranging between the min and max load.
 * - 'mirror': oscillates up and back down within each cycle (e.g. 2 -> 3 -> 4 -> 3 -> 2 -> …).
 * - 'ramp': sweeps from the floor to the ceiling and resets each cycle (e.g. 1 -> 2 -> 3 -> 1 -> 2 -> 3 -> …).
 */
export function buildLevelSequence(
  count: number,
  minLevel: CognitiveLevel,
  maxLevel: CognitiveLevel,
  entrySeason: Season,
  rateOfChange: RateOfChange,
  cyclePattern: CyclePattern,
): CognitiveLevel[] {
  const period = OSCILLATION_PERIOD_BY_RATE[rateOfChange]

  if (cyclePattern === 'ramp') {
    return Array.from({ length: count }, (_, i) => {
      const phase = period <= 1 ? 0 : (i % period) / (period - 1)
      return clampLevel(minLevel + phase * (maxLevel - minLevel), minLevel, maxLevel)
    })
  }

  const base = baseLevelForSeason(entrySeason, minLevel, maxLevel)
  const halfRange = Math.max((maxLevel - minLevel) / 2, 0.5)
  const amplitude = halfRange * AMPLITUDE_FRACTION_BY_RATE[rateOfChange]

  return Array.from({ length: count }, (_, i) => {
    const wave = base + amplitude * Math.sin((2 * Math.PI * i) / period)
    return clampLevel(wave, minLevel, maxLevel)
  })
}

export function kindForLevel(
  index: number,
  count: number,
  level: CognitiveLevel,
  minLevel: CognitiveLevel,
  maxLevel: CognitiveLevel,
  entrySeason: Season,
): PitstopKind {
  if (index === 0) return 'start'
  if (index === count - 1) return 'end'
  if (entrySeason === 'Exhaustion/Recovery' && level <= minLevel) return 'recovery'
  if (level >= maxLevel) return 'peak'
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

/** How far a segment's weight swings from the average (1) at the extremes of a negative/positive split. */
const SPLIT_SKEW = 0.6

/** Per-segment duration weights (averaging to 1, summing to `segments`) for a given split style. */
function segmentWeights(segments: number, splitType: SplitType): number[] {
  if (segments <= 1 || splitType === 'even') return Array(segments).fill(1)
  return Array.from({ length: segments }, (_, i) => {
    const t = i / (segments - 1) // 0 (first segment) -> 1 (last segment)
    return splitType === 'negative'
      ? 1 + SPLIT_SKEW - t * 2 * SPLIT_SKEW // long segments first, shrinking
      : 1 - SPLIT_SKEW + t * 2 * SPLIT_SKEW // short segments first, growing
  })
}

/**
 * Lays out scheduledTime offsets (ms) across [startMs, startMs + durationMs], with mild
 * organic jitter, shaped by `splitType` (even/negative/positive segment durations) while
 * preserving monotonic ordering, a minimum gap, and the exact total duration.
 */
export function layoutSchedule(
  count: number,
  startMs: number,
  durationMs: number,
  splitType: SplitType,
): number[] {
  if (count === 1) return [startMs]
  const segments = count - 1
  const weights = segmentWeights(segments, splitType)
  const rawDurations = weights.map((w) => (w / segments) * durationMs)
  const minGap = Math.min(...rawDurations) * 0.3

  const times: number[] = [startMs]
  for (let i = 0; i < segments; i++) {
    const isLastSegment = i === segments - 1
    const jitter = isLastSegment ? 0 : (Math.random() - 0.5) * rawDurations[i] * 0.25
    const candidate = times[times.length - 1] + rawDurations[i] + jitter
    const prev = times[times.length - 1]
    times.push(Math.max(candidate, prev + minGap))
  }
  // Clamp the final point back to the exact end so the total duration is preserved.
  times[times.length - 1] = startMs + durationMs
  return times
}

export function generateInitialPath(task: Task, preferences: UserPreferences): PacingPath {
  const totalDurationMs = task.durationMinutes * 60_000
  const count = pitstopCountFor(task.durationMinutes, task.rateOfChange)
  const minLevel = Math.min(task.minCognitiveLevel, task.cognitiveLimit) as CognitiveLevel
  const maxLevel = task.cognitiveLimit
  const levels = buildLevelSequence(
    count,
    minLevel,
    maxLevel,
    task.entrySeason,
    task.rateOfChange,
    preferences.cyclePattern,
  )
  const schedule = layoutSchedule(count, 0, totalDurationMs, preferences.splitType)

  const pitstops: Pitstop[] = []
  for (let i = 0; i < count; i++) {
    const level = levels[i]
    const kind = kindForLevel(i, count, level, minLevel, maxLevel, task.entrySeason)
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
