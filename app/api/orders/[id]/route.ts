import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = (await request.json()) as { status?: string }
  if (body.status !== 'cancelled') {
    return Response.json({ error: 'Unsupported update' }, { status: 400 })
  }

  await ensureSchema()
  const [row] = await sql`
    UPDATE orders SET status = 'cancelled'
    WHERE id = ${id} AND user_id = ${user.id} AND status = 'active'
    RETURNING id, pg_current_xact_id()::text AS txid`
  if (!row) return Response.json({ kind: 'unchanged' })
  return Response.json({ kind: 'committed', txid: row.txid })
}
