import Foundation

// Encode/decode our models to/from Firestore's REST `fields` value format.
// Field names match exactly what the web app (JS Firestore SDK) writes.

extension MapCoordinates {
    var firestoreFields: [String: Any] {
        ["x": FirestoreValue.double(x), "y": FirestoreValue.double(y)]
    }

    static func decode(_ fields: [String: Any]) -> MapCoordinates? {
        guard let x = FirestoreValue.asDouble(fields["x"]), let y = FirestoreValue.asDouble(fields["y"]) else {
            return nil
        }
        return MapCoordinates(x: x, y: y)
    }
}

extension Pitstop {
    var firestoreFields: [String: Any] {
        var fields: [String: Any] = [
            "id": FirestoreValue.string(id),
            "label": FirestoreValue.string(label),
            "level": FirestoreValue.double(Double(level)),
            "season": FirestoreValue.string(season.rawValue),
            "kind": FirestoreValue.string(kind.rawValue),
            "scheduledTime": FirestoreValue.double(scheduledTime),
            "mapCoordinates": FirestoreValue.map(mapCoordinates.firestoreFields),
        ]
        if let realTimeTrigger {
            fields["realTimeTrigger"] = FirestoreValue.double(realTimeTrigger)
        }
        return fields
    }

    static func decode(_ fields: [String: Any]) -> Pitstop? {
        guard
            let id = FirestoreValue.asString(fields["id"]),
            let label = FirestoreValue.asString(fields["label"]),
            let levelD = FirestoreValue.asDouble(fields["level"]),
            let seasonStr = FirestoreValue.asString(fields["season"]),
            let season = Season(rawValue: seasonStr),
            let kindStr = FirestoreValue.asString(fields["kind"]),
            let kind = PitstopKind(rawValue: kindStr),
            let scheduledTime = FirestoreValue.asDouble(fields["scheduledTime"]),
            let coordFields = FirestoreValue.asMap(fields["mapCoordinates"]),
            let coords = MapCoordinates.decode(coordFields)
        else { return nil }

        return Pitstop(
            id: id, label: label, level: Int(levelD), season: season, kind: kind,
            scheduledTime: scheduledTime,
            realTimeTrigger: FirestoreValue.asDouble(fields["realTimeTrigger"]),
            mapCoordinates: coords
        )
    }
}

extension PacingPath {
    var firestoreFields: [String: Any] {
        [
            "pitstops": FirestoreValue.array(pitstops.map { FirestoreValue.map($0.firestoreFields) }),
            "totalDurationMs": FirestoreValue.double(totalDurationMs),
        ]
    }

    static func decode(_ fields: [String: Any]) -> PacingPath? {
        guard let totalDurationMs = FirestoreValue.asDouble(fields["totalDurationMs"]) else { return nil }
        let pitstops = (FirestoreValue.asArray(fields["pitstops"]) ?? []).compactMap { value -> Pitstop? in
            FirestoreValue.asMap(value).flatMap(Pitstop.decode)
        }
        return PacingPath(pitstops: pitstops, totalDurationMs: totalDurationMs)
    }
}

extension WatchTask {
    var firestoreFields: [String: Any] {
        var fields: [String: Any] = [
            "id": FirestoreValue.string(id),
            "name": FirestoreValue.string(name),
            "durationMinutes": FirestoreValue.double(Double(durationMinutes)),
            "minCognitiveLevel": FirestoreValue.double(Double(minCognitiveLevel)),
            "cognitiveLimit": FirestoreValue.double(Double(cognitiveLimit)),
            "entrySeason": FirestoreValue.string(entrySeason.rawValue),
            "rateOfChange": FirestoreValue.string(rateOfChange.rawValue),
            "createdAt": FirestoreValue.double(createdAt),
        ]
        if let guidingQuestion {
            fields["guidingQuestion"] = FirestoreValue.string(guidingQuestion)
        }
        return fields
    }

    static func decode(_ fields: [String: Any]) -> WatchTask? {
        guard
            let id = FirestoreValue.asString(fields["id"]),
            let name = FirestoreValue.asString(fields["name"]),
            let durationMinutesD = FirestoreValue.asDouble(fields["durationMinutes"]),
            let minLevelD = FirestoreValue.asDouble(fields["minCognitiveLevel"]),
            let maxLevelD = FirestoreValue.asDouble(fields["cognitiveLimit"]),
            let seasonStr = FirestoreValue.asString(fields["entrySeason"]),
            let season = Season(rawValue: seasonStr),
            let rateStr = FirestoreValue.asString(fields["rateOfChange"]),
            let rate = RateOfChange(rawValue: rateStr),
            let createdAt = FirestoreValue.asDouble(fields["createdAt"])
        else { return nil }

        return WatchTask(
            id: id, name: name, durationMinutes: Int(durationMinutesD),
            minCognitiveLevel: Int(minLevelD), cognitiveLimit: Int(maxLevelD),
            entrySeason: season, rateOfChange: rate, createdAt: createdAt,
            guidingQuestion: FirestoreValue.asString(fields["guidingQuestion"])
        )
    }
}

extension DeviationEvent {
    var firestoreFields: [String: Any] {
        [
            "id": FirestoreValue.string(id),
            "timestamp": FirestoreValue.double(timestamp),
            "elapsedAtTrigger": FirestoreValue.double(elapsedAtTrigger),
            "season": FirestoreValue.string(season.rawValue),
            "pitstopId": FirestoreValue.string(pitstopId),
        ]
    }

    static func decode(_ fields: [String: Any]) -> DeviationEvent? {
        guard
            let id = FirestoreValue.asString(fields["id"]),
            let timestamp = FirestoreValue.asDouble(fields["timestamp"]),
            let elapsedAtTrigger = FirestoreValue.asDouble(fields["elapsedAtTrigger"]),
            let seasonStr = FirestoreValue.asString(fields["season"]),
            let season = Season(rawValue: seasonStr),
            let pitstopId = FirestoreValue.asString(fields["pitstopId"])
        else { return nil }

        return DeviationEvent(
            id: id, timestamp: timestamp, elapsedAtTrigger: elapsedAtTrigger,
            season: season, pitstopId: pitstopId
        )
    }
}

extension SessionState {
    var firestoreFields: [String: Any] {
        [
            "task": FirestoreValue.map(task.firestoreFields),
            "path": FirestoreValue.map(path.firestoreFields),
            "deviations": FirestoreValue.array(deviations.map { FirestoreValue.map($0.firestoreFields) }),
            "elapsedTime": FirestoreValue.double(elapsedTime),
            "startTime": startTime.map(FirestoreValue.double) ?? FirestoreValue.null(),
            "isActive": FirestoreValue.bool(isActive),
            "isPaused": FirestoreValue.bool(isPaused),
        ]
    }

    static func decode(_ fields: [String: Any]) -> SessionState? {
        guard
            let taskFields = FirestoreValue.asMap(fields["task"]), let task = WatchTask.decode(taskFields),
            let pathFields = FirestoreValue.asMap(fields["path"]), let path = PacingPath.decode(pathFields),
            let elapsedTime = FirestoreValue.asDouble(fields["elapsedTime"]),
            let isActive = FirestoreValue.asBool(fields["isActive"]),
            let isPaused = FirestoreValue.asBool(fields["isPaused"])
        else { return nil }

        let deviations = (FirestoreValue.asArray(fields["deviations"]) ?? []).compactMap { value -> DeviationEvent? in
            FirestoreValue.asMap(value).flatMap(DeviationEvent.decode)
        }
        let startTime = FirestoreValue.isNull(fields["startTime"]) ? nil : FirestoreValue.asDouble(fields["startTime"])

        return SessionState(
            task: task, path: path, deviations: deviations, elapsedTime: elapsedTime,
            startTime: startTime, isActive: isActive, isPaused: isPaused
        )
    }
}

extension UserPreferences {
    static func decode(_ fields: [String: Any]) -> UserPreferences? {
        guard
            let cycleStr = FirestoreValue.asString(fields["cyclePattern"]),
            let cyclePattern = CyclePattern(rawValue: cycleStr),
            let splitStr = FirestoreValue.asString(fields["splitType"]),
            let splitType = SplitType(rawValue: splitStr),
            let seasonStr = FirestoreValue.asString(fields["preferredSeason"]),
            let preferredSeason = Season(rawValue: seasonStr),
            let updatedAt = FirestoreValue.asDouble(fields["updatedAt"])
        else { return nil }

        return UserPreferences(
            cyclePattern: cyclePattern, splitType: splitType,
            preferredSeason: preferredSeason, updatedAt: updatedAt
        )
    }
}
