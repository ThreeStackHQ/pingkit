import { NextRequest, NextResponse } from 'next/server'
import { db, monitors, incidents, alertChannels, alertHistory } from '@pingkit/db'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import * as tls from 'tls'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const maxDuration = 60

function checkSslExpiry(hostname: string, port = 443): Promise<{ daysUntilExpiry: number; expiresAt: Date }> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host: hostname, port, servername: hostname, timeout: 10000 }, () => {
      const cert = socket.getPeerCertificate()
      socket.destroy()
      if (!cert?.valid_to) {
        reject(new Error('No certificate found'))
        return
      }
      const expiresAt = new Date(cert.valid_to)
      const daysUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      resolve({ daysUntilExpiry, expiresAt })
    })
    socket.on('error', reject)
    socket.on('timeout', () => { socket.destroy(); reject(new Error('TLS connection timed out')) })
  })
}

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only check Pro workspaces' HTTPS monitors (SSL monitoring is Pro feature)
  const httpsMonitors = await db.query.monitors.findMany({
    where: and(
      eq(monitors.type, 'http'),
    ),
    with: {
      workspace: { columns: { id: true, tier: true, ownerId: true } },
    },
  })

  const proMonitors = httpsMonitors.filter(
    m => m.url.startsWith('https://') && m.workspace.tier === 'pro' && m.status !== 'paused'
  )

  const resend = new Resend(process.env.RESEND_API_KEY)
  const results: { monitorId: string; daysUntilExpiry?: number; error?: string }[] = []

  for (const monitor of proMonitors) {
    try {
      const hostname = new URL(monitor.url).hostname
      const { daysUntilExpiry, expiresAt } = await checkSslExpiry(hostname)
      results.push({ monitorId: monitor.id, daysUntilExpiry })

      const warningThresholds = [30, 14, 7]
      const shouldAlert = warningThresholds.includes(daysUntilExpiry)

      if (shouldAlert) {
        // Create or find existing SSL incident
        let incident = await db.query.incidents.findFirst({
          where: and(
            eq(incidents.monitorId, monitor.id),
            isNull(incidents.resolvedAt),
            eq(incidents.cause, `ssl_expiry_${daysUntilExpiry}d`),
          ),
        })

        if (!incident) {
          const [newIncident] = await db.insert(incidents).values({
            monitorId: monitor.id,
            cause: `ssl_expiry_${daysUntilExpiry}d`,
          }).returning()
          incident = newIncident
        }

        // Get workspace alert channels
        const channels = await db.query.alertChannels.findMany({
          where: and(
            eq(alertChannels.workspaceId, monitor.workspaceId),
            eq(alertChannels.isEnabled, true),
          ),
        })

        for (const channel of channels) {
          if (channel.type === 'email' && channel.email) {
            try {
              await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL ?? 'alerts@pingkit.threestack.io',
                to: channel.email,
                subject: `⚠️ SSL Certificate expires in ${daysUntilExpiry} days — ${monitor.name}`,
                html: `
                  <h2>SSL Certificate Warning</h2>
                  <p>The SSL certificate for <strong>${monitor.name}</strong> (${monitor.url}) will expire in <strong>${daysUntilExpiry} days</strong> on ${expiresAt.toLocaleDateString()}.</p>
                  <p>Please renew your certificate to avoid downtime.</p>
                  <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View in PingKit →</a></p>
                `,
              })
              await db.insert(alertHistory).values({
                incidentId: incident.id,
                channelId: channel.id,
                type: 'ssl_warning',
                success: true,
              })
            } catch (alertErr) {
              console.error('SSL alert send error:', alertErr)
            }
          }
        }
      }
    } catch (err: any) {
      results.push({ monitorId: monitor.id, error: err.message })
    }
  }

  return NextResponse.json({ checked: proMonitors.length, results })
}
