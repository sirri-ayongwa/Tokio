import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

export async function GET() {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureSchema()

  const [profile] = await sql`SELECT role FROM profiles WHERE user_id = ${user.id}`
  const role = profile?.role === 'merchant' ? 'merchant' : 'shopper'
  const conversations = await sql`
    SELECT c.id, c.shopper_id, c.merchant_id, c.updated_at,
           sp.email AS shopper_email,
           (sp.verification_status = 'verified') AS shopper_verified,
           COALESCE(mp.business_name, mp.email) AS merchant_name,
           mp.category AS merchant_category,
           mp.avatar_url AS merchant_avatar_url,
           (mp.verification_status = 'verified') AS merchant_verified,
           mp.created_at AS merchant_created_at,
           (SELECT count(*)::int FROM orders o WHERE o.merchant_id = c.merchant_id AND o.status = 'completed') AS completed_orders,
           (SELECT avg(extract(epoch FROM (reply.created_at - buyer.created_at)))::float8
              FROM messages reply
              JOIN LATERAL (
                SELECT created_at FROM messages prior
                 WHERE prior.conversation_id = reply.conversation_id
                   AND prior.sender = 'buyer' AND prior.created_at < reply.created_at
                 ORDER BY prior.created_at DESC LIMIT 1
              ) buyer ON true
             WHERE reply.conversation_id = c.id AND reply.sender = 'seller') AS response_seconds,
           (SELECT m.text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message
      FROM conversations c
      LEFT JOIN profiles sp ON sp.user_id = c.shopper_id
      LEFT JOIN profiles mp ON mp.user_id = c.merchant_id
     WHERE ${user.id} IN (c.shopper_id, c.merchant_id)
     ORDER BY c.updated_at DESC`

  const merchants = role === 'shopper'
    ? await sql`
        SELECT user_id AS id, business_name AS name, category, avatar_url,
               (verification_status = 'verified') AS verified
          FROM profiles
         WHERE role = 'merchant' AND user_id <> ${user.id} AND business_name IS NOT NULL
         ORDER BY business_name`
    : []

  return Response.json({ role, conversations, merchants })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { merchantId } = (await request.json()) as { merchantId?: string }
  if (!merchantId) return Response.json({ error: 'Choose a merchant' }, { status: 400 })
  await ensureSchema()

  const [shopper, merchant] = await Promise.all([
    sql`SELECT role FROM profiles WHERE user_id = ${user.id}`,
    sql`SELECT role FROM profiles WHERE user_id = ${merchantId}`,
  ])
  if (shopper[0]?.role === 'merchant' || merchant[0]?.role !== 'merchant') {
    return Response.json({ error: 'Invalid conversation participants' }, { status: 400 })
  }

  const [row] = await sql`
    INSERT INTO conversations (shopper_id, merchant_id)
    VALUES (${user.id}, ${merchantId})
    ON CONFLICT (shopper_id, merchant_id) DO UPDATE SET updated_at = now()
    RETURNING id, pg_current_xact_id()::text AS txid`
  return Response.json({ id: row.id, txid: row.txid })
}
