'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { ChannelBadge } from '@/components/dash/ChannelBadge'

interface BrandLine { name: string; color: string; isOwn: boolean }
interface DraftResult {
  id: string
  title: string
  content_type: string
  approved_at?: string
  status: string
}
interface DeltaData {
  chartData: Record<string, string | number | null | boolean>[]
  drafts: DraftResult[]
  brandLines: BrandLine[]
  forecastStart: string | null
  approvedCount: number
  contentBoostTotal: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const isProjected = payload[0]?.payload?.projected === true
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-xs shadow-lg">
      <p className="text-zinc-500 font-mono mb-1.5 flex items-center gap-1.5">
        {label}
        {isProjected && (
          <span className="bg-violet-500/10 text-violet-400 border border-violet-500/30 px-1.5 py-0.5 rounded font-mono uppercase text-[10px]">
            projected
          </span>
        )}
      </p>
      {(() => {
        const seen = new Set<string>()
        return payload.map((entry: { name: string; value: number | null; color: string }) => {
          if (entry.value === null || entry.value === undefined) return null
          const displayName = entry.name.endsWith('_f') ? entry.name.slice(0, -2) : entry.name
          if (seen.has(displayName)) return null
          seen.add(displayName)
          return (
            <p key={entry.name} className="font-mono" style={{ color: entry.color }}>
              {displayName}: {entry.value}
            </p>
          )
        })
      })()}
    </div>
  )
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

  const { chartData, drafts, brandLines, forecastStart, approvedCount, contentBoostTotal } = data

  return (
    <div className="space-y-8">
      {/* Chart */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-start justify-between mb-2 gap-4 flex-wrap">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Visibility Score · Per Day (averaged)</p>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
              {brandLines.find((b) => b.isOwn)?.name ?? 'Your brand'} vs all competitors
            </h2>
          </div>

          {/* Brand legend (colours) */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 justify-end">
            {brandLines.map((b) => (
              <span key={b.name} className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                <span className="inline-block w-3 h-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                {b.name}
              </span>
            ))}
          </div>
        </div>

        {/* Historical / Forecast legend row */}
        <div className="flex items-center gap-6 mb-5">
          <span className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span className="inline-block w-6 h-0.5 bg-zinc-400" />
            Historical
          </span>
          <span className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span
              className="inline-block w-6 h-0.5"
              style={{ borderTop: '2px dashed #a1a1aa' }}
            />
            Forecasted
          </span>
          {approvedCount > 0 && contentBoostTotal > 0 && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-md ml-auto">
              ↑ +{contentBoostTotal}pt from {approvedCount} approved draft{approvedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {chartData.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">
            <div className="text-center">
              <p>Not enough data points yet.</p>
              <p className="text-xs mt-1 text-zinc-400">Run cycles on at least 2 different days to see a trend.</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Vertical separator at forecast boundary */}
              {forecastStart && (
                <ReferenceLine
                  x={forecastStart}
                  stroke="#71717a"
                  strokeDasharray="4 3"
                  strokeWidth={1}
                  label={{
                    value: 'Forecast →',
                    position: 'insideTopRight',
                    fontSize: 11,
                    fill: '#71717a',
                    fontFamily: 'monospace',
                    dy: 4,
                    dx: 6,
                  }}
                />
              )}

              {/* Historical lines — solid for every brand */}
              {brandLines.map((b) => (
                <Line
                  key={`actual-${b.name}`}
                  type="monotone"
                  dataKey={b.name}
                  stroke={b.color}
                  strokeWidth={1.75}
                  dot={false}
                  connectNulls={false}
                  name={b.name}
                />
              ))}

              {/* Forecast lines — dashed for every brand */}
              {brandLines.map((b) => (
                <Line
                  key={`forecast-${b.name}`}
                  type="monotone"
                  dataKey={`${b.name}_f`}
                  stroke={b.color}
                  strokeWidth={1.75}
                  strokeDasharray="6 3"
                  dot={false}
                  connectNulls={false}
                  name={`${b.name}_f`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Approved content */}
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
