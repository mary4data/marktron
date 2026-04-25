'use client'

import { useEffect, useState } from 'react'
import { ChannelBadge } from '@/components/dash/ChannelBadge'
import { toast } from 'sonner'

interface Draft {
  id: string
  title: string
  body: string
  content_type: string
  target_url: string
  status: string
  created_at: string
  approved_at?: string
}

interface QueueData {
  pending: Draft[]
  approved: Draft[]
  rejected: Draft[]
}

function DraftCard({ draft, onAction }: { draft: Draft; onAction: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChannelBadge channel={draft.content_type} />
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">{draft.title}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex-shrink-0 font-mono"
        >
          {expanded ? 'collapse' : 'expand'}
        </button>
      </div>

      {expanded && (
        <pre className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-mono bg-zinc-50 dark:bg-zinc-950 rounded p-3 leading-relaxed max-h-48 overflow-y-auto">
          {draft.body}
        </pre>
      )}

      {!expanded && (
        <p className="text-xs text-zinc-500 line-clamp-2">{draft.body.slice(0, 120)}…</p>
      )}

      {draft.target_url && draft.target_url !== '#' && (
        <a href={draft.target_url} target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-blue-500 font-mono truncate block hover:underline">
          {draft.target_url}
        </a>
      )}

      {draft.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAction(draft.id, 'approved')}
            className="flex-1 text-xs bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 py-1.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors font-mono"
          >
            Approve
          </button>
          <button
            onClick={() => onAction(draft.id, 'rejected')}
            className="flex-1 text-xs bg-red-50 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 py-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors font-mono"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueData>({ pending: [], approved: [], rejected: [] })
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(true)

  async function loadQueue() {
    const res = await fetch('/api/attio/queue')
    const data = await res.json()
    setQueue(data)
    setLoading(false)
  }

  useEffect(() => { loadQueue() }, [])

  async function handleAction(id: string, status: string) {
    const res = await fetch(`/api/drafts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error('Failed to update'); return }
    toast.success(status === 'approved' ? 'Approved — queued for publish' : 'Rejected')
    loadQueue()
  }

  const TABS = [
    { key: 'pending', label: 'Pending', count: queue.pending.length },
    { key: 'approved', label: 'Scheduled', count: queue.approved.length },
    { key: 'rejected', label: 'Rejected', count: queue.rejected.length },
  ] as const

  const items = queue[tab]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-mono transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              tab === key ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {loading && <p className="text-zinc-400 text-sm animate-pulse">Loading drafts…</p>}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-sm">No {tab} drafts.</p>
          {tab === 'pending' && (
            <p className="text-xs mt-2">Run a cycle from Visibility Gaps or click "Run agent now" above.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((d) => (
          <DraftCard key={d.id} draft={d} onAction={handleAction} />
        ))}
      </div>
    </div>
  )
}
