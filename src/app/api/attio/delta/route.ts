import { NextResponse } from 'next/server'
import { getDb, docToJSON } from '@/lib/firebase'
import { getAllPeecData } from '@/lib/peec-client'

export async function GET() {
  try {
    const { competitors } = await getAllPeecData()
    const topCompetitor = competitors[0]?.name ?? 'Competitor'

    const db = getDb()
    let history: Record<string, unknown>[] = []
    let drafts: Record<string, unknown>[] = []

    if (db) {
      const [snapshotsSnap, draftsSnap] = await Promise.all([
        db.collection('visibility_snapshots')
          .where('brand_id', '==', 'attio')
          .orderBy('created_at', 'asc')
          .get(),
        db.collection('content_drafts')
          .where('brand_id', '==', 'attio')
          .where('status', '==', 'approved')
          .orderBy('approved_at', 'desc')
          .get(),
      ])

      history = snapshotsSnap.docs.map((d) => docToJSON(d.id, d.data()))
      drafts = draftsSnap.docs.map((d) => docToJSON(d.id, d.data()))
    }

    // Build chart data: own score vs top competitor
    const chartData = history.map((s) => {
      const competitorScores = s.competitor_scores as Record<string, number> ?? {}
      const topCompScore = competitorScores[topCompetitor] ?? competitorScores[Object.keys(competitorScores)[0]] ?? 0
      return {
        date: (s.snapshot_date as string) ?? (s.created_at as string)?.split('T')[0],
        attio: s.overall_score,
        competitor: topCompScore,
      }
    })

    return NextResponse.json({ chartData, drafts, topCompetitor })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
