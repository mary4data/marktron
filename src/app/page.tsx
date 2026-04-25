'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Live demo', href: '#demo' },
  { label: 'Why not SEO', href: '#why-not-seo' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

function Navbar() {
  const { theme, setTheme } = useTheme()
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Live demo
          </Link>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Open dashboard →
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function Home() {
  return (
    <div className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-950">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-mono tracking-widest text-blue-500 uppercase mb-6 flex items-center justify-center gap-2">
            <span>▶</span> MARKTRON · V0.1
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6">
            Your AI marketer.<br />
            <span className="text-blue-600">Runs on Peec data.</span> Works<br />
            while you sleep.
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Marktron reads your Peec AI data, finds where ChatGPT and Perplexity ignore
            you, drafts the content that fixes it, and measures the delta. Closes the loop.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              Try the demo →
            </Link>
            <a
              href="#pricing"
              className="border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold px-8 py-3.5 rounded-xl text-base hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
            >
              See pricing
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-16">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📡', title: 'Peec reads the gap', body: 'Pulls your AI visibility score vs competitors across ChatGPT, Gemini, Claude, Perplexity.' },
              { step: '02', icon: '🎯', title: 'Tavily finds the battlefield', body: 'Locates the exact Reddit threads, G2 pages, and blogs where competitors are winning.' },
              { step: '03', icon: '✍️', title: 'Gemini drafts. You approve.', body: 'Generates targeted content, routes it for one-click human approval before anything publishes.' },
            ].map(({ step, icon, title, body }) => (
              <div key={step} className="relative pl-6 border-l-2 border-blue-500/30">
                <span className="text-[10px] font-mono text-blue-500 uppercase tracking-widest">{step}</span>
                <div className="text-2xl mt-2 mb-3">{icon}</div>
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not SEO */}
      <section id="why-not-seo" className="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-6">Why not SEO?</h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
            Ranking on Google takes 18 months. Ranking in ChatGPT takes three good Reddit threads.
            But finding those threads, writing the right response, getting it approved, and measuring
            whether it worked — that's a full-time marketer's job. Early-stage founders don't have that.{' '}
            <span className="text-zinc-900 dark:text-white font-semibold">marktron does.</span>
          </p>
          <div className="grid grid-cols-3 gap-6 text-left">
            {[
              { label: 'Traditional SEO', value: '18 months', sub: 'to rank on Google', bad: true },
              { label: 'GEO with marktron', value: '90 seconds', sub: 'per full cycle', bad: false },
              { label: 'Content approved', value: '1 click', sub: 'human in the loop', bad: false },
            ].map(({ label, value, sub, bad }) => (
              <div key={label} className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
                <p className={`text-2xl font-black ${bad ? 'text-red-500' : 'text-blue-600'}`}>{value}</p>
                <p className="text-xs text-zinc-500 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live demo */}
      <section id="demo" className="py-24 px-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">See it live</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Real Peec AI data. Real Attio brand. Real gaps.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-colors"
          >
            Open the dashboard →
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { tier: 'Free', price: '€0', features: ['1 brand', '3 cycles/month', 'All integrations'] },
              { tier: 'Pro', price: '€49/mo', features: ['5 brands', 'Unlimited cycles', 'Slack notifications'], highlight: true },
              { tier: 'Agency', price: '€199/mo', features: ['20 brands', 'White-label', 'API access'] },
            ].map(({ tier, price, features, highlight }) => (
              <div
                key={tier}
                className={`rounded-2xl p-6 border ${
                  highlight
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className={`text-sm mb-1 ${highlight ? 'text-blue-100' : 'text-zinc-500'}`}>{tier}</div>
                <div className={`text-4xl font-black mb-6 ${highlight ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>{price}</div>
                <ul className="space-y-2">
                  {features.map((f) => (
                    <li key={f} className={`text-sm flex items-center gap-2 ${highlight ? 'text-blue-50' : 'text-zinc-500'}`}>
                      <span className={highlight ? 'text-white' : 'text-blue-500'}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">FAQ</h2>
          <div className="space-y-8">
            {[
              { q: "Isn't this just an SEO tool?", a: "No. Traditional SEO targets Google's crawler. marktron targets the training and retrieval patterns of LLMs. Different channels, different content strategy, different measurement via Peec AI." },
              { q: 'Why do I need Peec AI?', a: "Without Peec, you're guessing whether your content improved your AI visibility. Peec closes the measurement loop. marktron closes the action loop. Together they're causal." },
              { q: 'Does it auto-publish?', a: 'No. Every piece of content goes through human approval before anything is posted. Agents draft. Humans decide.' },
              { q: 'How long does a cycle take?', a: 'Under 90 seconds. Peec pull → Tavily scan → Gemini draft → task created.' },
              { q: 'Is the code open source?', a: 'Yes, MIT license.' },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-zinc-100 dark:border-zinc-800 pb-8">
                <h3 className="font-bold text-zinc-900 dark:text-white mb-2">{q}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-8 px-6 text-center text-zinc-400 text-sm">
        marktron · MIT license · Built at Big Berlin Hack April 2026
      </footer>
    </div>
  )
}
