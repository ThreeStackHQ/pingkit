'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AlertChannel {
  id: string
  type: 'email' | 'slack' | 'discord' | 'pagerduty'
  name: string
  isEnabled: boolean
  createdAt: string
}

const typeColors: Record<string, string> = {
  email: 'bg-blue-900/50 text-blue-400',
  slack: 'bg-purple-900/50 text-purple-400',
  discord: 'bg-indigo-900/50 text-indigo-400',
  pagerduty: 'bg-green-900/50 text-green-400',
}

export default function AlertChannelsPage() {
  const [channels, setChannels] = useState<AlertChannel[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/alert-channels')
      if (res.ok) {
        const data = await res.json() as AlertChannel[]
        setChannels(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchChannels()
  }, [fetchChannels])

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/alert-channels/${id}`, { method: 'DELETE' })
      void fetchChannels()
    } catch {
      // silent
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Alert Channels</h1>
          <p className="mt-1 text-sm text-slate-400">Configure where to send downtime notifications</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Channel
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-600 py-20 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <p className="text-slate-400">No alert channels yet.</p>
          <p className="mt-1 text-xs text-slate-500">Add email, Slack, or Discord to get notified when monitors go down.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[channel.type] ?? 'bg-slate-700 text-slate-400'}`}>
                  {channel.type}
                </span>
                <span className="text-sm font-medium text-slate-200">{channel.name}</span>
                <Badge variant={channel.isEnabled ? 'up' : 'paused'}>
                  {channel.isEnabled ? 'Active' : 'Disabled'}
                </Badge>
              </div>
              <button
                onClick={() => handleDelete(channel.id)}
                className="rounded p-1.5 text-slate-400 hover:bg-red-900/50 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
