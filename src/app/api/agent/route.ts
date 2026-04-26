import { NextRequest } from 'next/server'
import { VertexAI, SchemaType, type FunctionDeclaration } from '@google-cloud/vertexai'
import { getDb, docToJSON } from '@/lib/firebase'
import { FieldValue } from 'firebase-admin/firestore'
import { getVisibility, getTopGaps } from '@/lib/peec'
import { findCompetitorSources } from '@/lib/tavily'
import { generateContent } from '@/lib/generator'

const O = SchemaType.OBJECT
const S = SchemaType.STRING

// Only the creative tools — deterministic steps are pre-fetched before the loop
const FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'search_sources',
    description: 'Search the web for competitor content on a specific topic using Tavily',
    parameters: {
      type: O,
      properties: { topic: { type: S }, competitor: { type: S }, brand_name: { type: S } },
      required: ['topic', 'competitor', 'brand_name'],
    },
  },
  {
    name: 'generate_draft',
    description: 'Generate a content draft to close a visibility gap using Gemini AI',
    parameters: {
      type: O,
      properties: {
        brand_name: { type: S }, competitor_name: { type: S }, topic: { type: S },
        source_type: { type: S }, source_snippet: { type: S }, target_url: { type: S },
      },
      required: ['brand_name', 'competitor_name', 'topic', 'source_type', 'source_snippet', 'target_url'],
    },
  },
  {
    name: 'save_draft',
    description: 'Save a generated content draft to Firestore for human review',
    parameters: {
      type: O,
      properties: {
        brand_id: { type: S }, title: { type: S }, body: { type: S },
        content_type: { type: S }, target_url: { type: S },
      },
      required: ['brand_id', 'title', 'body', 'content_type', 'target_url'],
    },
  },
]

type ToolInput = Record<string, unknown>

async function executeTool(name: string, input: ToolInput): Promise<unknown> {
  switch (name) {
    case 'search_sources': {
      const sources = await findCompetitorSources(
        input.topic as string,
        input.competitor as string,
        input.brand_name as string
      )
      return sources.slice(0, 2).map((s) => ({
        url: s.url,
        type: s.source_type,
        snippet: s.content.slice(0, 300),
      }))
    }
    case 'generate_draft':
      return generateContent({
        brandName: input.brand_name as string,
        competitorName: input.competitor_name as string,
        topic: input.topic as string,
        sourceType: input.source_type as string,
        sourceSnippet: input.source_snippet as string,
        targetUrl: input.target_url as string,
      })
    case 'save_draft': {
      const db = getDb()
      if (!db) return { saved: false, reason: 'no db' }
      const ref = db.collection('content_drafts').doc()
      await ref.set({
        brand_id: input.brand_id,
        title: input.title,
        body: input.body,
        content_type: input.content_type,
        target_url: input.target_url,
        status: 'pending',
        approved_at: null,
        created_at: FieldValue.serverTimestamp(),
      })
      return { saved: true, id: ref.id }
    }
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

export async function POST(req: NextRequest) {
  const { brandSlug } = await req.json()

  const db = getDb()
  if (!db) return new Response(JSON.stringify({ error: 'Firebase not configured' }), { status: 503 })

  const brandSnap = await db.collection('brands').doc(brandSlug).get()
  if (!brandSnap.exists) return new Response(JSON.stringify({ error: 'Brand not found' }), { status: 404 })
  const brand = docToJSON(brandSnap.id, brandSnap.data()!)

  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) return new Response(JSON.stringify({ error: 'FIREBASE_PROJECT_ID not set' }), { status: 503 })

  const vertexAI = new VertexAI({ project: projectId, location: 'us-central1' })
  const model = vertexAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }],
    systemInstruction: {
      role: 'system',
      parts: [{
        text: `You are marktron, an autonomous AI marketing agent improving ${brand.name}'s visibility in AI search results. You will be given visibility data and gaps upfront. Your job is to search for sources and generate content drafts. Always call multiple tools in parallel when possible — never wait for one result before starting the next independent call.`,
      }],
    },
  })

  const encoder = new TextEncoder()
  let toolCounter = 0

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        // ── Phase 1: Pre-fetch all deterministic data in parallel (no Gemini needed) ──
        emit({ type: 'thinking', text: 'Fetching visibility scores and gaps in parallel…' })

        const [visibility, gaps] = await Promise.all([
          getVisibility(brand.peec_project_id as string),
          getTopGaps(brand.peec_project_id as string),
        ])

        emit({
          type: 'tool_result',
          tool: 'get_visibility',
          id: `tool_${toolCounter++}`,
          result: {
            overall_score: visibility.overall_score,
            competitor_scores: visibility.competitor_scores,
          },
        })

        const topGaps = (gaps as Array<{ topic: string; competitor: string; gap?: number }>).slice(0, 3)
        emit({
          type: 'tool_result',
          tool: 'get_gaps',
          id: `tool_${toolCounter++}`,
          result: topGaps,
        })

        // ── Phase 2: Save snapshot (deterministic, no Gemini needed) ──
        const snapshotRef = db.collection('visibility_snapshots').doc()
        await snapshotRef.set({
          brand_id: brandSlug,
          snapshot_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' }),
          overall_score: visibility.overall_score,
          competitor_scores: visibility.competitor_scores,
          gap_topics: visibility.gap_topics,
          created_at: FieldValue.serverTimestamp(),
        })
        emit({
          type: 'tool_result',
          tool: 'save_snapshot',
          id: `tool_${toolCounter++}`,
          result: { saved: true, id: snapshotRef.id },
        })

        // ── Phase 3: Gemini handles creative work — gaps already known ──
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const history: any[] = []

        history.push({
          role: 'user',
          parts: [{
            text: `Visibility data for ${brand.name} (brand_id: "${brandSlug}") is ready.

Overall score: ${visibility.overall_score}
Competitor scores: ${JSON.stringify(visibility.competitor_scores)}

Top ${topGaps.length} gaps to close:
${topGaps.map((g, i) => `${i + 1}. Topic: "${g.topic}" | Competitor: "${g.competitor}"`).join('\n')}

For each gap:
1. Call search_sources (all gaps in parallel in this turn)
2. Then call generate_draft for each (in parallel)
3. Then call save_draft for each (in parallel)

Brand name: "${brand.name}". Start immediately — call all search_sources in parallel now.`,
          }],
        })

        let iterations = 0

        while (iterations < 15) {
          iterations++

          const result = await model.generateContent({ contents: history })
          const candidate = result.response.candidates?.[0]
          const content = candidate?.content
          if (!content) break

          history.push(content)

          for (const part of content.parts) {
            if (part.text?.trim()) emit({ type: 'thinking', text: part.text })
          }

          const fnCalls = content.parts.filter((p) => p.functionCall)
          if (fnCalls.length === 0) {
            emit({ type: 'done' })
            break
          }

          // Execute all tool calls in this turn in parallel
          const results = await Promise.all(
            fnCalls.map(async (part) => {
              const { name, args } = part.functionCall!
              const id = `tool_${toolCounter++}`
              emit({ type: 'tool_call', tool: name, input: args, id })
              try {
                const toolResult = await executeTool(name, args as ToolInput)
                emit({ type: 'tool_result', tool: name, result: toolResult, id })
                const response = Array.isArray(toolResult) ? { result: toolResult } : toolResult as object
                return { ok: true, name, response, id }
              } catch (err) {
                const error = String(err)
                emit({ type: 'tool_error', tool: name, error, id })
                return { ok: false, name, response: { error }, id }
              }
            })
          )

          history.push({
            role: 'user',
            parts: results.map((r) => ({
              functionResponse: { name: r.name, response: r.response },
            })),
          })
        }
      } catch (err) {
        emit({ type: 'error', error: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
