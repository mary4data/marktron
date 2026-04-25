import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  const db = getDb()
  if (!db) return NextResponse.json({ ok: true })

  const body = await req.json()
  const { task_id, status, metadata } = body

  if (!task_id || !status) {
    return NextResponse.json({ error: 'task_id and status required' }, { status: 400 })
  }

  const update = {
    status,
    approved_at: status === 'approved' ? FieldValue.serverTimestamp() : null,
  }

  if (metadata?.draftId) {
    await db.collection('content_drafts').doc(metadata.draftId).update(update)
  } else {
    const snap = await db.collection('content_drafts')
      .where('entire_task_id', '==', task_id).limit(1).get()
    if (!snap.empty) await snap.docs[0].ref.update(update)
  }

  return NextResponse.json({ ok: true })
}
