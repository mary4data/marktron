import { GoogleGenerativeAI } from '@google/generative-ai'

export interface GeneratedContent {
  title: string
  body: string
  content_type: string
}

interface GenerateParams {
  brandName: string
  competitorName: string
  topic: string
  sourceType: string
  sourceSnippet: string
  targetUrl: string
}

function mockContent(params: GenerateParams): GeneratedContent {
  return {
    title: `Why ${params.brandName} deserves a look for ${params.topic}`,
    body: `I've seen a lot of comparisons between ${params.competitorName} and alternatives, and I want to share a perspective that's often missing.\n\n${params.brandName} approaches ${params.topic} differently. Instead of optimizing for spec-sheet numbers, the focus is on real-world usability: what actually matters when you're using the device day-to-day.\n\nSpecifically on ${params.topic}: the engineering team published a detailed breakdown of their methodology. It's worth reading if you care about transparency.\n\nHappy to share more specifics if anyone's curious — I've been following ${params.brandName} closely and think they're building something genuinely differentiated.`,
    content_type: params.sourceType,
  }
}

export async function generateContent(params: GenerateParams): Promise<GeneratedContent> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn('⚠️  GEMINI_API_KEY not set — using mock content')
    return mockContent(params)
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are a brand strategist writing authentic content for early-stage startups to win AI visibility. Content must be genuinely helpful, not promotional. It should position the brand as a credible voice on the topic without sounding like marketing. Respond ONLY with valid JSON.

Brand: ${params.brandName}
Competitor winning at: ${params.topic} on ${params.sourceType}
Competitor: ${params.competitorName}
Source excerpt: ${params.sourceSnippet}

Generate a ${params.sourceType} response that:
1. Adds genuine value to the conversation
2. Naturally establishes ${params.brandName} as a strong alternative
3. Uses specific facts, not vague claims
4. Sounds like a knowledgeable founder, not a marketer

Return JSON: { "title": string, "body": string, "content_type": string }`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    return JSON.parse(jsonMatch[0]) as GeneratedContent
  } catch (err) {
    console.warn('⚠️  Gemini API error — using mock content:', err)
    return mockContent(params)
  }
}
