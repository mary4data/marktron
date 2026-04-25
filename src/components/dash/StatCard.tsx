interface StatCardProps {
  label: string
  value: React.ReactNode
  subtitle?: string
  accent?: 'primary' | 'success' | 'warning' | 'neutral'
}

export function StatCard({ label, value, subtitle, accent = 'primary' }: StatCardProps) {
  const border = {
    primary: 'border-t-blue-500',
    success: 'border-t-emerald-500',
    warning: 'border-t-amber-500',
    neutral: 'border-t-zinc-400 dark:border-t-zinc-600',
  }[accent]

  return (
    <div className={`border border-zinc-200 dark:border-zinc-800 border-t-2 ${border} rounded-lg p-4 bg-white dark:bg-zinc-900`}>
      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="text-3xl font-bold mt-2 text-zinc-900 dark:text-white">{value}</p>
      {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  )
}
