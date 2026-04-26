import { NextResponse } from 'next/server'
import { getAllPeecData } from '@/lib/peec-client'
import { getDb, docToJSON } from '@/lib/firebase'

export async function GET() {
  try {
    const { ownBrand, competitors, prompts, topicMap, tagMap } = await getAllPeecData()

    const db = getDb()
    let snapshotData: Record<string, unknown> | null = null
    let draftCount = 0

    if (db) {
      const [snapshots, drafts] = await Promise.all([
        db.collection('visibility_snapshots').where('brand_id', '==', 'attio')
          .orderBy('created_at', 'desc').limit(1).get(),
        db.collection('content_drafts').where('brand_id', '==', 'attio')
          .where('status', '==', 'pending').get(),
      ])
      if (!snapshots.empty) snapshotData = docToJSON(snapshots.docs[0].id, snapshots.docs[0].data())
      draftCount = drafts.size
    }

    const totalVolume = prompts.reduce((s, p) => s + (p.volume ?? 1), 0)

    const competitorScores = (snapshotData?.competitor_scores as Record<string, number>) ?? {}
    const gapTopics = (snapshotData?.gap_topics as Array<{
      topic: string; your_score: number; competitor_score: number; gap: number; competitor: string
    }>) ?? []

    // Best gap per competitor
    const topGapByCompetitor: Record<string, { topic: string; gap: number }> = {}
    for (const g of gapTopics) {
      if (!topGapByCompetitor[g.competitor] || g.gap > topGapByCompetitor[g.competitor].gap) {
        topGapByCompetitor[g.competitor] = { topic: g.topic, gap: g.gap }
      }
    }

    const activity = prompts.slice(0, 5).map((p) => ({
      kind: 'gap',
      text: `Gap detected: "${p.messages[0]?.content?.slice(0, 60)}..." (vol: ${p.volume})`,
      topic: p.topic?.id ? topicMap[p.topic.id] : null,
      tags: p.tags.map((t) => tagMap[t.id]).filter(Boolean),
      time: 'live',
    }))

    const positioning = competitors.map((c, i) => ({
      brand: c.name,
      color: c.color,
      rank: i + 2,
      score: competitorScores[c.name] ?? null,
      topGap: topGapByCompetitor[c.name] ?? null,
    }))

    return NextResponse.json({
      ownBrand,
      competitors,
      stats: {
        promptsTracked: prompts.length,
        totalVolume,
        competitorCount: competitors.length,
        topicsCount: Object.keys(topicMap).length,
        draftsQueue: draftCount,
        overallScore: snapshotData?.overall_score ?? null,
      },
      activity,
      positioning,
      snapshot: snapshotData,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
