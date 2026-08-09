import Foundation

@MainActor
final class PreferencesStore: ObservableObject {
    @Published private(set) var preferences: UserPreferences?
    @Published private(set) var loaded = false

    private let uid: String
    private var pollTimer: Timer?

    init(uid: String) {
        self.uid = uid
        Task { await refresh() }
        pollTimer = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in
            Task { await self?.refresh() }
        }
    }

    deinit {
        pollTimer?.invalidate()
    }

    func refresh() async {
        if let fields = try? await FirestoreREST.getDocument(collection: "preferences", documentId: uid) {
            preferences = UserPreferences.decode(fields)
        }
        loaded = true
    }
}
