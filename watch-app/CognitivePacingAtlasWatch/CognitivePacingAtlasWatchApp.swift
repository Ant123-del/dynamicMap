import FirebaseCore
import SwiftUI

@main
struct CognitivePacingAtlasWatchApp: App {
    init() {
        FirebaseApp.configure()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}
