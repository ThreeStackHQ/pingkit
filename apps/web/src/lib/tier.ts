import { db, workspaces, monitors } from '@pingkit/db'
import { eq, count } from 'drizzle-orm'

export type Tier = 'free' | 'starter' | 'pro'

export interface TierLimits {
  maxMonitors: number        // -1 = unlimited
  minIntervalSeconds: number
  historyDays: number
  channels: ('email' | 'slack' | 'discord')[]
  sslMonitoring: boolean
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    maxMonitors: 3,
    minIntervalSeconds: 300, // 5 min
    historyDays: 30,
    channels: ['email'],
    sslMonitoring: false,
  },
  starter: {
    maxMonitors: 20,
    minIntervalSeconds: 60, // 1 min
    historyDays: 90,
    channels: ['email', 'slack', 'discord'],
    sslMonitoring: false,
  },
  pro: {
    maxMonitors: -1, // unlimited
    minIntervalSeconds: 30, // 30s
    historyDays: 365,
    channels: ['email', 'slack', 'discord'],
    sslMonitoring: true,
  },
}

export async function getWorkspaceTier(workspaceId: string): Promise<Tier> {
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
    columns: { tier: true },
  })
  return (ws?.tier as Tier) ?? 'free'
}

export async function getTierLimits(workspaceId: string): Promise<TierLimits> {
  const tier = await getWorkspaceTier(workspaceId)
  return TIER_LIMITS[tier]
}

export async function canAddMonitor(workspaceId: string): Promise<boolean> {
  const limits = await getTierLimits(workspaceId)
  if (limits.maxMonitors === -1) return true
  const [result] = await db
    .select({ count: count() })
    .from(monitors)
    .where(eq(monitors.workspaceId, workspaceId))
  return (result?.count ?? 0) < limits.maxMonitors
}

export async function enforceInterval(workspaceId: string, requestedSeconds: number): Promise<number> {
  const limits = await getTierLimits(workspaceId)
  return Math.max(requestedSeconds, limits.minIntervalSeconds)
}
