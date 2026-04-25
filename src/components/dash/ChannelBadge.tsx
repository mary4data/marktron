const STYLES: Record<string, string> = {
  reddit: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  linkedin: 'bg-blue-600/20 text-blue-500 border-blue-600/30',
  blog: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  g2: 'bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30',
  hackernews: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  twitter: 'bg-sky-500/20 text-sky-500 border-sky-500/30',
}

export function ChannelBadge({ channel }: { channel: string }) {
  const style = STYLES[channel.toLowerCase()] ?? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style}`}>
      {channel}
    </span>
  )
}
