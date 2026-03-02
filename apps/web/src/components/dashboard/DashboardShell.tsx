'use client'

import React, { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  email: string
  workspaceName: string
}

export function DashboardShell({ children, email, workspaceName }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-shrink-0 lg:flex-col border-r border-slate-700">
        <Sidebar email={email} workspaceName={workspaceName} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex w-64 flex-col">
            <Sidebar
              email={email}
              workspaceName={workspaceName}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center border-b border-slate-700 px-4 py-3 lg:hidden" style={{ backgroundColor: '#1e293b' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="mr-3 text-slate-400 hover:text-slate-200"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-sm font-semibold text-slate-200">PingKit</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#1e293b' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
