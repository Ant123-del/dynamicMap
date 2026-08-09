import SwiftUI

/// Three-page swipeable pager: Crisis <- Time -> Map, landing on Time by
/// default so swiping right reveals the crisis button, matching the web watch view.
struct PagerView: View {
    @ObservedObject var store: SessionStore
    @State private var selection = 1

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
