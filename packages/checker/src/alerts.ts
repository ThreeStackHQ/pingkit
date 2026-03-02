import { db, alertChannels, alertHistory, incidents, monitors } from '@pingkit/db'
import { eq, and, gte } from 'drizzle-orm'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'alerts@pingkit.threestack.io'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pingkit.threestack.io'

async function getChannels(workspaceId: string) {
  return db.query.alertChannels.findMany({
    where: and(
      eq(alertChannels.workspaceId, workspaceId),
      eq(alertChannels.isEnabled, true),
    ),
  })
}

async function wasRecentlyAlerted(incidentId: string, channelId: string, withinMs = 5 * 60 * 1000): Promise<boolean> {
  const since = new Date(Date.now() - withinMs)
  const recent = await db.query.alertHistory.findFirst({
    where: and(
      eq(alertHistory.incidentId, incidentId),
      eq(alertHistory.channelId, channelId),
      gte(alertHistory.sentAt, since),
    ),
  })
  return !!recent
}

async function sendSlackAlert(webhookUrl: string, monitorName: string, url: string, status: 'down' | 'up') {
  const color = status === 'down' ? '#ef4444' : '#10b981'
  const emoji = status === 'down' ? '🔴' : '✅'
  const text = status === 'down'
    ? `${emoji} *${monitorName}* is DOWN\n${url}`
    : `${emoji} *${monitorName}* is back UP\n${url}`

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        text,
        footer: 'PingKit · pingkit.threestack.io',
        ts: Math.floor(Date.now() / 1000),
      }],
    }),
  })
}

async function sendDiscordAlert(webhookUrl: string, monitorName: string, url: string, status: 'down' | 'up') {
  const color = status === 'down' ? 0xef4444 : 0x10b981
  const emoji = status === 'down' ? '🔴' : '✅'

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: `${emoji} ${monitorName} is ${status.toUpperCase()}`,
        description: url,
        color,
        timestamp: new Date().toISOString(),
        footer: { text: 'PingKit · pingkit.threestack.io' },
      }],
    }),
  })
}

export async function triggerAlerts(monitorId: string, incidentId: string) {
  const monitor = await db.query.monitors.findFirst({
    where: eq(monitors.id, monitorId),
    with: { workspace: { columns: { id: true } } },
  })
  if (!monitor) return

  const channels = await getChannels(monitor.workspaceId)

  for (const channel of channels) {
    try {
      const alreadySent = await wasRecentlyAlerted(incidentId, channel.id)
      if (alreadySent) continue

      let success = false
      let error: string | undefined

      if (channel.type === 'email' && channel.email) {
        await resend.emails.send({
          from: FROM,
          to: channel.email,
          subject: `🔴 ${monitor.name} is DOWN`,
          html: `
            <h2 style="color:#ef4444;">⚠️ Monitor Down Alert</h2>
            <p><strong>${monitor.name}</strong> is currently <strong>DOWN</strong>.</p>
            <p><strong>URL:</strong> ${monitor.url}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><a href="${APP_URL}/dashboard">View in PingKit →</a></p>
          `,
        })
        success = true
      } else if (channel.type === 'slack' && channel.webhookUrl) {
        await sendSlackAlert(channel.webhookUrl, monitor.name, monitor.url, 'down')
        success = true
      } else if (channel.type === 'discord' && channel.webhookUrl) {
        await sendDiscordAlert(channel.webhookUrl, monitor.name, monitor.url, 'down')
        success = true
      }

      await db.insert(alertHistory).values({
        incidentId,
        channelId: channel.id,
        type: 'down',
        success,
        error,
      })
    } catch (err: any) {
      console.error(`Alert failed for channel ${channel.id}:`, err.message)
      await db.insert(alertHistory).values({
        incidentId,
        channelId: channel.id,
        type: 'down',
        success: false,
        error: err.message,
      })
    }
  }
}

export async function triggerRecovery(monitorId: string, incidentId: string) {
  const monitor = await db.query.monitors.findFirst({
    where: eq(monitors.id, monitorId),
    with: { workspace: { columns: { id: true } } },
  })
  if (!monitor) return

  const channels = await getChannels(monitor.workspaceId)

  for (const channel of channels) {
    try {
      if (channel.type === 'email' && channel.email) {
        await resend.emails.send({
          from: FROM,
          to: channel.email,
          subject: `✅ ${monitor.name} is back UP`,
          html: `
            <h2 style="color:#10b981;">✅ Monitor Recovered</h2>
            <p><strong>${monitor.name}</strong> is back <strong>UP</strong>.</p>
            <p><strong>URL:</strong> ${monitor.url}</p>
            <p><strong>Recovered at:</strong> ${new Date().toISOString()}</p>
            <p><a href="${APP_URL}/dashboard">View in PingKit →</a></p>
          `,
        })
      } else if (channel.type === 'slack' && channel.webhookUrl) {
        await sendSlackAlert(channel.webhookUrl, monitor.name, monitor.url, 'up')
      } else if (channel.type === 'discord' && channel.webhookUrl) {
        await sendDiscordAlert(channel.webhookUrl, monitor.name, monitor.url, 'up')
      }

      await db.insert(alertHistory).values({
        incidentId,
        channelId: channel.id,
        type: 'up',
        success: true,
      })
    } catch (err: any) {
      console.error(`Recovery alert failed for channel ${channel.id}:`, err.message)
    }
  }
}
