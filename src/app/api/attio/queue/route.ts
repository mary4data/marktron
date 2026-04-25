import { NextResponse } from 'next/server'
import { getDb, docToJSON } from '@/lib/firebase'

export async function GET() {
  const db = getDb()
  if (!db) return NextResponse.json({ pending: [], approved: [], rejected: [] })

  const snap = await db.collection('content_drafts')
    .where('brand_id', '==', 'attio')
    .orderBy('created_at', 'desc')
    .get()

  const all = snap.docs.map((d) => docToJSON(d.id, d.data()))
  return NextResponse.json({
    pending: all.filter((d) => d.status === 'pending'),
    approved: all.filter((d) => d.status === 'approved'),
    rejected: all.filter((d) => d.status === 'rejected'),
  })
}
