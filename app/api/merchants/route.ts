import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

export async function GET() {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureSchema()
  const merchants = await sql`
    SELECT user_id AS id, business_name AS name, category, avatar_url,
           (verification_status = 'verified') AS verified
      FROM profiles
     WHERE role = 'merchant'
       AND user_id <> ${user.id}
       AND NULLIF(trim(business_name), '') IS NOT NULL
     ORDER BY lower(business_name), created_at DESC`

  return Response.json({ merchants })
}
