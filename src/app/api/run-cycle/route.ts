import { NextRequest, NextResponse } from 'next/server'
import { getDb, docToJSON } from '@/lib/firebase'
import { FieldValue } from 'firebase-admin/firestore'
import { getVisibility, getTopGaps } from '@/lib/peec'
import { findCompetitorSources } from '@/lib/tavily'
import { generateContent } from '@/lib/generator'

export async function POST(req: NextRequest) {
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 })

  const { brandSlug } = await req.json()
  if (!brandSlug) return NextResponse.json({ error: 'brandSlug required' }, { status: 400 })

  const brandSnap = await db.collection('brands').doc(brandSlug).get()
  if (!brandSnap.exists) return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  const brand = docToJSON(brandSnap.id, brandSnap.data()!)

  const [visibility, gaps] = await Promise.all([
    getVisibility(brand.peec_project_id as string),
    getTopGaps(brand.peec_project_id as string),
  ])

  const snapshotRef = db.collection('visibility_snapshots').doc()
  await snapshotRef.set({
    brand_id: brandSlug,
    snapshot_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' }),
    overall_score: visibility.overall_score,
    competitor_scores: visibility.competitor_scores,
    gap_topics: visibility.gap_topics,
    raw_response: visibility,
    created_at: FieldValue.serverTimestamp(),
  })

  let draftsCreated = 0
  const errors: string[] = []

  for (const gap of gaps) {
    try {
      const sources = await findCompetitorSources(gap.topic, gap.competitor, brand.name as string)

      const savedSourceIds: Array<{ id: string; url: string; source_type: string; content: string }> = []
      for (const src of sources) {
        const srcRef = db.collection('competitor_sources').doc()
        await srcRef.set({
          brand_id: brandSlug,
          snapshot_id: snapshotRef.id,
          source_url: src.url,
          source_type: src.source_type,
          competitor_name: gap.competitor,
          topic: gap.topic,
          tavily_score: src.score,
          content_snippet: src.content.slice(0, 500),
          created_at: FieldValue.serverTimestamp(),
        })
        savedSourceIds.push({ id: srcRef.id, url: src.url, source_type: src.source_type, content: src.content })
      }

      const topSource = savedSourceIds[0]
      if (!topSource) continue

      const generated = await generateContent({
        brandName: brand.name as string,
        competitorName: gap.competitor,
        topic: gap.topic,
        sourceType: topSource.source_type,
        sourceSnippet: topSource.content.slice(0, 300),
        targetUrl: topSource.url,
      })

      const draftRef = db.collection('content_drafts').doc()
      await draftRef.set({
        brand_id: brandSlug,
        source_id: topSource.id,
        content_type: generated.content_type,
        title: generated.title,
        body: generated.body,
        target_url: topSource.url,
        status: 'pending',
        approved_at: null,
        created_at: FieldValue.serverTimestamp(),
      })

      draftsCreated++
    } catch (err) {
      errors.push(`Gap "${gap.topic}": ${String(err)}`)
    }
  }

  return NextResponse.json({
    snapshotId: snapshotRef.id,
    draftsCreated,
    gaps,
    errors: errors.length > 0 ? errors : undefined,
  })
}
