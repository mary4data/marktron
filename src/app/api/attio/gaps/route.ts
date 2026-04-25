import { NextResponse } from 'next/server'
import { getAllPeecData } from '@/lib/peec-client'

export async function GET() {
  try {
    const { prompts, topicMap, tagMap, competitors } = await getAllPeecData()

    const topCompetitor = competitors[0]?.name ?? 'Competitor'

    const gaps = prompts.map((p) => {
      const topicName = p.topic?.id ? (topicMap[p.topic.id] ?? 'General') : 'General'
      const tags = p.tags.map((t) => tagMap[t.id]).filter(Boolean)
      const vol = p.volume ?? 1

      // Derive priority from volume
      const priority =
        vol >= 5 ? 'critical' :
        vol >= 3 ? 'high' :
        vol >= 2 ? 'medium' : 'low'

      return {
        id: p.id,
        prompt: p.messages[0]?.content ?? '',
        topic: topicName,
        tags,
        country: p.user_location?.country ?? 'US',
        volume: vol,
        competitor: topCompetitor,
        priority,
      }
    }).sort((a, b) => b.volume - a.volume)

    return NextResponse.json({ gaps, competitors })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
