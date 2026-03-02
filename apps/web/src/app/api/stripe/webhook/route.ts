import { NextRequest, NextResponse } from 'next/server'
import { db, workspaces } from '@pingkit/db'
import { eq } from 'drizzle-orm'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const tierMap: Record<string, 'free' | 'starter' | 'pro'> = {
    [process.env.STRIPE_PRICE_STARTER ?? '']: 'starter',
    [process.env.STRIPE_PRICE_PRO ?? '']: 'pro',
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const workspaceId = session.metadata?.workspaceId
        const tier = session.metadata?.tier as 'starter' | 'pro' | undefined
        if (!workspaceId || !tier) break

        await db.update(workspaces)
          .set({
            tier,
            stripeSubscriptionId: session.subscription as string,
            stripeCurrentPeriodEnd: null,
            subscriptionStatus: 'active',
            updatedAt: new Date(),
          })
          .where(eq(workspaces.id, workspaceId))
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription
        const workspaceId = sub.metadata?.workspaceId
        if (!workspaceId) break

        const priceId = sub.items.data[0]?.price.id
        const tier = tierMap[priceId] ?? 'free'
        const status = sub.status === 'active' || sub.status === 'trialing' ? 'active'
          : sub.status === 'canceled' ? 'canceled'
          : 'past_due'

        await db.update(workspaces)
          .set({
            tier,
            stripeSubscriptionId: sub.id,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
            subscriptionStatus: status,
            updatedAt: new Date(),
          })
          .where(eq(workspaces.id, workspaceId))
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const workspaceId = sub.metadata?.workspaceId
        if (!workspaceId) break

        await db.update(workspaces)
          .set({
            tier: 'free',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(workspaces.id, workspaceId))
        break
      }
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err)
  }

  return NextResponse.json({ received: true })
}
