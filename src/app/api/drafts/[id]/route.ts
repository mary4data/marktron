import { NextRequest, NextResponse } from 'next/server'
import { getDb, docToJSON } from '@/lib/firebase'
import { FieldValue } from 'firebase-admin/firestore'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 })

  const { id } = await params
  const { status } = await req.json()

  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 })
  }

  const ref = db.collection('content_drafts').doc(id)
  const snap = await ref.get()
  if (!snap.exists) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })

  await ref.update({
    status,
    approved_at: status === 'approved' ? FieldValue.serverTimestamp() : null,
  })

  const updated = await ref.get()
  return NextResponse.json(docToJSON(updated.id, updated.data()!))
}
