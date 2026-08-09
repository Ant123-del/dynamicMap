import Foundation

// Swift port of dynamic-map/src/types/cognitiveHub.ts.
// Field names match the JS-written Firestore documents exactly so Codable
// decoding works with no custom CodingKeys.

/// 1...5, clamped via PacingAlgorithm.clampLevel. Kept as a plain Int (rather
/// than an enum) to mirror the TS `1 | 2 | 3 | 4 | 5` numeric-literal union.
typealias CognitiveLevel = Int

enum RateOfChange: String, Codable {
    case low = "Low"
    case medium = "Medium"
    case high = "High"
}

enum Season: String, Codable {
    case battle = "Battle"
    case flow = "Flow"
    case exhaustionRecovery = "Exhaustion/Recovery"
    case exhaustionV2 = "Exhaustion v2"
    case frustrationSeason = "Frustration Season"
    case doubt = "Doubt"
    case grounding = "Grounding"
}

enum PitstopKind: String, Codable {
    case start, work, peak, recovery, grounding, stranding, end
}

/// 'mirror': oscillates up and back down within a cycle (2 -> 3 -> 4 -> 3 -> 2 -> …).
/// 'ramp': sweeps floor to ceiling and resets each cycle (1 -> 2 -> 3 -> 1 -> 2 -> 3 -> …).
enum CyclePattern: String, Codable {
    case mirror, ramp
}

/// 'even' keeps segment durations roughly equal, 'negative' front-loads longer
/// segments that shrink over the session, 'positive' starts short and lengthens.
enum SplitType: String, Codable {
    case even, negative, positive
}

enum PitstopStatus {
    case past, active, next, future, deviation
}

struct MapCoordinates: Codable, Equatable {
    var x: Double
    var y: Double
}

struct Pitstop: Codable, Identifiable, Equatable {
    var id: String
    var label: String
    var level: CognitiveLevel
    var season: Season
    var kind: PitstopKind
    /// Offset in ms from session start at which this pitstop is scheduled.
    var scheduledTime: Double
    /// Epoch ms at which this pitstop was actually created/triggered.
    var realTimeTrigger: Double?
    var mapCoordinates: MapCoordinates
}

struct PacingPath: Codable, Equatable {
    var pitstops: [Pitstop]
    var totalDurationMs: Double
}

/// Named WatchTask (not Task) to avoid colliding with Swift's concurrency Task type.
struct WatchTask: Codable, Equatable {
    var id: String
    var name: String
    var durationMinutes: Int
    /// Minimum cognition needed to make progress — the floor of the pacing range.
    var minCognitiveLevel: CognitiveLevel
    /// Upper cognitive load limit — the ceiling of the pacing range.
    var cognitiveLimit: CognitiveLevel
    var entrySeason: Season
    var rateOfChange: RateOfChange
    var createdAt: Double
}

struct DeviationEvent: Codable, Identifiable, Equatable {
    var id: String
    var timestamp: Double
    var elapsedAtTrigger: Double
    var season: Season
    var pitstopId: String
}

struct SessionState: Codable, Equatable {
    var task: WatchTask
    var path: PacingPath
    var deviations: [DeviationEvent]
    var elapsedTime: Double
    var startTime: Double?
    var isActive: Bool
    var isPaused: Bool
}

struct UserPreferences: Codable, Equatable {
    var cyclePattern: CyclePattern
    var splitType: SplitType
    /// Default entry season — the emotional/energy state the user most often starts from.
    var preferredSeason: Season
    var updatedAt: Double
}
