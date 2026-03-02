'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, BarChart2, AlertCircle, Bell, Settings, LogOut, X } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Monitors', href: '/monitors', icon: BarChart2 },
  { label: 'Incidents', href: '/incidents', icon: AlertCircle },
  { label: 'Alert Channels', href: '/alert-channels', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  email: string
  workspaceName: string
  onClose?: () => void
}

export function Sidebar({ email, workspaceName, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: '#0f172a' }}>
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <Link href="/monitors" className="flex items-center gap-2">
          <Activity className="h-6 w-6" style={{ color: '#10b981' }} />
          <span className="text-lg font-bold text-slate-100">PingKit</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-950/50 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-slate-700 px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white flex-shrink-0">
            {email?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-200">{email}</p>
            <p className="truncate text-xs text-slate-500">{workspaceName}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
