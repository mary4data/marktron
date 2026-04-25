import { NextRequest, NextResponse } from 'next/server'
import { getDb, docToJSON } from '@/lib/firebase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 })

  const { slug } = await params

  const brandSnap = await db.collection('brands').doc(slug).get()
  if (!brandSnap.exists) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })

  const snapshotsSnap = await db.collection('visibility_snapshots')
    .where('brand_id', '==', slug)
    .orderBy('created_at', 'desc')
    .limit(1)
    .get()

  const draftsSnap = await db.collection('content_drafts')
    .where('brand_id', '==', slug)
    .where('status', '==', 'pending')
    .orderBy('created_at', 'desc')
    .get()

  return NextResponse.json({
    brand: docToJSON(brandSnap.id, brandSnap.data()!),
    snapshot: snapshotsSnap.empty ? null : docToJSON(snapshotsSnap.docs[0].id, snapshotsSnap.docs[0].data()),
    drafts: draftsSnap.docs.map(d => docToJSON(d.id, d.data())),
  })
}
