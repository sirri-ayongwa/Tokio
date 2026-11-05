import { createNeonAuth } from '@neon/auth/next/server'

type NeonAuth = ReturnType<typeof createNeonAuth>

let cached: NeonAuth | null = null

export function getAuth(): NeonAuth {
  if (!cached) {
    if (!process.env.NEON_AUTH_BASE_URL || !process.env.NEON_AUTH_COOKIE_SECRET) {
      throw new Error('Missing NEON_AUTH_BASE_URL or NEON_AUTH_COOKIE_SECRET')
    }
    cached = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL,
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET },
    })
  }
  return cached
}

export type SessionUser = { id: string; name: string; email: string }

export async function requireUser(): Promise<SessionUser | null> {
  const { data: session } = await getAuth().getSession()
  const user = session?.user
  if (!user) return null
  return { id: user.id, name: user.name ?? user.email, email: user.email }
}
