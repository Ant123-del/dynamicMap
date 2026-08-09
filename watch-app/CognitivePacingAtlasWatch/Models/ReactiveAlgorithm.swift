import Foundation

// Swift port of dynamic-map/src/utils/reactiveAlgorithm.ts.
enum ReactiveAlgorithm {
    private static let minRegenerationMs = 90_000.0

    private static let groundingPitstopsBySeason: [Season: Int] = [
        .exhaustionV2: 2,
        .grounding: 2,
        .doubt: 1,
        .frustrationSeason: 1,
    ]

    private static func groundingCount(for season: Season) -> Int {
        groundingPitstopsBySeason[season] ?? 0
    }

    /// Handles a "stranded" deviation: locks in everything scheduled before `currentTime`,
    /// drops a stranding marker at the point of deviation, and regenerates only the future
    /// portion of the path so it fits the new season while preserving the original total
    /// session duration.
    static func handleDeviation(
        currentTime: Double,
        newSeason: Season,
        existingPath: PacingPath,
        task: WatchTask,
        preferences: UserPreferences
    ) -> PacingPath {
        let totalDurationMs = existingPath.totalDurationMs
        let pastPath = existingPath.pitstops.filter { $0.scheduledTime < currentTime }
        var placedCoordinates = pastPath.map(\.mapCoordinates)
        let minLevel = min(task.minCognitiveLevel, task.cognitiveLimit)
        let maxLevel = task.cognitiveLimit

        let strandingMarker = Pitstop(
            id: generateId("pitstop"),
            label: PacingAlgorithm.labelFor(.stranding, 1),
            level: 1,
            season: newSeason,
            kind: .stranding,
            scheduledTime: currentTime,
            realTimeTrigger: Date().timeIntervalSince1970 * 1000,
            mapCoordinates: PacingAlgorithm.randomCoordinate(existing: placedCoordinates)
        )
        placedCoordinates.append(strandingMarker.mapCoordinates)

        let remainingMs = max(totalDurationMs - currentTime, 0)
        var futurePitstops: [Pitstop] = []

        if remainingMs <= minRegenerationMs {
            if remainingMs > 0 {
                let coords = PacingAlgorithm.randomCoordinate(existing: placedCoordinates)
                futurePitstops.append(Pitstop(
                    id: generateId("pitstop"),
                    label: PacingAlgorithm.labelFor(.end, minLevel),
                    level: minLevel,
                    season: newSeason,
                    kind: .end,
                    scheduledTime: totalDurationMs,
                    realTimeTrigger: nil,
                    mapCoordinates: coords
                ))
            }
        } else {
            let remainingMinutes = remainingMs / 60_000
            let futureCount = max(
                2, PacingAlgorithm.pitstopCount(forDurationMinutes: remainingMinutes, rateOfChange: task.rateOfChange)
            )
            let groundCount = min(groundingCount(for: newSeason), futureCount - 1)

            // +1 so we can drop the leading point (which would land exactly on currentTime).
            let fullSchedule = PacingAlgorithm.layoutSchedule(
                count: futureCount + 1, startMs: currentTime, durationMs: remainingMs,
                splitType: preferences.splitType
            )
            let schedule = Array(fullSchedule.dropFirst())
            let oscillationLevels = PacingAlgorithm.buildLevelSequence(
                count: futureCount, minLevel: minLevel, maxLevel: maxLevel,
                entrySeason: newSeason, rateOfChange: task.rateOfChange,
                cyclePattern: preferences.cyclePattern
            )

            for i in 0..<futureCount {
                let isLast = i == futureCount - 1
                let isGrounding = i < groundCount
                let level: CognitiveLevel = isLast
                    ? oscillationLevels[i]
                    : isGrounding
                        ? (i % 2 == 0 ? minLevel : min(minLevel + 1, maxLevel))
                        : oscillationLevels[i]
                // mid-range index/count (1 of 3) so kindForLevel never returns 'start'/'end'.
                let kind: PitstopKind = isLast
                    ? .end
                    : isGrounding
                        ? .grounding
                        : PacingAlgorithm.kindForLevel(
                            index: 1, count: 3, level: level,
                            minLevel: minLevel, maxLevel: maxLevel, entrySeason: newSeason
                        )
                let coords = PacingAlgorithm.randomCoordinate(existing: placedCoordinates)
                placedCoordinates.append(coords)

                futurePitstops.append(Pitstop(
                    id: generateId("pitstop"),
                    label: PacingAlgorithm.labelFor(kind, level),
                    level: level,
                    season: newSeason,
                    kind: kind,
                    scheduledTime: schedule[i],
                    realTimeTrigger: nil,
                    mapCoordinates: coords
                ))
            }
        }

        return PacingPath(
            pitstops: pastPath + [strandingMarker] + futurePitstops,
            totalDurationMs: totalDurationMs
        )
    }
}
