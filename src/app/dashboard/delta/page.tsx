'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ChannelBadge } from '@/components/dash/ChannelBadge'

interface ChartPoint { date: string; attio: number; competitor: number }
interface DraftResult {
  id: string
  title: string
  content_type: string
  approved_at?: string
  status: string
}

interface DeltaData {
  chartData: ChartPoint[]
  drafts: DraftResult[]
  topCompetitor: string
}

export default function DeltaPage() {
  const [data, setData] = useState<DeltaData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/attio/delta')
      .then((r) => r.json())
      .then((d) => d.error ? setError(d.error) : setData(d))
      .catch((e) => setError(String(e)))
  }, [])

  if (error) return <div className="text-red-500 text-sm font-mono">{error}</div>
  if (!data) return <div className="text-zinc-400 text-sm animate-pulse">Loading delta data…</div>

  const { chartData, drafts, topCompetitor } = data

  return (
    <div className="space-y-8">
      {/* Chart */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Mention Count · All Cycles</p>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">Your brand vs top competitor</h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Attio</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-zinc-400 inline-block" /> {topCompetitor}</span>
          </div>
        </div>

        {chartData.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">
            <div className="text-center">
              <p>Not enough data points yet.</p>
              <p className="text-xs mt-1 text-zinc-400">Run at least 2 cycles to see the trend line.</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-background, #fff)', border: '1px solid #e4e4e7', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#71717a' }}
              />
              <Line type="monotone" dataKey="attio" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} name="Attio" />
              <Line type="monotone" dataKey="competitor" stroke="#a1a1aa" strokeWidth={2} strokeDasharray="4 2" dot={false} name={topCompetitor} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Approved content results */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Approved Content</p>
        </div>
        {drafts.length === 0 ? (
          <div className="px-6 py-10 text-center text-zinc-400 text-sm">
            No approved content yet. Approve drafts in the Queue to track impact.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                <th className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Content</th>
                <th className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hidden md:table-cell">Channel</th>
                <th className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hidden lg:table-cell">Approved</th>
                <th className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d) => (
                <tr key={d.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                  <td className="px-6 py-3 text-zinc-800 dark:text-zinc-200 max-w-xs">
                    <p className="line-clamp-1">{d.title}</p>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <ChannelBadge channel={d.content_type} />
                  </td>
                  <td className="px-6 py-3 hidden lg:table-cell text-xs text-zinc-500 font-mono">
                    {d.approved_at ? new Date(d.approved_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800">
                      approved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
