import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'PingKit — Uptime Monitoring for Indie SaaS',
    template: '%s | PingKit',
  },
  description: 'URL uptime monitoring for indie hackers. HTTP checks every 60s, Slack/email alerts, response time history. BetterUptime, but $9/mo.',
  keywords: ['uptime monitoring', 'url monitoring', 'indie hacker', 'saas monitoring', 'http monitoring'],
  openGraph: {
    title: 'PingKit — Uptime Monitoring for Indie SaaS',
    description: 'URL uptime monitoring at $9/mo. BetterUptime costs $79/mo. We cost $9.',
    url: 'https://pingkit.threestack.io',
    siteName: 'PingKit',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PingKit — Uptime Monitoring for Indie SaaS',
    description: 'URL uptime monitoring at $9/mo.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
