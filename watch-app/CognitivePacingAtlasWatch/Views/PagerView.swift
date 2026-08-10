import SwiftUI

/// Swipeable pager: Crisis <- Time -> Map, landing on Time by default so swiping
/// right reveals the crisis button, matching the web watch view. A 4th page (the
/// guiding-question sticky note) only appears when one is set on the task — the
/// pager stays exactly 3 pages otherwise.
struct PagerView: View {
    @ObservedObject var store: SessionStore
    @State private var selection = 1

    private var guidingQuestion: String? {
        guard let question = store.session?.task.guidingQuestion, !question.isEmpty else { return nil }
        return question
    }

    var body: some View {
        TabView(selection: $selection) {
            CrisisView(disabled: store.crisisDisabled) {
                store.recordDeviation(season: .frustrationSeason)
            }
            .tag(0)

            TimeView(remainingTimeMs: store.remainingTime)
                .tag(1)

            mapPage
                .tag(2)

            if let guidingQuestion {
                NoteView(question: guidingQuestion)
                    .tag(3)
            }
        }
        .tabViewStyle(.page)
    }

    @ViewBuilder
    private var mapPage: some View {
        if let session = store.session {
            MapPageView(pitstops: session.path.pitstops, activePitstopIndex: store.activePitstopIndex)
        }
    }
}
