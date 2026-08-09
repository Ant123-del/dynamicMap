import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  unlink,
  type Unsubscribe,
  type User,
} from 'firebase/auth'
import { auth } from './config'

const googleProvider = new GoogleAuthProvider()

export type { User }

export function onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback)
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider)
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

function generateWatchPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return btoa(String.fromCharCode(...bytes))
    .replace(/[+/=]/g, '')
    .slice(0, 16)
}

/**
 * The watch app can't run Google's OAuth popup flow (no WebKit on watchOS), so it
 * signs in with an email/password credential instead — linked to this same account
 * (same uid) so it reads/writes the same Firestore data. The password is generated
 * here and only ever shown once; re-generating replaces the previous one.
 */
export async function createWatchPairingPassword(): Promise<{ email: string; password: string }> {
  const user = auth.currentUser
  if (!user || !user.email) throw new Error('You must be signed in to pair a watch.')

  const password = generateWatchPassword()
  const alreadyLinked = user.providerData.some((p) => p.providerId === EmailAuthProvider.PROVIDER_ID)
  if (alreadyLinked) {
    await unlink(user, EmailAuthProvider.PROVIDER_ID)
  }
  await linkWithCredential(user, EmailAuthProvider.credential(user.email, password))
  return { email: user.email, password }
}
