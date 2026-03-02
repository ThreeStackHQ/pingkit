import { auth } from '@/lib/auth'
import { db, workspaces } from '@pingkit/db'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userId = (session.user as { id?: string }).id
  if (!userId) redirect('/login')

  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.ownerId, userId),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your workspace and billing</p>
      </div>

      <div className="rounded-lg border border-slate-700 p-6 space-y-4" style={{ backgroundColor: '#1e293b' }}>
        <h2 className="text-lg font-semibold text-slate-100">Workspace</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Name</p>
            <p className="mt-1 text-sm text-slate-200">{ws?.name ?? 'My Workspace'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Plan</p>
            <p className="mt-1 text-sm font-semibold capitalize text-emerald-400">{ws?.tier ?? 'free'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 p-6 space-y-4" style={{ backgroundColor: '#1e293b' }}>
        <h2 className="text-lg font-semibold text-slate-100">Account</h2>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
          <p className="mt-1 text-sm text-slate-200">{session.user.email}</p>
        </div>
      </div>

      <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Upgrade to Starter</h2>
            <p className="mt-1 text-sm text-slate-400">
              Get 20 monitors, 60s checks, Slack & Discord alerts for just $9/mo
            </p>
          </div>
          <a
            href="/api/stripe/checkout"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Upgrade — $9/mo
          </a>
        </div>
      </div>
    </div>
  )
}
