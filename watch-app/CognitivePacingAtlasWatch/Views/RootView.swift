import SwiftUI

struct RootView: View {
    @StateObject private var auth = AuthManager()

    var body: some View {
        Group {
            if auth.isLoading {
                MessageView(text: "Loading…")
            } else if let user = auth.user {
                AuthenticatedView(uid: user.uid)
            } else {
                SignInView(auth: auth)
            }
        }
    }
}

private struct AuthenticatedView: View {
    @StateObject private var preferencesStore: PreferencesStore
    private let uid: String

    init(uid: String) {
        self.uid = uid
        _preferencesStore = StateObject(wrappedValue: PreferencesStore(uid: uid))
    }

    var body: some View {
        Group {
            if !preferencesStore.loaded {
                MessageView(text: "Loading…")
            } else if let preferences = preferencesStore.preferences {
                SessionContainerView(uid: uid, preferences: preferences)
            } else {
                MessageView(text: "Finish setup on another device before using the watch view.")
            }
        }
    }
}

private struct SessionContainerView: View {
    @StateObject private var store: SessionStore

    init(uid: String, preferences: UserPreferences) {
        _store = StateObject(wrappedValue: SessionStore(uid: uid, preferences: preferences))
    }

    var body: some View {
        Group {
            if !store.loaded {
                MessageView(text: "Loading…")
            } else if store.session == nil {
                MessageView(text: "No active session.\nSet up a task on another device.")
            } else {
                PagerView(store: store)
            }
        }
    }
}
