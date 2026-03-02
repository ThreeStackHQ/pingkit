import Link from 'next/link'
import { Activity, Check, X, Globe, Zap, Bell, BarChart2, Shield, GitBranch, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'PingKit — URL Uptime Monitoring for Indie SaaS',
  description:
    'HTTP uptime monitoring every 60s. Slack, email & Discord alerts. Response time graphs. BetterUptime costs $79/mo — PingKit is $9.',
}

const features = [
  {
    icon: Zap,
    title: 'HTTP Checks Every 60s',
    desc: 'Know within 60 seconds when your site goes down. No more finding out from your users.',
  },
  {
    icon: Bell,
    title: 'Slack, Discord & Email',
    desc: 'Get notified where you already work. Set up alerts in seconds, no config hell.',
  },
  {
    icon: BarChart2,
    title: '90-Day Response History',
    desc: 'Track response time trends. Identify slowdowns before they become outages.',
  },
  {
    icon: Shield,
    title: 'SSL Monitoring',
    desc: 'Get notified 30 days before your SSL cert expires. Never get caught off guard.',
  },
  {
    icon: GitBranch,
    title: 'Incident Management',
    desc: 'Automatic incident creation and resolution tracking. Full audit trail included.',
  },
  {
    icon: Globe,
    title: 'StatusHub Integration',
    desc: (
      <>
        Publish a beautiful status page at{' '}
        <a href="https://statushub.threestack.io" className="text-emerald-400 hover:underline" target="_blank" rel="noreferrer">
          statushub.threestack.io
        </a>{' '}
        — free with PingKit.
      </>
    ),
  },
]

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['3 monitors', '5-minute checks', 'Email alerts', '7-day history'],
    cta: 'Start Free',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '$9',
    period: '/mo',
    features: ['20 monitors', '60s checks', 'Slack + Discord', '90-day history', 'SSL monitoring'],
    cta: 'Start Monitoring',
    href: '/login',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    features: ['Unlimited monitors', '30s checks', 'All alert channels', 'PagerDuty', 'SSL + incidents API'],
    cta: 'Go Pro',
    href: '/login',
    highlight: false,
  },
]

const comparison = [
  { feature: 'Starting price', pingkit: '$9/mo', betteruptime: '$79/mo', uptimerobot: '$7/mo (limited)' },
  { feature: 'Check interval', pingkit: '60s', betteruptime: '30s', uptimerobot: '5min (free)' },
  { feature: 'Monitors on entry plan', pingkit: '20', betteruptime: '10', uptimerobot: '50 (limited)' },
  { feature: 'Slack alerts', pingkit: '✓', betteruptime: '✓', uptimerobot: '✗' },
  { feature: 'Discord alerts', pingkit: '✓', betteruptime: '✗', uptimerobot: '✗' },
  { feature: 'Response time history', pingkit: '90 days', betteruptime: '60 days', uptimerobot: '1 day' },
  { feature: 'SSL monitoring', pingkit: '✓', betteruptime: '✓', uptimerobot: '✗' },
  { feature: 'Status page', pingkit: 'Free', betteruptime: '$29+', uptimerobot: 'Limited' },
]

const testimonials = [
  {
    quote: "Switched from BetterUptime and saved $70/mo. PingKit does everything I need for my SaaS.",
    author: "Sarah K.",
    role: "Founder, TaskFlow",
  },
  {
    quote: "Set up in 2 minutes. Got my first Slack alert within the hour. This is exactly what indie devs need.",
    author: "Marcus L.",
    role: "Solo dev, APILayer",
  },
  {
    quote: "The 90-day response time graphs helped me identify a performance regression before any users complained.",
    author: "Priya M.",
    role: "Builder, FormPulse",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0f1a', color: '#f1f5f9' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/60 backdrop-blur-md" style={{ backgroundColor: 'rgba(10,15,26,0.9)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="h-6 w-6" style={{ color: '#10b981' }} />
            <span className="text-lg font-bold text-slate-100">PingKit</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-slate-400 md:flex">
            <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-200 transition-colors">Pricing</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Docs</a>
            <a href="https://statushub.threestack.io" target="_blank" rel="noreferrer" className="hover:text-slate-200 transition-colors">StatusHub</a>
          </nav>
          <Link
            href="/login"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/60 bg-emerald-950/30 px-4 py-1.5 text-xs font-medium text-emerald-400 mb-8">
          🚀 Made for indie hackers
        </div>
        <h1 className="text-5xl font-extrabold leading-tight text-slate-100 sm:text-6xl">
          Know{' '}
          <span className="relative">
            <span className="relative z-10" style={{ color: '#10b981' }}>before</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
          </span>{' '}
          your users do.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          HTTP uptime monitoring every 60s. Slack, email &amp; Discord alerts. Response time graphs. 99.9% SLA.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Start Monitoring Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#features"
            className="rounded-md border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            View Demo
          </a>
        </div>

        {/* Mock browser preview */}
        <div className="mx-auto mt-16 max-w-4xl overflow-hidden rounded-xl border border-slate-700 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div className="mx-auto flex-1 text-center">
              <span className="rounded bg-slate-800 px-3 py-0.5 text-xs text-slate-500">app.pingkit.threestack.io/monitors</span>
            </div>
          </div>
          <div className="bg-slate-900 p-4">
            <div className="space-y-2">
              {[
                { name: 'Production API', url: 'https://api.myapp.com/health', status: 'up', ms: 142, uptime: 99.98 },
                { name: 'Auth Service', url: 'https://auth.myapp.com', status: 'up', ms: 87, uptime: 100.00 },
                { name: 'Stripe Webhook', url: 'https://api.myapp.com/webhooks', status: 'down', ms: 0, uptime: 99.12 },
                { name: 'Dashboard', url: 'https://myapp.com', status: 'up', ms: 234, uptime: 99.95 },
              ].map((monitor) => (
                <div
                  key={monitor.name}
                  className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${monitor.status === 'up' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-slate-200">{monitor.name}</span>
                    <span className="hidden text-xs text-slate-500 sm:block font-mono">{monitor.url}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-400">{monitor.ms > 0 ? `${monitor.ms}ms` : '—'}</span>
                    <span className={monitor.uptime > 99.9 ? 'text-emerald-400' : 'text-amber-400'}>{monitor.uptime.toFixed(2)}%</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${monitor.status === 'up' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                      {monitor.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-800 py-6" style={{ backgroundColor: 'rgba(16,185,129,0.05)' }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-6 sm:grid-cols-4 text-center">
          {[
            { label: '3 monitors free', sublabel: 'No credit card' },
            { label: '60s checks', sublabel: 'On paid plans' },
            { label: 'BetterUptime = $79/mo', sublabel: 'PingKit = $9/mo' },
            { label: '99.9% SLA', sublabel: 'Enterprise grade' },
          ].map(({ label, sublabel }) => (
            <div key={label}>
              <p className="text-sm font-semibold text-emerald-400">{label}</p>
              <p className="text-xs text-slate-500">{sublabel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-100">Everything you need. Nothing you don&apos;t.</h2>
          <p className="mt-3 text-slate-400">Built for indie hackers who ship fast and sleep well.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-700/50 p-6 transition-colors hover:border-emerald-900"
                style={{ backgroundColor: '#111827' }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/50">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-100">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-y border-slate-800 py-24" style={{ backgroundColor: '#0d1117' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-100">Simple, honest pricing</h2>
            <p className="mt-3 text-slate-400">No hidden fees. No enterprise calls. Just pick a plan.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-xl border p-6 ${
                  tier.highlight
                    ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                    : 'border-slate-700'
                }`}
                style={{ backgroundColor: tier.highlight ? 'rgba(16,185,129,0.05)' : '#111827' }}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-100">{tier.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-100">{tier.price}</span>
                  <span className="text-slate-400">{tier.period}</span>
                </div>
                <ul className="mt-6 space-y-2">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className={`mt-8 flex w-full items-center justify-center rounded-md py-2.5 text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'border border-slate-600 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-100">How we compare</h2>
          <p className="mt-3 text-slate-400">Why pay $79/mo when $9 does the job?</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700 bg-slate-800/80">
              <tr>
                <th className="px-4 py-4 text-left font-medium text-slate-400">Feature</th>
                <th className="px-4 py-4 text-center font-bold text-emerald-400">PingKit</th>
                <th className="px-4 py-4 text-center font-medium text-slate-400">BetterUptime</th>
                <th className="px-4 py-4 text-center font-medium text-slate-400">UptimeRobot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {comparison.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-slate-300">{row.feature}</td>
                  <td className="px-4 py-3 text-center font-medium text-emerald-400">{row.pingkit}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{row.betteruptime}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{row.uptimerobot}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-slate-800 py-24" style={{ backgroundColor: '#0d1117' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-100">Indie hackers love it</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-xl border border-slate-700 p-6"
                style={{ backgroundColor: '#111827' }}
              >
                <p className="text-sm text-slate-300 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-100">{t.author}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h2 className="text-4xl font-extrabold text-slate-100">Start monitoring in 30 seconds</h2>
        <p className="mt-4 text-slate-400">No credit card. 3 monitors free forever.</p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Start Monitoring Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8" style={{ backgroundColor: '#0d1117' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" style={{ color: '#10b981' }} />
              <span className="text-sm font-bold text-slate-300">PingKit</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <a href="#" className="hover:text-slate-300">Privacy</a>
              <a href="#" className="hover:text-slate-300">Terms</a>
              <a href="#" className="hover:text-slate-300">Docs</a>
              <a href="https://statushub.threestack.io" target="_blank" rel="noreferrer" className="hover:text-slate-300">StatusHub</a>
              <a href="https://github.com/ThreeStackHQ" target="_blank" rel="noreferrer" className="hover:text-slate-300">GitHub</a>
            </div>
            <p className="text-xs text-slate-600">© 2026 ThreeStack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
