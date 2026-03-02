import { NextRequest, NextResponse } from 'next/server'
import { db, workspaces, monitors, checks, incidents, users } from '@pingkit/db'
import { eq, and, gte, avg, count, desc, inArray } from 'drizzle-orm'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/escape-html'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pingkit.threestack.io'

  const allWorkspaces = await db.query.workspaces.findMany({
    with: { owner: { columns: { id: true, email: true, name: true } } },
  })

  let emailsSent = 0
  const errors: string[] = []

  for (const workspace of allWorkspaces) {
    if (!workspace.owner?.email) continue

    try {
      // Get all monitors for this workspace
      const workspaceMonitors = await db.query.monitors.findMany({
        where: eq(monitors.workspaceId, workspace.id),
      })

      if (workspaceMonitors.length === 0) continue

      const monitorIds = workspaceMonitors.map(m => m.id)

      // BUG-002: Filter incidents by monitorId in DB, not in memory across all workspaces
      const workspaceIncidents = await db.query.incidents.findMany({
        where: and(
          inArray(incidents.monitorId, monitorIds),
          gte(incidents.startedAt, weekAgo),
        ),
      })

      // Build monitor stats HTML rows
      // SEC-001: escape monitor names before embedding in HTML
      const monitorRows = workspaceMonitors.map(m => {
        const uptime = m.uptime7d?.toFixed(2) ?? '100.00'
        const avgMs = m.avgResponseMs ?? 0
        const status = m.status === 'up' ? '🟢' : m.status === 'down' ? '🔴' : '⚪'
        const safeName = escapeHtml(m.name)
        return `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${status} ${safeName}</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${uptime}%</td>
            <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${avgMs}ms</td>
          </tr>`
      }).join('')

      // Top 3 slowest by avg response
      const slowest = [...workspaceMonitors]
        .filter(m => m.avgResponseMs)
        .sort((a, b) => (b.avgResponseMs ?? 0) - (a.avgResponseMs ?? 0))
        .slice(0, 3)

      const slowestList = slowest.length > 0
        ? slowest.map(m => `<li>${escapeHtml(m.name)}: ${m.avgResponseMs}ms avg</li>`).join('')
        : '<li>No slow monitors this week 🎉</li>'

      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>PingKit Weekly Digest</title></head>
        <body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111;">
          <h1 style="color:#10b981;">📊 PingKit Weekly Report</h1>
          <p style="color:#6b7280;">Week ending ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <div style="background:#f0fdf4;border:1px solid #10b981;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0;"><strong>${workspaceMonitors.length}</strong> monitors • <strong>${workspaceIncidents.length}</strong> incidents this week</p>
          </div>

          <h2>Monitor Status</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px;text-align:left;">Monitor</th>
                <th style="padding:8px;text-align:center;">Uptime (7d)</th>
                <th style="padding:8px;text-align:center;">Avg Response</th>
              </tr>
            </thead>
            <tbody>${monitorRows}</tbody>
          </table>

          <h2>Slowest Endpoints</h2>
          <ul>${slowestList}</ul>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
          <p style="color:#9ca3af;font-size:12px;">
            <a href="${appUrl}/dashboard" style="color:#10b981;">View Dashboard</a> · 
            <a href="${appUrl}/api/unsubscribe?email=${encodeURIComponent(workspace.owner.email ?? '')}" style="color:#9ca3af;">Unsubscribe</a>
          </p>
        </body>
        </html>
      `

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'digest@pingkit.threestack.io',
        to: workspace.owner.email,
        subject: `📊 PingKit Weekly — ${workspaceMonitors.filter(m => m.status === 'up').length}/${workspaceMonitors.length} monitors up`,
        html,
      })

      emailsSent++
    } catch (err: any) {
      errors.push(`${workspace.id}: ${err.message}`)
    }
  }

  return NextResponse.json({ emailsSent, errors })
}
