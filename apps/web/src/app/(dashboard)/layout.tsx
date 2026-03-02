import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db, workspaces } from '@pingkit/db'
import { eq } from 'drizzle-orm'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const userId = (session.user as { id?: string }).id
  if (!userId) {
    redirect('/login')
  }

  let workspaceName = 'My Workspace'
  try {
    const ws = await db.query.workspaces.findFirst({
      where: eq(workspaces.ownerId, userId),
    })
    if (ws) workspaceName = ws.name
  } catch {
    // fallback
  }

  return (
    <DashboardShell
      email={session.user.email ?? ''}
      workspaceName={workspaceName}
    >
      {children}
    </DashboardShell>
  )
}
