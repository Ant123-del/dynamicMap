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

export const SESSION_STORAGE_KEY = 'cognitiveHub.session.v1'
