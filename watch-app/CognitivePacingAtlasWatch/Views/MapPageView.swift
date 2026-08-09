import SwiftUI

/// Swift port of components/CognitiveIslandMap.tsx's node scatter + status coloring,
/// simplified for a small watch face (no terrain decoration, no connecting lines).
struct MapPageView: View {
    let pitstops: [Pitstop]
    let activePitstopIndex: Int

    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            ZStack {
                Circle()
                    .fill(Color(red: 0.847, green: 0.753, blue: 0.541)) // sand
                Circle()
                    .fill(Color(red: 0.227, green: 0.420, blue: 0.290)) // grass
                    .padding(size * 0.12)

                ForEach(Array(pitstops.enumerated()), id: \.element.id) { index, pitstop in
                    nodeView(for: pitstop, index: index, size: size)
                }
            }
            .frame(width: size, height: size)
            .position(x: geo.size.width / 2, y: geo.size.height / 2)
        }
        .padding(3)
    }

    @ViewBuilder
    private func nodeView(for pitstop: Pitstop, index: Int, size: CGFloat) -> some View {
        let status = pitstopStatus(index: index, kind: pitstop.kind, activePitstopIndex: activePitstopIndex)
        let x = size * (pitstop.mapCoordinates.x / 100)
        let y = size * (pitstop.mapCoordinates.y / 100)
        let diameter = size * 0.15

        Group {
            if status == .deviation {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.orange)
                    .frame(width: diameter * 0.8, height: diameter * 0.8)
                    .rotationEffect(.degrees(45))
            } else {
                Circle()
                    .fill(color(for: status))
                    .opacity(status == .past ? 0.55 : 1)
                    .overlay(
                        Circle().stroke(
                            status == .active || status == .next ? Color.white.opacity(0.85) : .clear,
                            lineWidth: 1
                        )
                    )
                    .frame(width: diameter, height: diameter)
            }
        }
        .position(x: x, y: y)
    }

    private func color(for status: PitstopStatus) -> Color {
        switch status {
        case .past: return Color(red: 0.392, green: 0.455, blue: 0.545) // slate-500
        case .active: return Color(red: 0.176, green: 0.831, blue: 0.749) // teal-400
        case .next: return Color(red: 0.957, green: 0.447, blue: 0.714) // pink-400
        default: return Color(red: 0.510, green: 0.549, blue: 0.933) // indigo-400
        }
    }
}
