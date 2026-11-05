import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

export async function GET() {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureSchema()
  const merchants = await sql`
    SELECT id, name, category, avatar_url, verified
      FROM (
        SELECT DISTINCT ON (lower(trim(business_name)))
               user_id AS id, business_name AS name, category, avatar_url,
               (verification_status = 'verified') AS verified, created_at
         FROM profiles
         WHERE role = 'merchant'
           AND NULLIF(trim(business_name), '') IS NOT NULL
         ORDER BY lower(trim(business_name)), created_at DESC
      ) merchant_list
     WHERE id <> ${user.id}
     ORDER BY lower(name)`

  return Response.json({ merchants })
}
