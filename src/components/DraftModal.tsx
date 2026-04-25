'use client'

interface Draft {
  id: string
  content_type: string
  title: string
  body: string
  target_url: string
  status: string
  created_at: string
}

interface DraftModalProps {
  draft: Draft
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}

export function DraftModal({ draft, onClose, onApprove, onReject }: DraftModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
          <div>
            <div className="flex gap-2 mb-2">
              <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded">
                {draft.content_type}
              </span>
              <span className="text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded">
                {draft.status}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">{draft.title}</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Generated {new Date(draft.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 ml-4 flex-shrink-0 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="bg-zinc-950 rounded-lg p-4 mb-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed font-mono">
            {draft.body}
          </div>

          {draft.target_url && draft.target_url !== '#' && (
            <div className="mb-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Target URL</p>
              <a
                href={draft.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 break-all"
              >
                {draft.target_url}
              </a>
            </div>
          )}

          {draft.status === 'pending' && (
            <div className="flex gap-3">
              <button
                onClick={onApprove}
                className="flex-1 bg-green-900/40 border border-green-700 text-green-300 font-semibold py-2.5 rounded-lg hover:bg-green-900/60 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={onReject}
                className="flex-1 bg-red-900/40 border border-red-700 text-red-300 font-semibold py-2.5 rounded-lg hover:bg-red-900/60 transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
