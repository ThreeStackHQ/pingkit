import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, monitors } from '@pingkit/db'
import { eq } from 'drizzle-orm'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { canAddMonitor, enforceInterval } from '@/lib/tier'

const createMonitorSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  type: z.enum(['http', 'tcp', 'keyword']).default('http'),
  intervalSeconds: z.number().int().min(30).max(86400).default(60),
  timeoutMs: z.number().int().min(1000).max(30000).default(10000),
  keywordValue: z.string().optional(),
  expectedStatusCode: z.number().int().optional(),
})

export async function GET() {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)

    const monitorList = await db.query.monitors.findMany({
      where: eq(monitors.workspaceId, workspace.id),
      orderBy: (monitors, { desc }) => [desc(monitors.createdAt)],
    })

    return NextResponse.json(monitorList)
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)

    const body = await req.json()
    const parsed = createMonitorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
    }

    // Check monitor limit per tier
    const allowed = await canAddMonitor(workspace.id)
    if (!allowed) {
      return NextResponse.json({ error: 'Monitor limit reached for your plan' }, { status: 403 })
    }

    // Enforce minimum interval per tier
    const interval = await enforceInterval(workspace.id, parsed.data.intervalSeconds)

    if (parsed.data.type === 'keyword' && !parsed.data.keywordValue) {
      return NextResponse.json({ error: 'keywordValue required for keyword monitors' }, { status: 400 })
    }

    const [monitor] = await db.insert(monitors).values({
      workspaceId: workspace.id,
      name: parsed.data.name,
      url: parsed.data.url,
      type: parsed.data.type as 'http' | 'tcp' | 'keyword',
      intervalSeconds: interval,
      timeoutMs: parsed.data.timeoutMs,
      keywordValue: parsed.data.keywordValue,
      expectedStatusCode: parsed.data.expectedStatusCode ?? 200,
      status: 'pending',
    }).returning()

    return NextResponse.json(monitor, { status: 201 })
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
