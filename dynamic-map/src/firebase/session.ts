import { deleteDoc, doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import type { SessionState } from '../types/cognitiveHub'
import { db } from './config'

function sessionDocRef(uid: string) {
  return doc(db, 'sessions', uid)
}

export function subscribeToSession(
  uid: string,
  callback: (session: SessionState | null) => void,
): Unsubscribe {
  return onSnapshot(sessionDocRef(uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as SessionState) : null)
  })
}

export async function writeSession(uid: string, session: SessionState): Promise<void> {
  await setDoc(sessionDocRef(uid), session)
}

export async function clearSession(uid: string): Promise<void> {
  await deleteDoc(sessionDocRef(uid))
}
