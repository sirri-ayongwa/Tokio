import { createNeonAuth } from '@neon/auth/next/server'

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
})

export type SessionUser = { id: string; name: string; email: string }

export async function requireUser(): Promise<SessionUser | null> {
  const { data: session } = await auth.getSession()
  const user = session?.user
  if (!user) return null
  return { id: user.id, name: user.name ?? user.email, email: user.email }
}
