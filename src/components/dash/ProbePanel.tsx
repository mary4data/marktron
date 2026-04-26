'use client'

import { useState } from 'react'

export type ProbeResult = {
  rankings: { name: string; description: string; vis: number; sent: number; pos: number }[]
  engineNote: string
}

const ENGINE_COLOR: Record<string, string> = {
  ChatGPT: '#10a37f',
  Gemini: '#4f8ef7',
}

interface ProbePanelProps {
  engine: string
  result: ProbeResult | null
  loading: boolean
  brand: string
}

export function ProbePanel({ engine, result, loading, brand }: ProbePanelProps) {
  const [openRow, setOpenRow] = useState<number | null>(null)
  const color = ENGINE_COLOR[engine] ?? '#6366f1'

  const isMatch = (name: string) =>
    name.toLowerCase().includes(brand.toLowerCase()) ||
    brand.toLowerCase().includes(name.toLowerCase())


  return (
    <div className="flex-1 min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            ► LIVE LLM PROBE · {engine}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${color}40`, borderTopColor: color }}
            />
          </div>
        )}

        {!loading && !result && (
          <p className="text-xs text-zinc-400 font-mono text-center py-8">
            Run probe to see results
          </p>
        )}

        {!loading && result && (
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-3">
              Ranked Mentions
            </p>
            {result.rankings.map((r, i) => {
              const match = isMatch(r.name)
              const isOpen = openRow === i
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenRow(isOpen ? null : i)}
                    className={`w-full text-left rounded-lg px-3 py-2 transition-colors flex items-center gap-3 ${
                      match
                        ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <span
                      className="text-[10px] font-mono font-bold w-4 flex-shrink-0"
                      style={{ color }}
                    >
                      #{i + 1}
                    </span>
                    <span className={`text-sm font-medium flex-1 truncate ${match ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {r.name}
                    </span>
                    {match && (
                      <span className="text-[9px] font-mono uppercase bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded flex-shrink-0">
                        YOUR BRAND
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-zinc-400 flex-shrink-0 flex gap-2">
                      <span>VIS <span className="text-zinc-600 dark:text-zinc-300">{r.vis}%</span></span>
                      <span>SENT <span className="text-zinc-600 dark:text-zinc-300">{r.sent}</span></span>
                      <span>POS <span className="text-zinc-600 dark:text-zinc-300">{r.pos.toFixed(1)}</span></span>
                    </span>
                    <span className="text-zinc-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {/* Description expand */}
                  <div
                    className="overflow-hidden transition-all duration-200"
                    style={{ maxHeight: isOpen ? '8rem' : '0' }}
                  >
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed px-3 pt-1.5 pb-2 font-mono">
                      {r.description}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Engine note */}
            <p className="text-[10px] text-zinc-400 font-mono pt-3 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 mt-2">
              {result.engineNote}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
