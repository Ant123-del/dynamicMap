import Foundation
import WatchKit

/// REST-backed session state for `sessions/{uid}` (see FirestoreREST.swift for why —
/// no native Firestore SDK on watchOS). Elapsed/remaining time are derived from
/// wall-clock timestamps in the fetched document, not a counted-down local value,
/// so they're correct the instant a poll lands regardless of how long the app was
/// closed. A 5s poll picks up changes made elsewhere (e.g. pausing on the web); a
/// local 0.25s tick keeps the on-screen countdown smooth between polls.
@MainActor
final class SessionStore: ObservableObject {
    @Published private(set) var session: SessionState?
    @Published private(set) var loaded = false
    @Published private(set) var now = Date().timeIntervalSince1970 * 1000

    private var pollTimer: Timer?
    private var tickTimer: Timer?
    private var wasComplete = false
    private let uid: String
    private let preferences: UserPreferences

    init(uid: String, preferences: UserPreferences) {
        self.uid = uid
        self.preferences = preferences
        Task { await refresh() }
        pollTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in
            Task { await self?.refresh() }
        }
    }

    deinit {
        pollTimer?.invalidate()
        tickTimer?.invalidate()
    }

    func refresh() async {
        if let fields = try? await FirestoreREST.getDocument(collection: "sessions", documentId: uid) {
            session = SessionState.decode(fields)
        } else {
            session = nil
        }
        loaded = true
        now = Date().timeIntervalSince1970 * 1000
        wasComplete = isComplete
        refreshTickTimer()
    }

    var elapsedTime: Double {
        guard let session else { return 0 }
        if session.isActive, !session.isPaused, let startTime = session.startTime {
            return session.elapsedTime + (now - startTime)
        }
        return session.elapsedTime
    }

    var totalDurationMs: Double { session?.path.totalDurationMs ?? 0 }
    var remainingTime: Double { max(totalDurationMs - elapsedTime, 0) }
    var isComplete: Bool { session != nil && elapsedTime >= totalDurationMs }

    var activePitstopIndex: Int {
        guard let session else { return -1 }
        var index = -1
        for (i, pitstop) in session.path.pitstops.enumerated() {
            if pitstop.scheduledTime <= elapsedTime { index = i } else { break }
        }
        return index
    }

    var crisisDisabled: Bool {
        guard let session else { return true }
        return !session.isActive || session.isPaused || isComplete
    }

    private func refreshTickTimer() {
        tickTimer?.invalidate()
        tickTimer = nil
        guard let session, session.isActive, !session.isPaused, !isComplete else { return }
        tickTimer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick() }
        }
    }

    private func tick() {
        now = Date().timeIntervalSince1970 * 1000
        if isComplete {
            if !wasComplete { WKInterfaceDevice.current().play(.success) }
            tickTimer?.invalidate()
            tickTimer = nil
        }
        wasComplete = isComplete
    }

    func recordDeviation(season: Season) {
        guard let session, session.isActive else { return }
        let currentElapsed: Double
        if !session.isPaused, let startTime = session.startTime {
            currentElapsed = session.elapsedTime + (Date().timeIntervalSince1970 * 1000 - startTime)
        } else {
            currentElapsed = session.elapsedTime
        }

        let nextPath = ReactiveAlgorithm.handleDeviation(
            currentTime: currentElapsed,
            newSeason: season,
            existingPath: session.path,
            task: session.task,
            preferences: preferences
        )
        let strandingId = nextPath.pitstops.first {
            $0.kind == .stranding && $0.scheduledTime == currentElapsed
        }?.id ?? ""
        let deviation = DeviationEvent(
            id: generateId("deviation"),
            timestamp: Date().timeIntervalSince1970 * 1000,
            elapsedAtTrigger: currentElapsed,
            season: season,
            pitstopId: strandingId
        )

        var next = session
        next.path = nextPath
        next.deviations.append(deviation)

        WKInterfaceDevice.current().play(.notification)
        self.session = next // optimistic local update so the UI reflects it instantly
        Task {
            try? await FirestoreREST.setDocument(
                collection: "sessions", documentId: uid, fields: next.firestoreFields
            )
        }
    }
}
