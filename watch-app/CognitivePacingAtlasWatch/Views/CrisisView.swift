import SwiftUI

/// The "something happened" button — reached by swiping right from the Time page.
struct CrisisView: View {
    let disabled: Bool
    let onTrigger: () -> Void

    @State private var confirmed = false

    var body: some View {
        Button {
            onTrigger()
            confirmed = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { confirmed = false }
        } label: {
            Text(confirmed ? "Logged" : "Something\nHappened")
                .multilineTextAlignment(.center)
                .font(.system(size: 12, weight: .bold))
                .frame(width: 84, height: 84)
        }
        .buttonStyle(.borderedProminent)
        .tint(.red)
        .clipShape(Circle())
        .disabled(disabled)
    }
}
