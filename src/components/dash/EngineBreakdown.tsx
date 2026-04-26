import type { ProbeResult } from './ProbePanel'

const ENGINE_COLOR: Record<string, string> = {
  ChatGPT: '#10a37f',
  Gemini: '#4f8ef7',
}

interface EngineBreakdownProps {
  results: Record<string, ProbeResult>
  brand: string
}

export function EngineBreakdown({ results, brand }: EngineBreakdownProps) {
  const engines = Object.keys(results)
  if (engines.length === 0) return null

  function findBrandRank(rankings: ProbeResult['rankings']) {
    const idx = rankings.findIndex(
      (r) =>
        r.name.toLowerCase().includes(brand.toLowerCase()) ||
        brand.toLowerCase().includes(r.name.toLowerCase())
    )
    return idx === -1 ? null : idx + 1
  }

  return (
    <div className="flex flex-wrap gap-4">
      {(['ChatGPT', 'Gemini'] as const).map((engine) => {
        const result = results[engine]
        if (!result) return null
        const color = ENGINE_COLOR[engine]
        const rank = findBrandRank(result.rankings)
        const brandEntry = result.rankings.find(
          (r) =>
            r.name.toLowerCase().includes(brand.toLowerCase()) ||
            brand.toLowerCase().includes(r.name.toLowerCase())
        )

        return (
          <div
            key={engine}
            className="flex-1 min-w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 border-l-4"
            style={{ borderLeftColor: color }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                {engine}
              </span>
              {rank !== null && (
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  Your Brand · #{rank}
                </span>
              )}
            </div>

            {brandEntry ? (
              <div className="flex gap-4 text-[11px] font-mono mb-3">
                <div>
                  <span className="text-zinc-400">VIS</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold ml-1">{brandEntry.vis}%</span>
                </div>
                <div>
                  <span className="text-zinc-400">SENT</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold ml-1">{brandEntry.sent}</span>
                </div>
                <div>
                  <span className="text-zinc-400">POS</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold ml-1">{brandEntry.pos.toFixed(1)}</span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] font-mono text-zinc-400 mb-3">Brand not ranked</p>
            )}

            <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">{result.engineNote}</p>
          </div>
        )
      })}
    </div>
  )
}
