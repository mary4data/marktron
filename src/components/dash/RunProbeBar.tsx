'use client'

import { useState } from 'react'
import type { ProbeResult } from './ProbePanel'

interface RunProbeBarProps {
  onResults: (results: Record<string, ProbeResult>) => void
  onBrandChange: (brand: string) => void
  loading: boolean
  setLoading: (b: boolean) => void
}

export function RunProbeBar({ onResults, onBrandChange, loading, setLoading }: RunProbeBarProps) {
  const [brand, setBrand] = useState('Attio')
  const [prompt, setPrompt] = useState('Best CRM for early-stage startups in 2026?')
  const [error, setError] = useState<string | null>(null)

  function handleBrandChange(val: string) {
    setBrand(val)
    onBrandChange(val)
  }

  async function runProbe() {
    setError(null)
    setLoading(true)
    const engines = ['ChatGPT', 'Gemini'] as const

    try {
      const responses = await Promise.all(
        engines.map((engine) =>
          fetch('/api/probe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand, prompt, engine }),
          }).then((r) => r.json())
        )
      )
      const results: Record<string, ProbeResult> = {}
      engines.forEach((engine, i) => {
        if (responses[i].error) throw new Error(`${engine}: ${responses[i].error}`)
        results[engine] = responses[i]
      })
      onResults(results)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-36">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
            Your Brand
          </label>
          <input
            value={brand}
            onChange={(e) => handleBrandChange(e.target.value)}
            disabled={loading}
            placeholder="Attio"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
          />
        </div>
        <div className="flex-[3] min-w-60">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5">
            Prompt to Probe
          </label>
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            placeholder="Best CRM for early-stage startups in 2026?"
            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
          />
        </div>
        <button
          onClick={runProbe}
          disabled={loading || !brand.trim() || !prompt.trim()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors h-[38px] flex-shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Running…
            </span>
          ) : (
            '✦ Run probe'
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 font-mono mt-3">{error}</p>
      )}

    </div>
  )
}
