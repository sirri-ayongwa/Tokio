import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

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
    return Response.json({ error: 'Courier function is not deployed' }, { status: 503 })
  }

  const res = await fetch(`${fnUrl.replace(/\/$/, '')}/advance`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-secret': process.env.COURIER_SECRET! },
    body: JSON.stringify({ orderId: id }),
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return Response.json({ error: 'Courier sync failed', detail: data }, { status: 502 })
  return Response.json(data)
}
