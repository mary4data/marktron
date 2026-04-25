const STYLES: Record<string, string> = {
  low: 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400',
  medium: 'border-amber-600/50 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  high: 'border-orange-600/50 bg-orange-500/10 text-orange-600 dark:text-orange-400',
  critical: 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400',
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STYLES[priority] ?? STYLES.low}`}>
      {priority}
    </span>
  )
}
