import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, alertChannels } from '@pingkit/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { Resend } from 'resend'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  webhookUrl: z.string().url().optional(),
  isEnabled: z.boolean().optional(),
})

async function getChannelOrFail(channelId: string, workspaceId: string) {
  return db.query.alertChannels.findFirst({
    where: and(eq(alertChannels.id, channelId), eq(alertChannels.workspaceId, workspaceId)),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)
    const { id } = await params

    const channel = await getChannelOrFail(id, workspace.id)
    if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const [updated] = await db
      .update(alertChannels)
      .set(parsed.data)
      .where(and(eq(alertChannels.id, id), eq(alertChannels.workspaceId, workspace.id)))
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

    const channel = await getChannelOrFail(id, workspace.id)
    if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.delete(alertChannels).where(
      and(eq(alertChannels.id, id), eq(alertChannels.workspaceId, workspace.id))
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST /api/alert-channels/[id]/test — send test notification
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)
    const { id } = await params

    const url = new URL(req.url)
    if (!url.pathname.endsWith('/test')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const channel = await getChannelOrFail(id, workspace.id)
    if (!channel) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (channel.type === 'email' && channel.email) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'alerts@pingkit.threestack.io',
        to: channel.email,
        subject: '🔔 PingKit Test Alert',
        html: '<p>This is a test notification from PingKit. Your alert channel is working correctly.</p>',
      })
    } else if (['slack', 'discord'].includes(channel.type) && channel.webhookUrl) {
      await fetch(channel.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '🔔 PingKit Test Alert — your alert channel is working correctly!' }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
