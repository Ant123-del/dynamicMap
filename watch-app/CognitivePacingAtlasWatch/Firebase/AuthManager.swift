import FirebaseAuth
import Foundation

@MainActor
final class AuthManager: ObservableObject {
    @Published private(set) var user: User?
    @Published private(set) var isLoading = true
    @Published var errorMessage: String?
    @Published private(set) var isSigningIn = false

    private var handle: AuthStateDidChangeListenerHandle?

    init() {
        handle = Auth.auth().addStateDidChangeListener { [weak self] _, user in
            Task { @MainActor in
                self?.user = user
                self?.isLoading = false
            }
        }
    }

    deinit {
        if let handle {
            Auth.auth().removeStateDidChangeListener(handle)
        }
    }

    func signIn(email: String, password: String) {
        errorMessage = nil
        isSigningIn = true
        Auth.auth().signIn(withEmail: email, password: password) { [weak self] _, error in
            Task { @MainActor in
                self?.isSigningIn = false
                if let error {
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func signOut() {
        try? Auth.auth().signOut()
    }
}
