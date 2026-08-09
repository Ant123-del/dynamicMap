import Foundation

// Swift port of dynamic-map/src/utils/id.ts and dynamic-map/src/utils/format.ts.

func generateId(_ prefix: String) -> String {
    "\(prefix)-\(UUID().uuidString)"
}

func formatClock(_ ms: Double) -> String {
    let totalSeconds = max(0, Int((ms / 1000).rounded()))
    let minutes = totalSeconds / 60
    let seconds = totalSeconds % 60
    return String(format: "%02d:%02d", minutes, seconds)
}

// Swift port of dynamic-map/src/utils/pitstopStatus.ts.
func pitstopStatus(index: Int, kind: PitstopKind, activePitstopIndex: Int) -> PitstopStatus {
    if kind == .stranding { return .deviation }
    if index < activePitstopIndex { return .past }
    if index == activePitstopIndex { return .active }
    if index == activePitstopIndex + 1 { return .next }
    return .future
}
