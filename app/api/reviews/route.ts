import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

const COLORS = [
  'bg-sky-100 text-sky-800',
  'bg-emerald-100 text-emerald-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
  'bg-teal-100 text-teal-800',
]

interface ReviewInput {
  orderId: string
  rating: number
  text: string
  photos?: string[]
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const r = (await request.json()) as ReviewInput
  if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) {
    return Response.json({ error: 'Choose a star rating.' }, { status: 400 })
  }
  if (!r.text || r.text.trim().length < 10) {
    return Response.json({ error: 'Write at least 10 characters.' }, { status: 400 })
  }

  await ensureSchema()

  // Reviews are only allowed on the user's own delivered orders.
  const [order] = await sql`
    SELECT id FROM orders
    WHERE id = ${r.orderId} AND user_id = ${user.id}
      AND status = 'completed' AND reviewed = false`
  if (!order) {
    return Response.json({ error: 'This order cannot be reviewed yet.' }, { status: 403 })
  }

  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const photos = JSON.stringify((r.photos ?? []).slice(0, 4))

  const [row] = await sql`
    WITH rev AS (
      INSERT INTO reviews (user_id, order_id, name, initials, avatar_color, rating, text, photos, verified)
      VALUES (${user.id}, ${r.orderId}, ${user.name}, ${initials}, ${color},
              ${r.rating}, ${r.text.trim()}, ${photos}::jsonb, true)
      RETURNING id
    )
    UPDATE orders SET reviewed = true WHERE id = ${r.orderId}
    RETURNING (SELECT id FROM rev) AS review_id, pg_current_xact_id()::text AS txid`

  return Response.json({ kind: 'committed', txid: row.txid, reviewId: row.review_id })
}
