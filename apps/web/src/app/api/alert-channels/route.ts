import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, alertChannels } from '@pingkit/db'
import { eq } from 'drizzle-orm'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { rateLimit, LIMITS } from '@/lib/rate-limit'

const createChannelSchema = z.object({
  type: z.enum(['email', 'slack', 'discord', 'pagerduty']),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
  webhookUrl: z.string().url().optional(),
}).refine(data => {
  if (data.type === 'email') return !!data.email
  if (['slack', 'discord'].includes(data.type)) return !!data.webhookUrl
  return true
}, { message: 'email required for email channels, webhookUrl required for Slack/Discord' })

export async function GET() {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)

    const channels = await db.query.alertChannels.findMany({
      where: eq(alertChannels.workspaceId, workspace.id),
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    })

    return NextResponse.json(channels)
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)

    // SEC-002: Rate limit alert channel creation per user
    const rl = rateLimit(`alert-channel-create:${session.user.id}`, LIMITS.alertChannelCreate)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      )
    }

    const body = await req.json()
    const parsed = createChannelSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 })
    }

    const [channel] = await db.insert(alertChannels).values({
      workspaceId: workspace.id,
      type: parsed.data.type,
      name: parsed.data.name,
      email: parsed.data.email,
      webhookUrl: parsed.data.webhookUrl,
    }).returning()

    return NextResponse.json(channel, { status: 201 })
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
