import SwiftUI

/// Deliberately shows only the time — nothing else — matching the web watch view.
struct TimeView: View {
    let remainingTimeMs: Double

    var body: some View {
        Text(formatClock(remainingTimeMs))
            .font(.system(size: 40, weight: .semibold, design: .monospaced))
            .monospacedDigit()
    }
}
