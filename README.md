# PingKit

> URL uptime monitoring for indie SaaS. BetterUptime costs $79/mo. We cost $9.

## Stack

- **Web**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Drizzle ORM
- **Queue**: BullMQ + Redis (Upstash)
- **Auth**: NextAuth v5 (Google OAuth + Magic Link)
- **Email**: Resend
- **Billing**: Stripe
- **Deployment**: Coolify → pingkit.threestack.io

## Monorepo Structure

```
apps/
  web/          # Next.js dashboard + landing page
packages/
  db/           # Drizzle ORM schema + client
  checker/      # BullMQ worker for running checks
  config/       # Shared TypeScript/ESLint configs
```

## Pricing

| Plan | Price | Monitors | Interval | Channels |
|------|-------|----------|----------|----------|
| Free | $0 | 3 | 5 min | Email only |
| Starter | $9/mo | 20 | 60s | Email, Slack, Discord |
| Pro | $29/mo | Unlimited | 30s | All channels + SSL |

## Getting Started

```bash
pnpm install
cp .env.example .env
# Fill in your env vars
pnpm dev
```
