// Ensure env validation runs at server startup — will throw if required vars are missing
import '@/lib/env'
import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db, workspaces } from '@pingkit/db'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export type AuthSession = {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@pingkit.threestack.io',
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  events: {
    createUser: async ({ user }) => {
      if (user.id) {
        const existing = await db.query.workspaces.findFirst({
          where: eq(workspaces.ownerId, user.id),
        })
        if (!existing) {
          await db.insert(workspaces).values({
            name: user.name ?? user.email?.split('@')[0] ?? 'My Workspace',
            ownerId: user.id,
            tier: 'free',
          })
        }
      }
    },
  },
})

export async function requireAuth(): Promise<AuthSession> {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }
  const userId = (session.user as { id?: string }).id
  if (!userId) {
    redirect('/login')
  }
  return session as unknown as AuthSession
}

export async function getWorkspace(userId: string) {
  const ws = await db.query.workspaces.findFirst({
    where: eq(workspaces.ownerId, userId),
  })
  if (!ws) throw new Error('No workspace found')
  return ws
}
