'use client'

import { useEffect, useRef, useState } from 'react'

type AgentEvent =
  | { type: 'thinking'; text: string }
  | { type: 'tool_call'; tool: string; input: unknown; id: string }
  | { type: 'tool_result'; tool: string; result: unknown; id: string }
  | { type: 'tool_error'; tool: string; error: string; id: string }
  | { type: 'done' }
  | { type: 'error'; error: string }

const TOOL_META: Record<string, { label: string; classes: string; dot: string }> = {
  get_visibility:  { label: 'get_visibility',  classes: 'text-blue-500 bg-blue-500/10 border-blue-500/30',    dot: 'bg-blue-500' },
  get_gaps:        { label: 'get_gaps',         classes: 'text-amber-500 bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-500' },
  save_snapshot:   { label: 'save_snapshot',    classes: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',   dot: 'bg-zinc-400' },
  search_sources:  { label: 'search_sources',   classes: 'text-violet-500 bg-violet-500/10 border-violet-500/30', dot: 'bg-violet-500' },
  generate_draft:  { label: 'generate_draft',   classes: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-500' },
  save_draft:      { label: 'save_draft',       classes: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',   dot: 'bg-zinc-400' },
}

function JsonPreview({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false)
  const str = JSON.stringify(value, null, 2)
  const preview = JSON.stringify(value)
  const short = preview.length > 80 ? preview.slice(0, 80) + '…' : preview
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors text-left"
      >
        {open ? str : short}
      </button>
    </div>
  )
}

function ToolCallRow({ event, result }: { event: Extract<AgentEvent, { type: 'tool_call' }>; result?: Extract<AgentEvent, { type: 'tool_result' | 'tool_error' }> }) {
  const meta = TOOL_META[event.tool] ?? { label: event.tool, classes: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30', dot: 'bg-zinc-400' }
  const isError = result?.type === 'tool_error'

  return (
    <div className="flex gap-3 py-2.5 border-b border-zinc-800/60 last:border-0">
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-0.5 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
        {result && <div className="w-px flex-1 bg-zinc-800 mt-1" />}
      </div>

      <div className="flex-1 min-w-0">
        {/* Tool name badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${meta.classes}`}>
            {meta.label}
          </span>
          {!result && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping inline-block" />
              running
            </span>
          )}
        </div>

        {/* Input */}
        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-0.5">input</div>
        <JsonPreview value={event.input} />

        {/* Result */}
        {result && (
          <>
            <div className={`text-[10px] font-mono uppercase tracking-wider mt-2 mb-0.5 ${isError ? 'text-red-400' : 'text-zinc-500'}`}>
              {isError ? 'error' : 'result'}
            </div>
            {isError
              ? <p className="text-[11px] font-mono text-red-400">{(result as Extract<AgentEvent, {type:'tool_error'}>).error}</p>
              : <JsonPreview value={(result as Extract<AgentEvent, {type:'tool_result'}>).result} />
            }
          </>
        )}
      </div>
    </div>
  )
}

export default function AgentPage() {
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  async function startAgent() {
    setEvents([])
    setStatus('running')

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandSlug: 'attio' }),
      })

      if (!res.ok || !res.body) {
        setStatus('error')
        setEvents([{ type: 'error', error: `HTTP ${res.status}` }])
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event: AgentEvent = JSON.parse(line.slice(6))
            setEvents((prev) => [...prev, event])
            if (event.type === 'done') setStatus('done')
            if (event.type === 'error') setStatus('error')
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      setEvents((prev) => [...prev, { type: 'error', error: String(err) }])
      setStatus('error')
    }
  }

  // Group tool_call events with their matching result
  const toolResultMap = new Map<string, Extract<AgentEvent, { type: 'tool_result' | 'tool_error' }>>()
  for (const e of events) {
    if (e.type === 'tool_result' || e.type === 'tool_error') {
      toolResultMap.set(e.id, e)
    }
  }

  const renderedIds = new Set<string>()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">Autonomous Agent</p>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">marktron cycle</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Fetches visibility · identifies gaps · searches sources · generates drafts
            </p>
          </div>
          <div className="flex items-center gap-3">
            {status === 'running' && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-blue-500">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                running
              </span>
            )}
            {status === 'done' && (
              <span className="text-xs font-mono text-emerald-500">✓ done</span>
            )}
            {status === 'error' && (
              <span className="text-xs font-mono text-red-400">✗ error</span>
            )}
            <button
              onClick={startAgent}
              disabled={status === 'running'}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {status === 'running' ? '⏳ Running…' : status === 'done' ? '↺ Run again' : '▶ Start agent'}
            </button>
          </div>
        </div>

        {/* Tool legend */}
        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {Object.entries(TOOL_META).map(([key, meta]) => (
            <span key={key} className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
              {key}
            </span>
          ))}
        </div>
      </div>

      {/* Feed */}
      {events.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="px-6 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Agent feed</p>
            <span className="text-[10px] font-mono text-zinc-400">{events.filter(e => e.type === 'tool_call').length} tool calls</span>
          </div>

          <div className="px-6 py-4 space-y-1 max-h-[60vh] overflow-y-auto">
            {events.map((event, i) => {
              if (event.type === 'thinking') {
                return (
                  <div key={i} className="py-2.5 border-b border-zinc-800/60 last:border-0">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-zinc-600 flex-shrink-0 mt-1" />
                      <p className="text-sm text-zinc-400 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{event.text}</p>
                    </div>
                  </div>
                )
              }

              if (event.type === 'tool_call') {
                if (renderedIds.has(event.id)) return null
                renderedIds.add(event.id)
                const result = toolResultMap.get(event.id)
                return <ToolCallRow key={event.id} event={event} result={result} />
              }

              if (event.type === 'tool_result' || event.type === 'tool_error') return null

              if (event.type === 'done') {
                return (
                  <div key={i} className="py-3 flex items-center gap-2 text-xs font-mono text-emerald-500">
                    <span>✓</span> Agent cycle complete
                  </div>
                )
              }

              if (event.type === 'error') {
                return (
                  <div key={i} className="py-3 text-xs font-mono text-red-400">
                    ✗ {event.error}
                  </div>
                )
              }

              return null
            })}
            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {status === 'idle' && (
        <div className="text-center py-12 text-zinc-400 text-sm">
          Click <span className="font-mono text-blue-500">▶ Start agent</span> to run a full visibility cycle.
        </div>
      )}
    </div>
  )
}
