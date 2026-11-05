import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

const LAST_STAGE = 4

async function advanceDirectly(id: string) {
  const rows = await sql`
    UPDATE orders
       SET tracking_stage = tracking_stage + 1,
           tracking_times = jsonb_set(
             tracking_times,
             ARRAY[(tracking_stage + 1)::text],
             to_jsonb(now()::text),
             true
           ),
           status = CASE WHEN tracking_stage + 1 >= ${LAST_STAGE}
                         THEN 'completed' ELSE status END
     WHERE id = ${id} AND status = 'active' AND tracking_stage < ${LAST_STAGE}
     RETURNING id, ref, tracking_stage, status`
  return { advanced: rows.length, orders: rows }
}

// Asks the deployed Neon courier function for the latest tracking scan.
// The function updates Postgres; Realtime pushes the change to open clients.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await ensureSchema()
  const [own] = await sql`SELECT id FROM orders WHERE id = ${id} AND ${user.id} IN (user_id, shopper_id, merchant_id)`
  if (!own) return Response.json({ error: 'Order not found' }, { status: 404 })

  const fnUrl = process.env.NEON_FUNCTION_COURIER_BASE_URL
  if (!fnUrl) {
    return Response.json(await advanceDirectly(id))
  }

  try {
    const res = await fetch(`${fnUrl.replace(/\/$/, '')}/advance`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-secret': process.env.COURIER_SECRET ?? '' },
      body: JSON.stringify({ orderId: id }),
      cache: 'no-store',
    })
    if (res.ok) return Response.json(await res.json())
  } catch {
    // Keep simulated tracking functional if the external courier is unavailable.
  }
  return Response.json(await advanceDirectly(id))
}
