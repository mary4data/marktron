import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { getDb, docToJSON } from '@/lib/firebase'
import { getPeecBrands } from '@/lib/peec-client'
import { ReportDocument, ReportData } from '@/lib/report-pdf'
import { Resend } from 'resend'

// renderToBuffer types don't accept FunctionComponentElement — cast at callsite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderPdf = renderToBuffer as (el: any) => Promise<Buffer>

async function buildReportData(): Promise<ReportData> {
  const brands = await getPeecBrands()
  const ownBrand = brands.find((b) => b.is_own)
  const competitors = brands.filter((b) => !b.is_own)
  const brandName = ownBrand?.name ?? 'Your Brand'
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const db = getDb()
  let overallScore: number | null = null
  let competitorScores: Record<string, number> = {}
  let gapTopics: Array<{ topic: string; competitor: string; gap: number }> = []
  let approvedDrafts: Array<{ title: string; content_type: string }> = []
  let currentScore = 0
  let approvedCount = 0

  if (db) {
    const [snapshotSnap, draftsSnap] = await Promise.all([
      db.collection('visibility_snapshots')
        .where('brand_id', '==', 'attio')
        .orderBy('created_at', 'desc')
        .limit(1)
        .get(),
      db.collection('content_drafts')
        .where('brand_id', '==', 'attio')
        .where('status', '==', 'approved')
        .get(),
    ])

    if (!snapshotSnap.empty) {
      const snap = docToJSON(snapshotSnap.docs[0].id, snapshotSnap.docs[0].data())
      overallScore = (snap.overall_score as number) ?? null
      currentScore = overallScore ?? 0
      competitorScores = (snap.competitor_scores as Record<string, number>) ?? {}
      const rawGaps = (snap.gap_topics as Array<{ topic: string; competitor: string; gap: number; your_score: number; competitor_score: number }>) ?? []
      gapTopics = rawGaps
        .sort((a, b) => b.gap - a.gap)
        .map((g) => ({ topic: g.topic, competitor: g.competitor, gap: g.gap }))
    }

    approvedDrafts = draftsSnap.docs.map((d) => {
      const data = d.data()
      return { title: data.title as string, content_type: data.content_type as string }
    })
    approvedCount = approvedDrafts.length
  }

  // Simple forecast: content boost model
  const avgGap = gapTopics.length
    ? gapTopics.reduce((s, g) => s + g.gap, 0) / gapTopics.length
    : 20
  const contentBoostTotal = Math.round(approvedCount * avgGap * 0.08)
  const projectedScore = Math.min(100, Math.round(currentScore + contentBoostTotal))

  const FALLBACK = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6']
  const competitorList = competitors.map((c, i) => ({
    name: c.name,
    color: c.color || FALLBACK[i % FALLBACK.length],
    score: competitorScores[c.name] ?? null,
  }))

  return {
    brandName,
    date,
    overallScore,
    competitors: competitorList,
    gaps: gapTopics,
    actions: approvedDrafts,
    currentScore,
    projectedScore,
    contentBoostTotal,
    approvedCount,
  }
}

// GET /api/report — download PDF
export async function GET() {
  try {
    const data = await buildReportData()
    const buffer = await renderPdf(createElement(ReportDocument, { data }))

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="visibility-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST /api/report — generate and send via email
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 503 })

    const data = await buildReportData()
    const buffer = await renderPdf(createElement(ReportDocument, { data }))
    const filename = `visibility-report-${new Date().toISOString().split('T')[0]}.pdf`

    const resend = new Resend(apiKey)
    const from = process.env.REPORT_FROM_EMAIL ?? 'reports@resend.dev'

    await resend.emails.send({
      from,
      to: email,
      subject: `${data.brandName} · AI Visibility Report · ${data.date}`,
      html: `
        <p>Hi,</p>
        <p>Your latest AI visibility report for <strong>${data.brandName}</strong> is attached.</p>
        <ul>
          <li>Visibility score: <strong>${data.overallScore ?? '—'} / 100</strong></li>
          <li>Top gaps identified: <strong>${data.gaps.length}</strong></li>
          <li>Approved actions: <strong>${data.approvedCount}</strong></li>
          <li>Projected boost: <strong>+${data.contentBoostTotal}pt</strong></li>
        </ul>
        <p>Powered by Peec AI · marktron</p>
      `,
      attachments: [{ filename, content: buffer }],
    })

    return NextResponse.json({ ok: true, email })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
