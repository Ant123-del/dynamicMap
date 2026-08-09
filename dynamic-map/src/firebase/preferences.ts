import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import type { UserPreferences } from '../types/cognitiveHub'
import { db } from './config'

function preferencesDocRef(uid: string) {
  return doc(db, 'preferences', uid)
}

export function subscribeToPreferences(
  uid: string,
  callback: (preferences: UserPreferences | null) => void,
): Unsubscribe {
  return onSnapshot(preferencesDocRef(uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as UserPreferences) : null)
  })
}

export async function writePreferences(uid: string, preferences: UserPreferences): Promise<void> {
  await setDoc(preferencesDocRef(uid), preferences)
}
