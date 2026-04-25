'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { DraftModal } from './DraftModal'

interface GapTopic {
  topic: string
  your_score: number
  competitor_score: number
  gap: number
  competitor: string
}

interface Snapshot {
  id: string
  overall_score: number
  competitor_scores: Record<string, number>
  gap_topics: GapTopic[]
  created_at: string
}

interface Draft {
  id: string
  content_type: string
  title: string
  body: string
  target_url: string
  status: string
  created_at: string
}

interface BrandData {
  brand: { id: string; name: string; slug: string; competitors: string[] }
  snapshot: Snapshot | null
  drafts: Draft[]
}

const CYCLE_STEPS = [
  'Pulling Peec data...',
  'Scanning competitor sources...',
  'Drafting content...',
  'Sending for approval...',
  'Done!',
]

const BRAND_LABELS: Record<string, { name: string; tagline: string }> = {
  'nothing-phone': { name: 'Nothing Phone', tagline: 'vs Apple & Samsung' },
  attio: { name: 'Attio', tagline: 'vs Salesforce & HubSpot' },
  byd: { name: 'BYD', tagline: 'vs Tesla & Legacy Automakers' },
}

function gapColor(gap: number) {
  if (gap > 20) return 'text-red-400'
  if (gap > 10) return 'text-amber-400'
  return 'text-green-400'
}

function gapBg(gap: number) {
  if (gap > 20) return 'bg-red-500'
  if (gap > 10) return 'bg-amber-500'
  return 'bg-green-500'
}

function sourceTypeBadge(type: string) {
  const map: Record<string, string> = {
    reddit: 'bg-orange-900/40 text-orange-300 border-orange-800',
    g2: 'bg-red-900/40 text-red-300 border-red-800',
    hackernews: 'bg-amber-900/40 text-amber-300 border-amber-800',
    linkedin: 'bg-blue-900/40 text-blue-300 border-blue-800',
    trustpilot: 'bg-green-900/40 text-green-300 border-green-800',
    web: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  }
  return map[type] ?? map.web
}

function statusBadge(status: string) {
  if (status === 'approved') return 'bg-green-900/40 text-green-300 border-green-800'
  if (status === 'rejected') return 'bg-red-900/40 text-red-300 border-red-800'
  return 'bg-zinc-800 text-zinc-400 border-zinc-700'
}

export function BrandDashboard({ slug }: { slug: string }) {
  const [data, setData] = useState<BrandData | null>(null)
  const [allDrafts, setAllDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [noDb, setNoDb] = useState(false)

  const label = BRAND_LABELS[slug] ?? { name: slug, tagline: '' }

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/brands/${slug}`)
      if (res.status === 503) {
        setNoDb(true)
        setLoading(false)
        return
      }
      if (!res.ok) throw new Error('not found')
      const json = await res.json()
      setData(json)

      const draftsRes = await fetch(`/api/drafts/brand/${slug}`)
      if (draftsRes.ok) {
        setAllDrafts(await draftsRes.json())
      }
    } catch {
      // brand not in db yet — show mock UI
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function runCycle() {
    setRunning(true)
    setStepIdx(0)

    const interval = setInterval(() => {
      setStepIdx((i) => (i < CYCLE_STEPS.length - 2 ? i + 1 : i))
    }, 1800)

    try {
      const res = await fetch('/api/run-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug: slug }),
      })
      clearInterval(interval)
      setStepIdx(CYCLE_STEPS.length - 1)

      if (res.status === 503) {
        toast.error('Firebase not configured — add FIREBASE_PROJECT_ID to .env.local')
        return
      }

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Cycle failed')
        return
      }

      toast.success(`Cycle complete — ${result.draftsCreated} drafts created`)
      await fetchData()
    } catch {
      clearInterval(interval)
      toast.error('Network error')
    } finally {
      setRunning(false)
      setTimeout(() => setStepIdx(0), 2000)
    }
  }

  async function updateDraftStatus(draftId: string, status: 'approved' | 'rejected') {
    const res = await fetch(`/api/drafts/${draftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      toast.error('Failed to update status')
      return
    }
    toast.success(status === 'approved' ? 'Approved — queued for publish' : 'Rejected')
    setSelectedDraft(null)
    await fetchData()
  }

  const snapshot = data?.snapshot
  const gapTopics: GapTopic[] = snapshot?.gap_topics
    ? (typeof snapshot.gap_topics === 'string'
        ? JSON.parse(snapshot.gap_topics)
        : snapshot.gap_topics)
    : []
  const competitorScores: Record<string, number> = snapshot?.competitor_scores
    ? (typeof snapshot.competitor_scores === 'string'
        ? JSON.parse(snapshot.competitor_scores)
        : snapshot.competitor_scores)
    : {}

  const displayScore = snapshot?.overall_score ?? 34

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {noDb && (
        <div className="mb-6 bg-amber-900/20 border border-amber-800 rounded-lg p-4 text-amber-300 text-sm">
          <strong>Firebase not configured.</strong> Add <code>FIREBASE_PROJECT_ID</code> to <code>.env.local</code> and run <code>gcloud auth application-default login</code> to enable live data. Showing demo UI.
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{label.name}</h1>
        <p className="text-zinc-500">{label.tagline}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT — Visibility intelligence */}
        <div className="space-y-6">
          {/* Score card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
              AI Visibility Score
            </div>
            <div className="flex items-end gap-3 mb-6">
              <span className="text-6xl font-bold text-white">{displayScore}</span>
              <span className="text-zinc-500 mb-2 text-sm">/ 100</span>
            </div>

            {/* Score bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">{label.name}</span>
                  <span className="text-white font-semibold">{displayScore}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${displayScore}%` }}
                  />
                </div>
              </div>
              {Object.entries(competitorScores).length > 0
                ? Object.entries(competitorScores).map(([name, score]) => (
                    <div key={name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-400">{name}</span>
                        <span className="text-zinc-300 font-semibold">{score}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-600 rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))
                : [
                    { name: 'Apple', score: 78 },
                    { name: 'Samsung', score: 71 },
                  ].map(({ name, score }) => (
                    <div key={name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-400">{name}</span>
                        <span className="text-zinc-300 font-semibold">{score}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-zinc-600 rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
            </div>

            {snapshot && (
              <p className="text-xs text-zinc-600 mt-4">
                Last scanned:{' '}
                {new Date(snapshot.created_at).toLocaleString()}
              </p>
            )}
          </div>

          {/* Gap table */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
              Visibility Gaps
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-4 text-xs text-zinc-600 uppercase tracking-wide pb-2 border-b border-zinc-800">
                <span className="col-span-2">Topic</span>
                <span className="text-center">You</span>
                <span className="text-center">Gap</span>
              </div>
              {(gapTopics.length > 0
                ? gapTopics
                : [
                    { topic: 'camera transparency', your_score: 24, competitor_score: 72, gap: 48, competitor: 'Apple' },
                    { topic: 'software updates',   your_score: 29, competitor_score: 68, gap: 39, competitor: 'Samsung' },
                    { topic: 'price-performance',  your_score: 34, competitor_score: 65, gap: 31, competitor: 'Apple' },
                  ]
              ).map((g) => (
                <div
                  key={g.topic}
                  className="grid grid-cols-4 py-2 text-sm border-b border-zinc-800/50 last:border-0"
                >
                  <div className="col-span-2">
                    <div className="text-zinc-200">{g.topic}</div>
                    <div className="text-xs text-zinc-600">vs {g.competitor}</div>
                  </div>
                  <div className="text-center text-zinc-300">{g.your_score}</div>
                  <div className={`text-center font-semibold ${gapColor(g.gap)}`}>
                    <span className="flex items-center justify-center gap-1">
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${gapBg(g.gap)}`}
                      />
                      -{g.gap}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Action queue */}
        <div className="space-y-6">
          {/* Run cycle */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
              Action Loop
            </div>
            <button
              onClick={runCycle}
              disabled={running}
              className="w-full bg-white text-black font-semibold py-3 px-4 rounded-lg hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {running ? '⏳ Running cycle...' : '▶ Run marktron Cycle'}
            </button>
            {running && (
              <div className="space-y-2">
                {CYCLE_STEPS.slice(0, -1).map((step, i) => (
                  <div key={step} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        i < stepIdx
                          ? 'bg-green-400'
                          : i === stepIdx
                          ? 'bg-blue-400 animate-pulse'
                          : 'bg-zinc-700'
                      }`}
                    />
                    <span className={i <= stepIdx ? 'text-zinc-200' : 'text-zinc-600'}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Draft queue */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">
              Content Drafts
              {allDrafts.length > 0 && (
                <span className="ml-2 text-zinc-400 normal-case">
                  ({allDrafts.filter((d) => d.status === 'pending').length} pending)
                </span>
              )}
            </div>

            {allDrafts.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">
                No drafts yet. Run a cycle to generate content.
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {allDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex gap-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${sourceTypeBadge(draft.content_type)}`}
                        >
                          {draft.content_type}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${statusBadge(draft.status)}`}
                        >
                          {draft.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-200 mb-1 line-clamp-1">
                      {draft.title}
                    </p>
                    <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
                      {draft.body.slice(0, 120)}...
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedDraft(draft)}
                        className="text-xs border border-zinc-700 text-zinc-400 px-3 py-1 rounded hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        Preview
                      </button>
                      {draft.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateDraftStatus(draft.id, 'approved')}
                            className="text-xs bg-green-900/40 border border-green-800 text-green-300 px-3 py-1 rounded hover:bg-green-900/60 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateDraftStatus(draft.id, 'rejected')}
                            className="text-xs bg-red-900/40 border border-red-800 text-red-300 px-3 py-1 rounded hover:bg-red-900/60 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDraft && (
        <DraftModal
          draft={selectedDraft}
          onClose={() => setSelectedDraft(null)}
          onApprove={() => updateDraftStatus(selectedDraft.id, 'approved')}
          onReject={() => updateDraftStatus(selectedDraft.id, 'rejected')}
        />
      )}
    </div>
  )
}
