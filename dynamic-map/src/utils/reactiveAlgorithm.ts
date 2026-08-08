import { generateId } from './id'
import {
  buildLevelSequence,
  kindForLevel,
  labelFor,
  layoutSchedule,
  pitstopCountFor,
  randomCoordinate,
} from './pacingAlgorithm'
import type { CognitiveLevel, PacingPath, Pitstop, Season, Task } from '../types/cognitiveHub'

const MIN_REGENERATION_MS = 90_000

const GROUNDING_PITSTOPS_BY_SEASON: Partial<Record<Season, number>> = {
  'Exhaustion v2': 2,
  Grounding: 2,
  Doubt: 1,
  'Frustration Season': 1,
}

function groundingCountFor(season: Season): number {
  return GROUNDING_PITSTOPS_BY_SEASON[season] ?? 0
}

/**
 * Handles a "stranded" deviation: locks in everything scheduled before `currentTime`,
 * drops a stranding marker at the point of deviation, and regenerates only the future
 * portion of the path so it fits the new season while preserving the original total
 * session duration.
 */
export function handleDeviation(
  currentTime: number,
  newSeason: Season,
  existingPath: PacingPath,
  task: Task,
): PacingPath {
  const totalDurationMs = existingPath.totalDurationMs
  const pastPath = existingPath.pitstops.filter((p) => p.scheduledTime < currentTime)
  const placedCoordinates = pastPath.map((p) => p.mapCoordinates)

  const strandingMarker: Pitstop = {
    id: generateId('pitstop'),
    label: labelFor('stranding', 1),
    level: 1,
    season: newSeason,
    kind: 'stranding',
    scheduledTime: currentTime,
    realTimeTrigger: Date.now(),
    mapCoordinates: randomCoordinate(placedCoordinates),
  }
  placedCoordinates.push(strandingMarker.mapCoordinates)

  const remainingMs = Math.max(totalDurationMs - currentTime, 0)
  const futurePitstops: Pitstop[] = []

  if (remainingMs <= MIN_REGENERATION_MS) {
    if (remainingMs > 0) {
      const mapCoordinates = randomCoordinate(placedCoordinates)
      futurePitstops.push({
        id: generateId('pitstop'),
        label: labelFor('end', 2),
        level: 2,
        season: newSeason,
        kind: 'end',
        scheduledTime: totalDurationMs,
        mapCoordinates,
      })
    }
  } else {
    const remainingMinutes = remainingMs / 60_000
    const futureCount = Math.max(2, pitstopCountFor(remainingMinutes, task.rateOfChange))
    const groundingCount = Math.min(groundingCountFor(newSeason), futureCount - 1)

    // +1 so we can drop the leading point (which would land exactly on currentTime).
    const schedule = layoutSchedule(futureCount + 1, currentTime, remainingMs).slice(1)
    const oscillationLevels = buildLevelSequence(
      futureCount,
      task.cognitiveLimit,
      newSeason,
      task.rateOfChange,
    )

    for (let i = 0; i < futureCount; i++) {
      const isLast = i === futureCount - 1
      const isGrounding = i < groundingCount
      const level: CognitiveLevel = isLast
        ? oscillationLevels[i]
        : isGrounding
          ? ((i % 2 === 0 ? 1 : 2) as CognitiveLevel)
          : oscillationLevels[i]
      const kind = isLast
        ? 'end'
        : isGrounding
          ? 'grounding'
          : kindForLevel(1, 3, level, task.cognitiveLimit, newSeason) // mid-range index/count => never 'start'/'end'
      const mapCoordinates = randomCoordinate(placedCoordinates)
      placedCoordinates.push(mapCoordinates)

      futurePitstops.push({
        id: generateId('pitstop'),
        label: labelFor(kind, level),
        level,
        season: newSeason,
        kind,
        scheduledTime: schedule[i],
        mapCoordinates,
      })
    }
  }

  return {
    pitstops: [...pastPath, strandingMarker, ...futurePitstops],
    totalDurationMs,
  }
}
