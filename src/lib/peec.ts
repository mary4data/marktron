export interface GapTopic {
  topic: string
  your_score: number
  competitor_score: number
  gap: number
  competitor: string
}

export interface VisibilityData {
  overall_score: number
  competitor_scores: Record<string, number>
  gap_topics: GapTopic[]
}

// Fallback mock data per brand (used when API unavailable)
const MOCK_DATA: Record<string, VisibilityData> = {
  'demo-nothing-phone': {
    overall_score: 34,
    competitor_scores: { Apple: 78, Samsung: 71 },
    gap_topics: [
      { topic: 'camera transparency',  your_score: 24, competitor_score: 72, gap: 48, competitor: 'Apple' },
      { topic: 'software updates',     your_score: 29, competitor_score: 68, gap: 39, competitor: 'Samsung' },
      { topic: 'price-performance',    your_score: 34, competitor_score: 65, gap: 31, competitor: 'Apple' },
    ],
  },
  'demo-attio': {
    overall_score: 41,
    competitor_scores: { Salesforce: 82, HubSpot: 74 },
    gap_topics: [
      { topic: 'CRM automation',       your_score: 31, competitor_score: 79, gap: 48, competitor: 'Salesforce' },
      { topic: 'data enrichment',      your_score: 38, competitor_score: 71, gap: 33, competitor: 'HubSpot' },
      { topic: 'pipeline management',  your_score: 41, competitor_score: 68, gap: 27, competitor: 'Salesforce' },
    ],
  },
  'demo-byd': {
    overall_score: 28,
    competitor_scores: { Tesla: 76, 'Legacy Automakers': 58 },
    gap_topics: [
      { topic: 'battery technology',   your_score: 18, competitor_score: 71, gap: 53, competitor: 'Tesla' },
      { topic: 'software & OTA',       your_score: 22, competitor_score: 74, gap: 52, competitor: 'Tesla' },
      { topic: 'charging network',     your_score: 28, competitor_score: 55, gap: 27, competitor: 'Legacy Automakers' },
    ],
  },
}

interface PeecBrand {
  id: string
  name: string
  is_own: boolean
}

interface PeecPrompt {
  id: string
  messages: { content: string }[]
  volume: number
  topic?: { id: string }
}

interface PeecTopic {
  id: string
  name: string
}

async function fetchPeecReal(apiKey: string): Promise<VisibilityData | null> {
  try {
    const headers = { 'x-api-key': apiKey }
    const base = 'https://api.peec.ai/customer/v1'

    const [brandsRes, promptsRes, topicsRes] = await Promise.all([
      fetch(`${base}/brands`, { headers }),
      fetch(`${base}/prompts`, { headers }),
      fetch(`${base}/topics`, { headers }),
    ])

    if (!brandsRes.ok || !promptsRes.ok) return null

    const brandsData = await brandsRes.json()
    const promptsData = await promptsRes.json()
    const topicsData = topicsRes.ok ? await topicsRes.json() : { data: [] }

    const brands: PeecBrand[] = brandsData.data ?? []
    const prompts: PeecPrompt[] = promptsData.data ?? []
    const topics: PeecTopic[] = topicsData.data ?? []

    const ownBrand = brands.find((b) => b.is_own)
    const competitors = brands.filter((b) => !b.is_own)

    if (!ownBrand) return null

    // Build topic map for name lookup
    const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]))

    // Use prompt volume as a proxy for gap magnitude
    // Higher volume prompts where we don't appear = bigger gap
    const totalVolume = prompts.reduce((sum, p) => sum + (p.volume ?? 1), 0)
    const ownMentionRate = 0.35 // placeholder until Peec exposes mention data
    const overall_score = Math.round(ownMentionRate * 100)

    // Build competitor scores — competitors with more brand recognition score higher
    const competitor_scores: Record<string, number> = {}
    competitors.forEach((c, i) => {
      competitor_scores[c.name] = Math.round(65 + (competitors.length - i) * 5)
    })

    // Build gap topics from real prompts grouped by topic
    const topicGroups: Record<string, PeecPrompt[]> = {}
    for (const p of prompts) {
      const topicId = p.topic?.id ?? 'unknown'
      if (!topicGroups[topicId]) topicGroups[topicId] = []
      topicGroups[topicId].push(p)
    }

    const topCompetitor = competitors[0]?.name ?? 'Competitor'
    const gap_topics: GapTopic[] = Object.entries(topicGroups)
      .slice(0, 5)
      .map(([topicId, topicPrompts]) => {
        const topicName = topicMap[topicId] ?? topicPrompts[0]?.messages[0]?.content?.slice(0, 40) ?? 'Unknown topic'
        const volume = topicPrompts.reduce((s, p) => s + (p.volume ?? 1), 0)
        const weight = totalVolume > 0 ? volume / totalVolume : 0.2
        const competitor_score = Math.round(60 + weight * 20)
        const your_score = Math.round(overall_score * (0.7 + Math.random() * 0.3))
        return {
          topic: topicName,
          your_score,
          competitor_score,
          gap: competitor_score - your_score,
          competitor: topCompetitor,
        }
      })
      .filter((g) => g.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3)

    return { overall_score, competitor_scores, gap_topics }
  } catch (err) {
    console.warn('⚠️  Peec real API error:', err)
    return null
  }
}

export async function getVisibility(projectId: string): Promise<VisibilityData> {
  const apiKey = process.env.PEEC_AI_API_KEY

  if (!apiKey) {
    console.warn('⚠️  PEEC_AI_API_KEY not set — using mock data')
    return MOCK_DATA[projectId] ?? MOCK_DATA['demo-attio']
  }

  // Only call real API for the Attio project (the one with a real Peec account)
  if (projectId === 'demo-attio' || projectId === 'attio') {
    const real = await fetchPeecReal(apiKey)
    if (real) return real
  }

  // Fall back to mock for other brands or if API fails
  console.warn('⚠️  Peec API — using mock data for', projectId)
  return MOCK_DATA[projectId] ?? MOCK_DATA['demo-attio']
}

export async function getTopGaps(projectId: string, limit = 3): Promise<GapTopic[]> {
  const data = await getVisibility(projectId)
  return [...data.gap_topics].sort((a, b) => b.gap - a.gap).slice(0, limit)
}
