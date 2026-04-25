'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface ApiStatus { key: string; label: string; status: 'untested' | 'ok' | 'error'; hint: string }

const INITIAL: ApiStatus[] = [
  { key: 'peec', label: 'Peec AI', status: 'untested', hint: 'Visibility & prompt data' },
  { key: 'gemini', label: 'Google Gemini', status: 'untested', hint: 'Content generation' },
  { key: 'tavily', label: 'Tavily', status: 'untested', hint: 'Competitor source discovery' },
  { key: 'firestore', label: 'Firestore', status: 'untested', hint: 'Draft storage (via ADC)' },
]

export default function SettingsPage() {
  const [apis, setApis] = useState<ApiStatus[]>(INITIAL)
  const [testing, setTesting] = useState<string | null>(null)

  async function testAll() {
    setTesting('all')
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setApis((prev) =>
        prev.map((a) => ({
          ...a,
          status: data[a.key] === 'ok' ? 'ok' : 'error',
        }))
      )
      toast.success('Health check complete')
    } catch {
      toast.error('Health check failed')
    } finally {
      setTesting(null)
    }
  }

  const statusDot = (s: ApiStatus['status']) => {
    if (s === 'ok') return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
    if (s === 'error') return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
    return <span className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 inline-block" />
  }

  const statusLabel = (s: ApiStatus['status']) => {
    if (s === 'ok') return <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">connected</span>
    if (s === 'error') return <span className="text-[10px] font-mono text-red-600 dark:text-red-400">error</span>
    return <span className="text-[10px] font-mono text-zinc-400">not tested</span>
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Brand */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Brand</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1">Workspace</label>
            <input
              readOnly
              value="Attio"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-mono focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1">Primary domain</label>
            <input
              readOnly
              value="attio.com"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-mono focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-1">Competitors tracked</label>
            <div className="flex gap-2 flex-wrap">
              {['Salesforce', 'HubSpot'].map((c) => (
                <span key={c} className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2.5 py-1 rounded font-mono border border-zinc-200 dark:border-zinc-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* API Integrations */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500">API Integrations</h2>
          <button
            onClick={testAll}
            disabled={testing === 'all'}
            className="text-xs border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 px-3 py-1.5 rounded hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors font-mono disabled:opacity-50"
          >
            {testing === 'all' ? 'Testing…' : 'Test all'}
          </button>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {apis.map((a) => (
            <div key={a.key} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusDot(a.status)}
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{a.label}</p>
                  <p className="text-xs text-zinc-400 font-mono">{a.hint}</p>
                </div>
              </div>
              {statusLabel(a.status)}
            </div>
          ))}
        </div>
      </div>

      {/* Agent behavior */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Agent Behavior</h2>
        <div className="space-y-3">
          {[
            { label: 'Require approval before publishing', value: true },
            { label: 'Auto-run cycle on new Peec data', value: false },
            { label: 'Slack notifications', value: false },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
              <div className={`w-8 h-4 rounded-full relative cursor-not-allowed ${value ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${value ? 'left-4' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-mono text-zinc-400">Toggle configuration coming soon. Edit .env.local for now.</p>
      </div>
    </div>
  )
}
