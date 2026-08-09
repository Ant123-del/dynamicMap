import FirebaseAuth
import Foundation

/// FirebaseFirestore's native SDK isn't available on watchOS (it depends on gRPC/C++
/// internals Apple never ported there — confirmed via firebase-ios-sdk's own
/// Package.swift, which scopes FirebaseFirestoreTarget to iOS/tvOS/macOS/macCatalyst
/// only). Firestore's plain HTTPS REST API works fine on any platform with
/// URLSession, authenticated with the same Firebase Auth ID token, so that's what
/// this talks to instead.
enum FirestoreRESTError: Error {
    case notAuthenticated
    case badResponse(Int)
    case decodeFailed
}

enum FirestoreREST {
    private static let projectId = "cognitive-pacing-atlas"
    private static var baseURL: String {
        "https://firestore.googleapis.com/v1/projects/\(projectId)/databases/(default)/documents"
    }

    private static func authToken() async throws -> String {
        guard let user = Auth.auth().currentUser else { throw FirestoreRESTError.notAuthenticated }
        return try await user.getIDToken()
    }

    /// Fetches a document's `fields` dict, or nil if the document doesn't exist.
    static func getDocument(collection: String, documentId: String) async throws -> [String: Any]? {
        let token = try await authToken()
        var request = URLRequest(url: URL(string: "\(baseURL)/\(collection)/\(documentId)")!)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw FirestoreRESTError.badResponse(-1) }
        if http.statusCode == 404 { return nil }
        guard (200..<300).contains(http.statusCode) else { throw FirestoreRESTError.badResponse(http.statusCode) }

        guard
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let fields = json["fields"] as? [String: Any]
        else {
            throw FirestoreRESTError.decodeFailed
        }
        return fields
    }

    /// Overwrites a document's fields entirely (no updateMask == full replace, matching setDoc semantics).
    static func setDocument(collection: String, documentId: String, fields: [String: Any]) async throws {
        let token = try await authToken()
        var request = URLRequest(url: URL(string: "\(baseURL)/\(collection)/\(documentId)")!)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: ["fields": fields])

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw FirestoreRESTError.badResponse((response as? HTTPURLResponse)?.statusCode ?? -1)
        }
    }
}

/// Helpers for reading/writing Firestore's typed REST value wire format
/// (e.g. `{"doubleValue": 1.5}`), which is not plain JSON.
enum FirestoreValue {
    static func string(_ s: String) -> [String: Any] { ["stringValue": s] }
    static func double(_ d: Double) -> [String: Any] { ["doubleValue": d] }
    static func bool(_ b: Bool) -> [String: Any] { ["booleanValue": b] }
    static func null() -> [String: Any] { ["nullValue": NSNull()] }
    static func map(_ fields: [String: Any]) -> [String: Any] { ["mapValue": ["fields": fields]] }
    static func array(_ values: [[String: Any]]) -> [String: Any] { ["arrayValue": ["values": values]] }

    /// Numbers may arrive as doubleValue or as a string-encoded integerValue (Firestore's
    /// REST wire format encodes integers as strings to avoid JSON precision loss).
    static func asDouble(_ value: Any?) -> Double? {
        guard let value = value as? [String: Any] else { return nil }
        if let d = value["doubleValue"] as? Double { return d }
        if let s = value["integerValue"] as? String { return Double(s) }
        return nil
    }

    static func asString(_ value: Any?) -> String? {
        (value as? [String: Any])?["stringValue"] as? String
    }

    static func asBool(_ value: Any?) -> Bool? {
        (value as? [String: Any])?["booleanValue"] as? Bool
    }

    static func asMap(_ value: Any?) -> [String: Any]? {
        ((value as? [String: Any])?["mapValue"] as? [String: Any])?["fields"] as? [String: Any]
    }

    static func asArray(_ value: Any?) -> [[String: Any]]? {
        ((value as? [String: Any])?["arrayValue"] as? [String: Any])?["values"] as? [[String: Any]]
    }

    static func isNull(_ value: Any?) -> Bool {
        (value as? [String: Any])?["nullValue"] != nil
    }
}
