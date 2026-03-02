'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Pause, Play, ChevronRight, Loader2 } from 'lucide-react'
import { AddMonitorModal } from '@/components/monitors/AddMonitorModal'
import { Badge } from '@/components/ui/badge'

interface Monitor {
  id: string
  name: string
  url: string
  status: 'up' | 'down' | 'paused' | 'pending'
  avgResponseMs: number | null
  uptime30d: number | null
  intervalSeconds: number
  lastCheckedAt: string | null
  updatedAt: string
}

function StatusDot({ status }: { status: Monitor['status'] }) {
  const colors = {
    up: 'bg-emerald-500',
    down: 'bg-red-500',
    paused: 'bg-slate-500',
    pending: 'bg-yellow-500',
  }
  return (
    <span className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${colors[status]} flex-shrink-0`} />
      <span className="capitalize text-slate-300">{status}</span>
    </span>
  )
}

function formatInterval(s: number): string {
  if (s < 60) return `${s}s`
  return `${s / 60}m`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchMonitors = useCallback(async () => {
    try {
      const res = await fetch('/api/monitors')
      if (res.ok) {
        const data = await res.json() as Monitor[]
        setMonitors(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMonitors()
  }, [fetchMonitors])

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/monitors/${id}`, { method: 'DELETE' })
      setDeleteId(null)
      void fetchMonitors()
    } catch {
      // silent
    }
  }

  async function handleTogglePause(monitor: Monitor) {
    const newStatus = monitor.status === 'paused' ? 'pending' : 'paused'
    try {
      await fetch(`/api/monitors/${monitor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      void fetchMonitors()
    } catch {
      // silent
    }
  }

  const up = monitors.filter((m) => m.status === 'up').length
  const down = monitors.filter((m) => m.status === 'down').length
  const paused = monitors.filter((m) => m.status === 'paused').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Monitors</h1>
          <p className="mt-1 text-sm text-slate-400">Track uptime and response times for your URLs</p>
        </div>
        <AddMonitorModal onSuccess={fetchMonitors} />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{monitors.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">Up</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{up}</p>
        </div>
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-red-400">Down</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{down}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Paused</p>
          <p className="mt-1 text-2xl font-bold text-slate-300">{paused}</p>
        </div>
      </div>

      {/* Table / content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : monitors.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-600 py-20 text-center">
          <p className="text-slate-400">No monitors yet. Start by adding your first URL.</p>
          <div className="mt-4">
            <AddMonitorModal onSuccess={fetchMonitors} />
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700 bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">URL</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Resp. Time</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Uptime 30d</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Interval</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">Last Check</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {monitors.map((monitor) => (
                  <tr key={monitor.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <StatusDot status={monitor.status} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/monitors/${monitor.id}`}
                        className="flex items-center gap-1 font-medium text-slate-100 hover:text-emerald-400 transition-colors"
                      >
                        {monitor.name}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="max-w-[200px] truncate block text-slate-400 text-xs font-mono">
                        {monitor.url}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {monitor.avgResponseMs ? `${monitor.avgResponseMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {monitor.uptime30d != null ? (
                        <Badge variant={monitor.uptime30d > 99 ? 'up' : monitor.uptime30d > 95 ? 'pending' : 'down'}>
                          {monitor.uptime30d.toFixed(2)}%
                        </Badge>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{formatInterval(monitor.intervalSeconds)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{monitor.lastCheckedAt ? timeAgo(monitor.lastCheckedAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/monitors/${monitor.id}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleTogglePause(monitor)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                          title={monitor.status === 'paused' ? 'Resume' : 'Pause'}
                        >
                          {monitor.status === 'paused' ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <Pause className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteId(monitor.id)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-900/50 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-lg border border-slate-700 bg-slate-900 p-6">
            <h3 className="text-lg font-semibold text-slate-100">Delete monitor?</h3>
            <p className="mt-2 text-sm text-slate-400">
              This will permanently delete this monitor and all its check history.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
