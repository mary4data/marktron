const BASE = 'https://api.peec.ai/customer/v1'

export interface PeecBrand {
  id: string
  name: string
  domains: string[]
  is_own: boolean
  color: string
}

export interface PeecPrompt {
  id: string
  messages: { content: string }[]
  tags: { id: string }[]
  topic?: { id: string }
  user_location?: { country: string }
  volume: number
}

export interface PeecTopic {
  id: string
  name: string
}

export interface PeecTag {
  id: string
  name: string
}

async function peecFetch<T>(path: string): Promise<T> {
  const apiKey = process.env.PEEC_AI_API_KEY
  if (!apiKey) throw new Error('PEEC_AI_API_KEY not set')
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-api-key': apiKey },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`Peec ${path} → ${res.status}`)
  return res.json()
}

export async function getPeecBrands(): Promise<PeecBrand[]> {
  const data = await peecFetch<{ data: PeecBrand[] }>('/brands')
  return data.data ?? []
}

export async function getPeecPrompts(): Promise<PeecPrompt[]> {
  const data = await peecFetch<{ data: PeecPrompt[] }>('/prompts')
  return data.data ?? []
}

export async function getPeecTopics(): Promise<PeecTopic[]> {
  const data = await peecFetch<{ data: PeecTopic[] }>('/topics')
  return data.data ?? []
}

export async function getPeecTags(): Promise<PeecTag[]> {
  const data = await peecFetch<{ data: PeecTag[] }>('/tags')
  return data.data ?? []
}

export async function getAllPeecData() {
  const [brands, prompts, topics, tags] = await Promise.all([
    getPeecBrands(),
    getPeecPrompts(),
    getPeecTopics(),
    getPeecTags(),
  ])
  const topicMap = Object.fromEntries(topics.map((t) => [t.id, t.name]))
  const tagMap = Object.fromEntries(tags.map((t) => [t.id, t.name]))
  const ownBrand = brands.find((b) => b.is_own)
  const competitors = brands.filter((b) => !b.is_own)
  return { brands, prompts, topics, tags, topicMap, tagMap, ownBrand, competitors }
}
