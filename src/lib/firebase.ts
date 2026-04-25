import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let _db: Firestore | null = null

export function getDb(): Firestore | null {
  if (_db) return _db

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId) return null

  if (getApps().length === 0) {
    // Use explicit service account key if available, otherwise fall back to ADC
    const credential = clientEmail && privateKey
      ? cert({ projectId, clientEmail, privateKey })
      : applicationDefault()

    initializeApp({ credential, projectId })
  }

  _db = getFirestore('marktron-db')
  return _db
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function docToJSON(id: string, data: Record<string, any>) {
  const result: Record<string, unknown> = { id, ...data }
  for (const [key, val] of Object.entries(result)) {
    if (val && typeof val === 'object' && 'toDate' in val) {
      result[key] = (val as { toDate: () => Date }).toDate().toISOString()
    }
  }
  return result
}
