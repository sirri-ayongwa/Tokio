import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await ensureSchema()
  const [row] = await sql`
    UPDATE conversations
       SET shopper_read_at = CASE WHEN shopper_id = ${user.id} THEN now() ELSE shopper_read_at END,
           merchant_read_at = CASE WHEN merchant_id = ${user.id} THEN now() ELSE merchant_read_at END
     WHERE id = ${id} AND ${user.id} IN (shopper_id, merchant_id)
     RETURNING id, pg_current_xact_id()::text AS txid`
  if (!row) return Response.json({ error: 'Conversation not found' }, { status: 404 })
  return Response.json({ kind: 'committed', txid: row.txid })
}
