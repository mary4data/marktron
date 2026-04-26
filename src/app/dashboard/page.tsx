'use client'

import { useEffect, useState } from 'react'
import { StatCard } from '@/components/dash/StatCard'

interface OverviewData {
  ownBrand: { name: string; domains: string[] }
  competitors: { name: string; color: string }[]
  stats: {
    promptsTracked: number
    totalVolume: number
    competitorCount: number
    topicsCount: number
    draftsQueue: number
    overallScore: number | null
  }
  activity: { kind: string; text: string; topic: string | null; tags: string[]; time: string }[]
  positioning: { brand: string; rank: number; color: string; score: number | null; topGap: { topic: string; gap: number } | null }[]
}

const KIND_STYLE: Record<string, string> = {
  gap: 'text-amber-500',
  draft: 'text-blue-500',
  approval: 'text-emerald-500',
  delta: 'text-purple-500',
  info: 'text-zinc-400',
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/attio/overview')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-500 text-sm font-mono">{error}</div>
  if (!data) return <div className="text-zinc-400 text-sm animate-pulse">Loading Peec AI data…</div>

  const { ownBrand, stats, activity, positioning } = data

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Where You Stand</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Prompts Tracked" value={stats.promptsTracked} subtitle="from Peec AI" accent="primary" />
          <StatCard label="Competitors" value={stats.competitorCount} subtitle="tracked brands" accent="warning" />
          <StatCard label="Topics" value={stats.topicsCount} subtitle="active categories" accent="neutral" />
          <StatCard label="Drafts in Queue" value={stats.draftsQueue} subtitle="pending approval" accent="success" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Brand Landscape</h3>
          <div className="space-y-3">
            {/* Own brand row */}
            <div className="flex items-center justify-between py-2.5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">{ownBrand?.name}</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono uppercase">your brand</span>
              </div>
              <div className="flex items-center gap-4">
                {stats.overallScore !== null && (
                  <span className="text-xs font-mono font-semibold text-blue-500">{stats.overallScore}%</span>
                )}
                <span className="text-xs text-zinc-400 font-mono">{ownBrand?.domains?.[0]}</span>
              </div>
            </div>
            {/* Competitor rows */}
            {positioning.map((p) => (
              <div key={p.brand} className="py-2.5 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{p.brand}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {p.score !== null && (
                      <span className="text-xs font-mono font-semibold text-zinc-500">{p.score}%</span>
                    )}
                    <span className="text-[10px] font-mono text-zinc-400">competitor</span>
                  </div>
                </div>
                {p.topGap && (
                  <div className="ml-5 mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-amber-500 uppercase">gap</span>
                    <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[180px]">{p.topGap.topic}</span>
                    <span className="text-[10px] font-mono text-amber-500 ml-auto">+{p.topGap.gap}pt</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-4">Live Gap Feed</h3>
          <div className="space-y-3">
            {activity.length === 0 && (
              <p className="text-zinc-400 text-sm">No activity yet. Run a cycle to start.</p>
            )}
            {activity.map((a, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className={`flex-shrink-0 font-mono text-[10px] uppercase pt-0.5 ${KIND_STYLE[a.kind] ?? KIND_STYLE.info}`}>
                  {a.kind}
                </span>
                <div>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-snug">{a.text}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {a.topic && (
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono">{a.topic}</span>
                    )}
                    {a.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
