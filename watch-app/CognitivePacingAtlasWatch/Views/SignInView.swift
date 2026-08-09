import SwiftUI

/// Google's OAuth popup flow can't run on watchOS (no WebKit), so the watch signs in
/// with a one-time password linked to the same Firebase account — generated from the
/// web app's Profile page — rather than a Google button.
struct SignInView: View {
    @ObservedObject var auth: AuthManager
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                Text("Cognitive Pacing Atlas")
                    .font(.footnote.bold())
                    .multilineTextAlignment(.center)
                Text("Generate a watch password from Profile on the web app first.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                TextField("Email", text: $email)
                    .textContentType(.emailAddress)
                SecureField("Watch password", text: $password)

                Button(auth.isSigningIn ? "Signing in…" : "Sign in") {
                    auth.signIn(email: email, password: password)
                }
                .disabled(auth.isSigningIn || email.isEmpty || password.isEmpty)

                if let error = auth.errorMessage {
                    Text(error)
                        .font(.caption2)
                        .foregroundStyle(.red)
                }
            }
            .padding()
        }
    }
}
