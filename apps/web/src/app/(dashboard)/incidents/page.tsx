'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

type FilterType = 'all' | 'ongoing' | 'resolved'

// In a real app this would fetch from an incidents API
// For now showing empty state with filter UI
export default function IncidentsPage() {
  const [filter, setFilter] = useState<FilterType>('all')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Incidents</h1>
          <p className="mt-1 text-sm text-slate-400">Track outages and downtime events</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/30 p-1 w-fit">
        {(['all', 'ongoing', 'resolved'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/80">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-400">Monitor</th>
              <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-400">Started</th>
              <th className="px-4 py-3 text-left font-medium text-slate-400">Resolved</th>
              <th className="px-4 py-3 text-left font-medium text-slate-400">Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-4 py-20 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-slate-600 mb-3" />
                <p className="text-sm font-medium text-slate-400">No incidents found</p>
                <p className="mt-1 text-xs text-slate-500">
                  {filter === 'ongoing'
                    ? 'All your monitors are currently up. Great job!'
                    : filter === 'resolved'
                    ? 'No resolved incidents in your history.'
                    : 'Incidents will appear here when a monitor goes down.'}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
