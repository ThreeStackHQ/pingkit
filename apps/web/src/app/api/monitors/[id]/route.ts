import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, monitors } from '@pingkit/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { enforceInterval } from '@/lib/tier'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  type: z.enum(['http', 'tcp', 'keyword']).optional(),
  intervalSeconds: z.number().int().min(30).max(86400).optional(),
  timeoutMs: z.number().int().min(1000).max(30000).optional(),
  keywordValue: z.string().optional(),
  expectedStatusCode: z.number().int().optional(),
  status: z.enum(['pending', 'up', 'down', 'paused']).optional(),
})

async function getMonitorOrFail(monitorId: string, workspaceId: string) {
  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.workspaceId, workspaceId)),
  })
  return monitor
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)
    const { id } = await params

    const monitor = await getMonitorOrFail(id, workspace.id)
    if (!monitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(monitor)
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)
    const { id } = await params

    const monitor = await getMonitorOrFail(id, workspace.id)
    if (!monitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
    }

    const updates: Partial<typeof monitor> = { ...parsed.data }
    if (parsed.data.intervalSeconds) {
      updates.intervalSeconds = await enforceInterval(workspace.id, parsed.data.intervalSeconds)
    }

    const [updated] = await db
      .update(monitors)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(monitors.id, id), eq(monitors.workspaceId, workspace.id)))
      .returning()

    return NextResponse.json(updated)
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)
    const { id } = await params

    const monitor = await getMonitorOrFail(id, workspace.id)
    if (!monitor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.delete(monitors).where(
      and(eq(monitors.id, id), eq(monitors.workspaceId, workspace.id))
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
