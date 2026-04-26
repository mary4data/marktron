'use client'

import { useState } from 'react'
import { RunProbeBar } from '@/components/dash/RunProbeBar'
import { EngineBreakdown } from '@/components/dash/EngineBreakdown'
import { ProbePanel } from '@/components/dash/ProbePanel'
import type { ProbeResult } from '@/components/dash/ProbePanel'

export default function ProbePage() {
  const [probeResults, setProbeResults] = useState<Record<string, ProbeResult>>({})
  const [probeLoading, setProbeLoading] = useState(false)
  const [probeBrand, setProbeBrand] = useState('Attio')

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <RunProbeBar
          onResults={setProbeResults}
          onBrandChange={setProbeBrand}
          loading={probeLoading}
          setLoading={setProbeLoading}
        />
      </div>

      <EngineBreakdown results={probeResults} brand={probeBrand} />

      <div className="flex gap-4 flex-wrap">
        {(['ChatGPT', 'Gemini'] as const).map((engine) => (
          <ProbePanel
            key={engine}
            engine={engine}
            result={probeResults[engine] ?? null}
            loading={probeLoading}
            brand={probeBrand}
          />
        ))}
      </div>
    </div>
  )
}
