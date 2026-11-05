import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

// Clears the signed-in user's workspace: messages, orders, their reviews.
export async function POST() {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureSchema()
  await sql`DELETE FROM messages WHERE user_id = ${user.id}`
  await sql`DELETE FROM orders WHERE user_id = ${user.id}`
  const [row] = await sql`
    WITH r AS (
      DELETE FROM reviews WHERE user_id = ${user.id} RETURNING id
    )
    SELECT pg_current_xact_id()::text AS txid`
  return Response.json({ kind: 'committed', txid: row.txid })
}
