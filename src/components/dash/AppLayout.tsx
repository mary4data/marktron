'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { BarChart2, Layers, CheckSquare, TrendingUp, Settings, Menu, Sun, Moon, ScanSearch, FileDown, Send, Bot } from 'lucide-react'
import { useTheme } from 'next-themes'

const NAV = [
  { href: '/dashboard/probe', label: 'GEO Probe', icon: ScanSearch },
  { href: '/dashboard/agent', label: 'Agent', icon: Bot },
  { href: '/dashboard/overview', label: 'Overview', icon: BarChart2 },
  { href: '/dashboard/gaps', label: 'Visibility Gaps', icon: Layers },
  { href: '/dashboard/queue', label: 'Content Queue', icon: CheckSquare },
  { href: '/dashboard/delta', label: 'Peec Delta', icon: TrendingUp },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

const PAGE_SUBTITLES: Record<string, string> = {
  '/dashboard/agent': 'Autonomous cycle — fetches gaps, searches sources, generates drafts',
  '/dashboard/probe': 'Simulate how ChatGPT and Gemini rank your brand',
  '/dashboard/overview': 'Where you stand vs Salesforce, HubSpot & Pipedrive',
  '/dashboard/gaps': 'Prompts where competitors are winning',
  '/dashboard/queue': 'Content drafted and awaiting approval',
  '/dashboard/delta': 'Did the content move the needle? Causation, not correlation.',
  '/dashboard/settings': 'Configure your brand, APIs, and agent behaviour',
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sending, setSending] = useState(false)
  const { theme, setTheme } = useTheme()

  const title = NAV.find((n) => n.href === pathname)?.label ?? 'marktron'
  const subtitle = PAGE_SUBTITLES[pathname] ?? ''

  async function downloadReport() {
    setDownloading(true)
    try {
      const res = await fetch('/api/report')
      if (!res.ok) throw new Error('Report generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `visibility-report-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setDownloading(false)
    }
  }

  async function sendReport() {
    const email = prompt('Send report to email:')
    if (!email) return
    setSending(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      toast.success(`Report sent to ${email}`)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSending(false)
    }
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/" className="flex items-baseline gap-0.5">
          <span className="font-black text-xl tracking-tighter text-zinc-900 dark:text-white">marktron</span>
          <span className="text-blue-500 text-lg font-black">_</span>
        </Link>
      </div>

      {/* Agent status */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">AGENT · ACTIVE</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-blue-500/10 text-blue-500 font-medium'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
          Attio · Peec AI · live data
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-56 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h1>
              {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={downloadReport}
              disabled={downloading}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              aria-label="Download report"
              title="Download PDF report"
            >
              <FileDown className="h-4 w-4" />
            </button>
            <button
              onClick={sendReport}
              disabled={sending}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              aria-label="Send report by email"
              title="Send PDF report by email"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
