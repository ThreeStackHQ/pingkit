'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ChevronRight, ExternalLink, Loader2 } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MonitorDetail {
  id: string
  name: string
  url: string
  status: 'up' | 'down' | 'paused' | 'pending'
  type: string
  intervalSeconds: number
  avgResponseMs: number | null
  uptime7d: number | null
  uptime30d: number | null
  uptime90d: number | null
  lastCheckedAt: string | null
  createdAt: string
}

function StatusBadge({ status }: { status: MonitorDetail['status'] }) {
  const map: Record<string, string> = {
    up: 'up',
    down: 'down',
    paused: 'paused',
    pending: 'pending',
  }
  return <Badge variant={map[status] as 'up' | 'down' | 'paused' | 'pending'}>{status.toUpperCase()}</Badge>
}

// Generate mock response time chart data
function generateChartData(baseMs: number) {
  const data = []
  const now = Date.now()
  for (let i = 23; i >= 0; i--) {
    const ts = now - i * 3600000
    const variance = (Math.random() - 0.5) * baseMs * 0.4
    data.push({
      time: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ms: Math.max(10, Math.round(baseMs + variance)),
    })
  }
  return data
}

// Generate 90-day heatmap data
function generateHeatmap(uptime90d: number) {
  const days = []
  for (let i = 89; i >= 0; i--) {
    const rand = Math.random() * 100
    const isUp = rand < uptime90d
    const isDown = rand > 99.5
    days.push({ status: isDown ? 'down' : isUp ? 'up' : 'up' })
  }
  return days
}

export default function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [monitor, setMonitor] = useState<MonitorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<{ time: string; ms: number }[]>([])
  const [heatmap, setHeatmap] = useState<{ status: string }[]>([])

  useEffect(() => {
    async function fetchMonitor() {
      try {
        const res = await fetch(`/api/monitors/${id}`)
        if (res.ok) {
          const data = await res.json() as MonitorDetail
          setMonitor(data)
          setChartData(generateChartData(data.avgResponseMs ?? 150))
          setHeatmap(generateHeatmap(data.uptime90d ?? 99.9))
        }
      } catch {
        // silent
      } finally {
        setLoading(false)
      }
    }
    void fetchMonitor()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!monitor) {
    return (
      <div className="py-20 text-center text-slate-400">
        Monitor not found.{' '}
        <Link href="/monitors" className="text-emerald-500 hover:underline">
          Back to monitors
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/monitors" className="hover:text-slate-200 transition-colors">
          Monitors
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-200">{monitor.name}</span>
      </nav>

      {/* Hero */}
      <div className="rounded-lg border border-slate-700 p-6" style={{ backgroundColor: '#1e293b' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <StatusBadge status={monitor.status} />
              <h1 className="text-xl font-bold text-slate-100">{monitor.name}</h1>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <a
                href={monitor.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 font-mono"
              >
                {monitor.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Current response time</p>
            <p className="text-3xl font-bold text-slate-100">
              {monitor.avgResponseMs ? `${monitor.avgResponseMs}ms` : '—'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checks">Checks</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Uptime cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Last 7 days', value: monitor.uptime7d },
                { label: 'Last 30 days', value: monitor.uptime30d },
                { label: 'Last 90 days', value: monitor.uptime90d },
              ].map(({ label, value }) => (
                <Card key={label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold text-slate-100">
                        {value != null ? `${value.toFixed(2)}%` : '—'}
                      </p>
                    </div>
                    {value != null && (
                      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-700">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, value)}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Response time chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-slate-200">Response Time (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      interval={3}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => `${v}ms`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9',
                      }}
                      formatter={(v: number | undefined) => [v != null ? `${v}ms` : '—', 'Response time']}
                    />
                    <Line
                      type="monotone"
                      dataKey="ms"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Uptime heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-slate-200">90-day Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {heatmap.map((day, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-sm ${
                        day.status === 'up'
                          ? 'bg-emerald-500'
                          : day.status === 'down'
                          ? 'bg-red-500'
                          : 'bg-slate-600'
                      }`}
                      title={`Day ${90 - i}: ${day.status}`}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Up
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-red-500" /> Down
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-slate-600" /> No data
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Checks tab */}
        <TabsContent value="checks">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-sm text-slate-400 py-8">
                Recent checks will appear here as your monitor runs.
              </p>
              <div className="overflow-hidden rounded-md border border-slate-700">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700 bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Response Time</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Region</th>
                      <th className="px-4 py-3 text-left font-medium text-slate-400">Checked At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-700/50">
                        <td className="px-4 py-3">
                          <div className="h-4 w-12 animate-pulse rounded bg-slate-700" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-16 animate-pulse rounded bg-slate-700" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-20 animate-pulse rounded bg-slate-700" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-4 w-32 animate-pulse rounded bg-slate-700" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents tab */}
        <TabsContent value="incidents">
          <Card>
            <CardContent className="pt-6">
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-slate-300">No incidents</p>
                <p className="mt-1 text-xs text-slate-400">
                  Incidents will be recorded when your monitor goes down.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
