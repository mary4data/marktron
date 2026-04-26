import { NextResponse } from 'next/server'
import { getPeecBrands } from '@/lib/peec-client'

export async function GET() {
  const result: Record<string, string> = {
    peec: 'error',
    gemini: 'error',
    tavily: 'error',
    firestore: 'error',
  }

  // Peec AI
  try {
    await getPeecBrands()
    result.peec = 'ok'
  } catch {}

  // Vertex AI (uses ADC — just check project ID is set)
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID
    if (projectId) {
      const { VertexAI } = await import('@google-cloud/vertexai')
      const vertexAI = new VertexAI({ project: projectId, location: 'us-central1' })
      vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
      result.gemini = 'ok'
    }
  } catch {}

  // Tavily
  try {
    const key = process.env.TAVILY_API_KEY
    if (key) {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key, query: 'test', max_results: 1 }),
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) result.tavily = 'ok'
    }
  } catch {}

  // Firestore
  try {
    const { getDb } = await import('@/lib/firebase')
    const db = getDb()
    if (!db) throw new Error('no db')
    await db.collection('_health').limit(1).get()
    result.firestore = 'ok'
  } catch {}

  return NextResponse.json(result)
}
