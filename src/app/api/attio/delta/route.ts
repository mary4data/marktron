import { NextResponse } from 'next/server'
import { getDb, docToJSON } from '@/lib/firebase'
import { getPeecBrands } from '@/lib/peec-client'

function avg(nums: number[]) {
  return nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0
}

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(v)))
}

function fmtDate(iso: string) {
  const [, month, day] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(month) - 1]} ${parseInt(day)}`
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

export async function GET() {
  try {
    const brands = await getPeecBrands()
    const ownBrand = brands.find((b) => b.is_own)
    const competitors = brands.filter((b) => !b.is_own)
    const ownKey = ownBrand?.name ?? 'Attio'

    const FALLBACK = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6']
    const colorMap: Record<string, string> = { [ownKey]: '#3b82f6' }
    competitors.forEach((c, i) => { colorMap[c.name] = c.color || FALLBACK[i % FALLBACK.length] })

    const db = getDb()
    let history: Record<string, unknown>[] = []
    let drafts: Record<string, unknown>[] = []
    let approvedDrafts: Record<string, unknown>[] = []
    let latestSnapshot: Record<string, unknown> | null = null

    if (db) {
      const [snapshotsSnap, draftsSnap, approvedSnap, latestSnap] = await Promise.all([
        db.collection('visibility_snapshots')
          .where('brand_id', '==', 'attio')
          .orderBy('created_at', 'asc')
          .get(),
        db.collection('content_drafts')
          .where('brand_id', '==', 'attio')
          .where('status', '==', 'approved')
          .orderBy('approved_at', 'desc')
          .get(),
        db.collection('content_drafts')
          .where('brand_id', '==', 'attio')
          .where('status', '==', 'approved')
          .get(),
        db.collection('visibility_snapshots')
          .where('brand_id', '==', 'attio')
          .orderBy('created_at', 'desc')
          .limit(1)
          .get(),
      ])
      history = snapshotsSnap.docs.map((d) => docToJSON(d.id, d.data()))
      drafts = draftsSnap.docs.map((d) => docToJSON(d.id, d.data()))
      approvedDrafts = approvedSnap.docs.map((d) => docToJSON(d.id, d.data()))
      if (!latestSnap.empty) latestSnapshot = docToJSON(latestSnap.docs[0].id, latestSnap.docs[0].data())
    }

    // Group snapshots by date and average scores
    const byDate: Record<string, { own: number[]; competitors: Record<string, number[]> }> = {}
    for (const s of history) {
      const date = (s.snapshot_date as string) ?? (s.created_at as string)?.split('T')[0]
      if (!date) continue
      if (!byDate[date]) byDate[date] = { own: [], competitors: {} }
      byDate[date].own.push((s.overall_score as number) ?? 0)
      const compScores = (s.competitor_scores as Record<string, number>) ?? {}
      for (const [name, score] of Object.entries(compScores)) {
        if (!byDate[date].competitors[name]) byDate[date].competitors[name] = []
        byDate[date].competitors[name].push(score)
      }
    }

    const sortedDates = Object.keys(byDate).sort()
    const chartData = sortedDates.map((date) => {
      const { own, competitors: compGroups } = byDate[date]
      const point: Record<string, string | number | boolean> = {
        date: fmtDate(date),
        rawDate: date,
        [ownKey]: avg(own),
        projected: false,
      }
      for (const [name, scores] of Object.entries(compGroups)) {
        point[name] = avg(scores)
      }
      return point
    })

    // ── Forecast ──────────────────────────────────────────────────────────────
    // Trend: slope per day from actual data
    const ownActual = sortedDates.map((d) => avg(byDate[d].own))
    const days = sortedDates.length
    const slope = days >= 2
      ? (ownActual[days - 1] - ownActual[0]) / Math.max(days - 1, 1)
      : 0

    // Content impact model: each approved draft = +gap_avg * 0.08 boost, phased in
    const gapTopics = (latestSnapshot?.gap_topics as Array<{ gap: number }>) ?? []
    const avgGap = gapTopics.length
      ? gapTopics.reduce((s, g) => s + g.gap, 0) / gapTopics.length
      : 20
    const contentBoostPerDraft = avgGap * 0.08
    const totalContentBoost = approvedDrafts.length * contentBoostPerDraft

    const lastOwnScore = ownActual[ownActual.length - 1] ?? 0
    const lastDate = sortedDates[sortedDates.length - 1]

    // Competitor slopes
    const compSlopes: Record<string, number> = {}
    for (const c of competitors) {
      const scores = sortedDates.map((d) => byDate[d]?.competitors[c.name]?.[0] ?? 0).filter(Boolean)
      compSlopes[c.name] = scores.length >= 2
        ? (scores[scores.length - 1] - scores[0]) / Math.max(scores.length - 1, 1)
        : 0
    }

    const forecastPoints = lastDate ? [1, 2].map((n) => {
      const forecastDate = addDays(lastDate, n)
      const point: Record<string, string | number | boolean> = {
        date: fmtDate(forecastDate),
        rawDate: forecastDate,
        projected: true,
        // Own brand: trend + content boost phased in (40% day1, 100% day2)
        [`${ownKey}_f`]: clamp(lastOwnScore + slope * n + totalContentBoost * (n === 1 ? 0.4 : 1)),
      }
      // Competitors: linear trend only (no content action)
      for (const c of competitors) {
        const lastCompScore = byDate[lastDate]?.competitors[c.name]
          ? avg(byDate[lastDate].competitors[c.name])
          : 0
        point[`${c.name}_f`] = clamp(lastCompScore + (compSlopes[c.name] ?? 0) * n)
      }
      return point
    }) : []

    // Merge actual + forecast — last actual point anchors the forecast lines so they connect
    const allData = [
      ...chartData.map((p, idx) => {
        const isLast = idx === chartData.length - 1
        return {
          ...p,
          [`${ownKey}_f`]: isLast ? p[ownKey] : null,
          ...Object.fromEntries(
            competitors.map((c) => [`${c.name}_f`, isLast ? (p[c.name] ?? null) : null])
          ),
        }
      }),
      ...forecastPoints.map((p) => ({
        ...p,
        [ownKey]: null,
        ...Object.fromEntries(competitors.map((c) => [c.name, null])),
      })),
    ]

    const forecastStart = forecastPoints[0]?.date ?? null

    const brandLines = [
      { name: ownKey, color: colorMap[ownKey], isOwn: true },
      ...competitors.map((c) => ({ name: c.name, color: colorMap[c.name], isOwn: false })),
    ]

    return NextResponse.json({
      chartData: allData,
      drafts,
      brandLines,
      forecastStart,
      approvedCount: approvedDrafts.length,
      contentBoostTotal: Math.round(totalContentBoost),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
