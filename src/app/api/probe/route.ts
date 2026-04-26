import { NextRequest, NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'

function systemPrompt(engine: string) {
  return `You are a GEO analyst simulating how ${engine} ranks brands in AI-generated responses.
Return ONLY valid JSON, no markdown, no explanation:
{
  "rankings": [
    { "name": string, "description": string, "vis": number, "sent": number, "pos": number }
  ],
  "engineNote": string
}
Exactly 3 rankings. vis is 0–100, sent is 50–100, pos is 1.0–5.0.
Vary the target brand's rank position across engines — do not always rank it #1.
Use realistic competitor brands for the query category.
engineNote must reference how ${engine} actually sources content (e.g. G2, Reddit, structured data, product blogs).`
}

function userMessage(brand: string, prompt: string) {
  return `Brand to focus on: ${brand}\nPrompt being tested: "${prompt}"`
}

function parseJson(text: string) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in response')
  return JSON.parse(match[0])
}

async function callChatGPT(brand: string, prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not set')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt('ChatGPT') },
        { role: 'user', content: userMessage(brand, prompt) },
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return parseJson(data.choices[0].message.content)
}


async function callGemini(brand: string, prompt: string) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID not set')

  const vertexAI = new VertexAI({ project: projectId, location: 'us-central1' })
  const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userMessage(brand, prompt) }] }],
    systemInstruction: { role: 'system', parts: [{ text: systemPrompt('Gemini') }] },
  })
  const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return parseJson(text)
}

export async function POST(req: NextRequest) {
  const { brand, prompt, engine } = await req.json()

  try {
    let result
    if (engine === 'ChatGPT') result = await callChatGPT(brand, prompt)
    else if (engine === 'Gemini') result = await callGemini(brand, prompt)
    else return NextResponse.json({ error: `Unknown engine: ${engine}` }, { status: 400 })

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
