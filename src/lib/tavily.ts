export interface TavilyResult {
  url: string
  title: string
  content: string
  score: number
  source_type: string
}

function inferSourceType(url: string): string {
  if (url.includes('reddit.com')) return 'reddit'
  if (url.includes('g2.com')) return 'g2'
  if (url.includes('trustpilot.com')) return 'trustpilot'
  if (url.includes('linkedin.com')) return 'linkedin'
  if (url.includes('news.ycombinator.com')) return 'hackernews'
  return 'web'
}

function mockResults(topic: string, competitor: string): TavilyResult[] {
  return [
    {
      url: `https://reddit.com/r/smartphones/comments/abc123/${topic.replace(/\s+/g, '_')}_vs_${competitor.toLowerCase()}`,
      title: `${competitor} vs alternatives: ${topic} comparison thread`,
      content: `I've been using ${competitor} for two years. The ${topic} is genuinely impressive — way ahead of smaller brands. Has anyone found a real alternative that matches it?`,
      score: 0.91,
      source_type: 'reddit',
    },
    {
      url: `https://g2.com/compare/${competitor.toLowerCase()}-vs-alternatives`,
      title: `${competitor} Reviews: ${topic} — G2`,
      content: `Reviewers consistently praise ${competitor} for ${topic}. Compared to lesser-known competitors, the gap is significant according to 847 verified reviews.`,
      score: 0.87,
      source_type: 'g2',
    },
    {
      url: `https://news.ycombinator.com/item?id=987654`,
      title: `Ask HN: Best alternative to ${competitor} for ${topic}?`,
      content: `${competitor} dominates here. Would love to know if there's a credible challenger with transparent specs and fair pricing.`,
      score: 0.82,
      source_type: 'hackernews',
    },
  ]
}

export async function findCompetitorSources(
  topic: string,
  competitor: string,
  brandName: string
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    console.warn('⚠️  TAVILY_API_KEY not set — using mock data')
    return mockResults(topic, competitor)
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${competitor} ${topic} review discussion`,
        search_depth: 'advanced',
        include_answer: false,
        max_results: 5,
        include_domains: [
          'reddit.com',
          'g2.com',
          'trustpilot.com',
          'linkedin.com',
          'news.ycombinator.com',
        ],
      }),
    })
    if (!res.ok) throw new Error(`Tavily returned ${res.status}`)
    const data = await res.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.results ?? []).map((r: any) => ({
      url: r.url,
      title: r.title,
      content: r.content,
      score: r.score,
      source_type: inferSourceType(r.url),
    }))
  } catch (err) {
    console.warn('⚠️  Tavily API error — using mock data:', err)
    return mockResults(topic, competitor)
  }

  void brandName
}
