import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureSchema()
  const body = await request.json().catch(() => ({})) as { online?: boolean }
  await sql`
    UPDATE profiles
       SET last_seen_at = ${body.online === false ? null : new Date().toISOString()}::timestamptz,
           updated_at = now()
     WHERE user_id = ${user.id}`
  return Response.json({ ok: true })
}
