import SwiftUI

/// Read-only sticky note for the guiding question set on the web app — the watch
/// only ever displays it (typing a long prompt on a watch keyboard isn't practical).
struct NoteView: View {
    let question: String

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 6) {
                Text("GUIDING QUESTION")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.black.opacity(0.55))
                Text(question)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(.black)
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color(red: 0.996, green: 0.902, blue: 0.541))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(6)
        .rotationEffect(.degrees(-1))
    }
}
