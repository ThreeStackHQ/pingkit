import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, workspaces } from '@pingkit/db'
import { eq } from 'drizzle-orm'
import { requireAuth, getWorkspace } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'

const schema = z.object({
  tier: z.enum(['starter', 'pro']),
})

const PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const workspace = await getWorkspace(session.user.id)

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const priceId = PRICE_MAP[parsed.data.tier]
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 500 })
    }

    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pingkit.threestack.io'

    // Get or create Stripe customer
    let customerId = workspace.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: workspace.name,
        metadata: { workspaceId: workspace.id },
      })
      customerId = customer.id
      await db.update(workspaces)
        .set({ stripeCustomerId: customerId })
        .where(eq(workspaces.id, workspace.id))
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/settings/billing?canceled=true`,
      metadata: { workspaceId: workspace.id, tier: parsed.data.tier },
      subscription_data: { metadata: { workspaceId: workspace.id } },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
