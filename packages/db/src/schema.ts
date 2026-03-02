import { pgTable, text, timestamp, integer, boolean, pgEnum, jsonb, real } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'

// Enums
export const monitorTypeEnum = pgEnum('monitor_type', ['http', 'tcp', 'keyword'])
export const monitorStatusEnum = pgEnum('monitor_status', ['up', 'down', 'paused', 'pending'])
export const checkStatusEnum = pgEnum('check_status', ['up', 'down', 'timeout', 'error'])
export const alertChannelTypeEnum = pgEnum('alert_channel_type', ['email', 'slack', 'discord', 'pagerduty'])
export const tierEnum = pgEnum('tier', ['free', 'starter', 'pro'])
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due', 'trialing'])

// NextAuth tables
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
})

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
})

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires').notNull(),
})

// Workspaces
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tier: tierEnum('tier').default('free').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Monitors
export const monitors = pgTable('monitors', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  type: monitorTypeEnum('type').default('http').notNull(),
  status: monitorStatusEnum('status').default('pending').notNull(),
  intervalSeconds: integer('interval_seconds').default(60).notNull(),
  timeoutMs: integer('timeout_ms').default(10000).notNull(),
  regions: jsonb('regions').$type<string[]>().default(['us-east']).notNull(),
  keywordValue: text('keyword_value'), // for keyword checks
  followRedirects: boolean('follow_redirects').default(true).notNull(),
  expectedStatusCode: integer('expected_status_code').default(200),
  uptime7d: real('uptime_7d').default(100),
  uptime30d: real('uptime_30d').default(100),
  uptime90d: real('uptime_90d').default(100),
  avgResponseMs: integer('avg_response_ms'),
  lastCheckedAt: timestamp('last_checked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Checks (individual check results)
export const checks = pgTable('checks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  monitorId: text('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  status: checkStatusEnum('status').notNull(),
  responseMs: integer('response_ms'),
  statusCode: integer('status_code'),
  region: text('region').notNull(),
  error: text('error'),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
})

// Incidents
export const incidents = pgTable('incidents', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  monitorId: text('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  cause: text('cause'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  durationMs: integer('duration_ms'),
})

// Alert channels
export const alertChannels = pgTable('alert_channels', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  type: alertChannelTypeEnum('type').notNull(),
  name: text('name').notNull(),
  webhookUrl: text('webhook_url'),
  email: text('email'),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Alert history
export const alertHistory = pgTable('alert_history', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  incidentId: text('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  channelId: text('channel_id').notNull().references(() => alertChannels.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'down' | 'up'
  success: boolean('success').notNull(),
  error: text('error'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
})

// SSL certificates
export const sslChecks = pgTable('ssl_checks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  monitorId: text('monitor_id').notNull().references(() => monitors.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at'),
  issuer: text('issuer'),
  daysUntilExpiry: integer('days_until_expiry'),
  checkedAt: timestamp('checked_at').defaultNow().notNull(),
})

// Relations
export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  monitors: many(monitors),
  alertChannels: many(alertChannels),
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
}))

export const monitorsRelations = relations(monitors, ({ many, one }) => ({
  checks: many(checks),
  incidents: many(incidents),
  workspace: one(workspaces, { fields: [monitors.workspaceId], references: [workspaces.id] }),
}))

export const incidentsRelations = relations(incidents, ({ many, one }) => ({
  alertHistory: many(alertHistory),
  monitor: one(monitors, { fields: [incidents.monitorId], references: [monitors.id] }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
}))

export const alertChannelsRelations = relations(alertChannels, ({ one, many }) => ({
  workspace: one(workspaces, { fields: [alertChannels.workspaceId], references: [workspaces.id] }),
  alertHistory: many(alertHistory),
}))

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  incident: one(incidents, { fields: [alertHistory.incidentId], references: [incidents.id] }),
  channel: one(alertChannels, { fields: [alertHistory.channelId], references: [alertChannels.id] }),
}))

export const checksRelations = relations(checks, ({ one }) => ({
  monitor: one(monitors, { fields: [checks.monitorId], references: [monitors.id] }),
}))

export const sslChecksRelations = relations(sslChecks, ({ one }) => ({
  monitor: one(monitors, { fields: [sslChecks.monitorId], references: [monitors.id] }),
}))
