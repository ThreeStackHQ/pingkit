'use client'

import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface AddMonitorModalProps {
  onSuccess: () => void
  isPro?: boolean
}

export function AddMonitorModal({ onSuccess, isPro = false }: AddMonitorModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<'http' | 'keyword'>('http')
  const [interval, setInterval] = useState('60')
  const [keyword, setKeyword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const body: Record<string, unknown> = {
        name,
        url,
        type,
        intervalSeconds: parseInt(interval),
      }
      if (type === 'keyword') body.keywordValue = keyword

      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to create monitor')
      }
      setOpen(false)
      setName('')
      setUrl('')
      setType('http')
      setInterval('60')
      setKeyword('')
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monitor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Monitor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Monitor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-700 bg-red-900/30 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="mon-name">Name</Label>
            <Input
              id="mon-name"
              placeholder="My API"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mon-url">URL</Label>
            <Input
              id="mon-url"
              placeholder="https://api.example.com/health"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'http' | 'keyword')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="http">HTTP Check</SelectItem>
                <SelectItem value="keyword">Keyword Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'keyword' && (
            <div className="space-y-1.5">
              <Label htmlFor="mon-keyword">Keyword to find</Label>
              <Input
                id="mon-keyword"
                placeholder="OK"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Check Interval</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInterval('60')}
                className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                  interval === '60'
                    ? 'border-emerald-500 bg-emerald-900/30 text-emerald-400'
                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                60s
              </button>
              <button
                type="button"
                onClick={() => isPro && setInterval('30')}
                className={`relative rounded-md border px-3 py-2 text-sm transition-colors ${
                  interval === '30'
                    ? 'border-emerald-500 bg-emerald-900/30 text-emerald-400'
                    : 'border-slate-600 text-slate-400'
                } ${!isPro ? 'cursor-not-allowed opacity-50' : 'hover:border-slate-500'}`}
              >
                30s
                {!isPro && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    PRO
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Monitor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
