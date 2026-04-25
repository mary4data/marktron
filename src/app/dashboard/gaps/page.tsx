'use client'

import { useEffect, useState } from 'react'
import { PriorityBadge } from '@/components/dash/PriorityBadge'
import { toast } from 'sonner'

interface Gap {
  id: string
  prompt: string
  topic: string
  tags: string[]
  country: string
  volume: number
  competitor: string
  priority: string
}

export default function GapsPage() {
  const [gaps, setGaps] = useState<Gap[]>([])
  const [filtered, setFiltered] = useState<Gap[]>([])
  const [topicFilter, setTopicFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/attio/gaps')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else {
          setGaps(d.gaps)
          setFiltered(d.gaps)
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  const topics = ['All', ...Array.from(new Set(gaps.map((g) => g.topic)))]

  useEffect(() => {
    setFiltered(topicFilter === 'All' ? gaps : gaps.filter((g) => g.topic === topicFilter))
  }, [topicFilter, gaps])

  async function draftContent(gap: Gap) {
    toast.info(`Drafting content for: "${gap.prompt.slice(0, 40)}…"`)
    const res = await fetch('/api/run-cycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandSlug: 'attio' }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error ?? 'Failed')
    else toast.success(`${data.draftsCreated} draft(s) created → check Queue`)
  }

  if (error) return <div className="text-red-500 text-sm font-mono">{error}</div>

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest mr-2">Topic</span>
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setTopicFilter(t)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors ${
              topicFilter === t
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-500'
                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500'
            }`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-400 font-mono">{filtered.length} prompts · from Peec AI</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Prompt</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hidden md:table-cell">Topic</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hidden lg:table-cell">Country</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Volume</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hidden md:table-cell">Priority</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 text-sm animate-pulse">
                  Loading prompts from Peec AI…
                </td>
              </tr>
            )}
            {!loading && filtered.map((g) => (
              <tr key={g.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2">{g.prompt}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {g.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-mono">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono">{g.topic}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-zinc-500 font-mono">{g.country}</td>
                <td className="px-4 py-3 text-xs font-mono text-zinc-700 dark:text-zinc-300">{g.volume}x</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <PriorityBadge priority={g.priority} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => draftContent(g)}
                    className="text-xs border border-blue-500/40 text-blue-500 px-3 py-1 rounded hover:bg-blue-500/10 transition-colors font-mono"
                  >
                    Draft →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
