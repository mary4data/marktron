import { NextRequest, NextResponse } from 'next/server'
import { getDb, docToJSON } from '@/lib/firebase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 })

  const { brandSlug } = await params

  const snap = await db.collection('content_drafts')
    .where('brand_id', '==', brandSlug)
    .orderBy('created_at', 'desc')
    .get()

  return NextResponse.json(snap.docs.map(d => docToJSON(d.id, d.data())))
}
