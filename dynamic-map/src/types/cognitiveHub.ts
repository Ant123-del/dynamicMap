export type CognitiveLevel = 1 | 2 | 3 | 4 | 5

export type DurationMinutes = 17 | 35 | 50

export type RateOfChange = 'Low' | 'Medium' | 'High'

export type Season =
  | 'Battle'
  | 'Flow'
  | 'Exhaustion/Recovery'
  | 'Exhaustion v2'
  | 'Frustration Season'
  | 'Doubt'
  | 'Grounding'

export const ENTRY_SEASONS: Season[] = ['Battle', 'Flow', 'Exhaustion/Recovery']

export const DEVIATION_SEASONS: Season[] = [
  'Exhaustion v2',
  'Frustration Season',
  'Doubt',
  'Grounding',
]

export type PitstopKind =
  | 'start'
  | 'work'
  | 'peak'
  | 'recovery'
  | 'grounding'
  | 'stranding'
  | 'end'

export interface MapCoordinates {
  x: number
  y: number
}

export interface Pitstop {
  id: string
  label: string
  level: CognitiveLevel
  season: Season
  kind: PitstopKind
  /** Offset in ms from session start at which this pitstop is scheduled. */
  scheduledTime: number
  /** Epoch ms at which this pitstop was actually created/triggered (set for stranding markers, and for the start pitstop). */
  realTimeTrigger?: number
  mapCoordinates: MapCoordinates
}

export interface PacingPath {
  pitstops: Pitstop[]
  totalDurationMs: number
}

export interface Task {
  id: string
  name: string
  durationMinutes: DurationMinutes
  /** Minimum cognition needed to make progress on the task — the floor of the pacing range. */
  minCognitiveLevel: CognitiveLevel
  /** Upper cognitive load limit — the ceiling of the pacing range. */
  cognitiveLimit: CognitiveLevel
  entrySeason: Season
  rateOfChange: RateOfChange
  createdAt: number
  /** Optional sticky-note prompt to keep front-of-mind for the session — visible on every device. */
  guidingQuestion?: string
}

export interface DeviationEvent {
  id: string
  timestamp: number
  elapsedAtTrigger: number
  season: Season
  pitstopId: string
}

export type PitstopStatus = 'past' | 'active' | 'next' | 'future' | 'deviation'

export interface SessionState {
  task: Task
  path: PacingPath
  deviations: DeviationEvent[]
  elapsedTime: number
  startTime: number | null
  isActive: boolean
  isPaused: boolean
}

/**
 * Whether the cognitive-level loop oscillates up and back down within a cycle
 * ('mirror', e.g. 1→2→3→2→1→2→3…) or sweeps up and resets to the floor each
 * cycle ('ramp', e.g. 1→2→3→1→2→3…).
 */
export type CyclePattern = 'mirror' | 'ramp'

/**
 * How long each pacing segment lasts relative to the others: 'even' keeps
 * segment durations roughly equal, 'negative' front-loads longer segments
 * that shrink over the session, 'positive' starts short and lengthens.
 */
export type SplitType = 'even' | 'negative' | 'positive'

export interface UserPreferences {
  cyclePattern: CyclePattern
  splitType: SplitType
  /** Default entry season pre-filled on the task form — the emotional/energy state the user most often starts from. */
  preferredSeason: Season
  updatedAt: number
}
