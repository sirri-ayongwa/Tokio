import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

interface DraftInput {
  conversationId: string
  product: string
  quantity: number
  unitPrice: number
  deliveryFee: number
  payment: 'cod' | 'bkash'
  address: string
  image?: string
  seller?: string
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const d = (await request.json()) as DraftInput
  if (
    !d.product?.trim() ||
    !Number.isInteger(d.quantity) ||
    d.quantity < 1 ||
    d.quantity > 20 ||
    !Number.isFinite(d.unitPrice) ||
    d.unitPrice <= 0 ||
    !Number.isFinite(d.deliveryFee) ||
    d.deliveryFee < 0 ||
    !['cod', 'bkash'].includes(d.payment) ||
    d.address.trim().length < 3
  ) {
    return Response.json({ error: 'Invalid order draft' }, { status: 400 })
  }

  await ensureSchema()

  const [conversation] = await sql`
    SELECT c.shopper_id, c.merchant_id, mp.business_name
      FROM conversations c
      LEFT JOIN profiles mp ON mp.user_id = c.merchant_id
     WHERE c.id = ${d.conversationId} AND ${user.id} IN (c.shopper_id, c.merchant_id)`
  if (!conversation) return Response.json({ error: 'Conversation not found' }, { status: 404 })
  if (conversation.shopper_id !== user.id) {
    return Response.json({ error: 'Only the shopper can confirm an order' }, { status: 403 })
  }

  const [{ seq }] = await sql`SELECT nextval('orders_ref_seq')::int AS seq`

  const stamp = new Date().toISOString()
  const ref = `TK-${seq}`
  const trackingRef = `PTH-${String(seq).padStart(6, '0')}`
  const times = JSON.stringify([stamp, stamp, null, null, null])

  // Create the order and its chat confirmation message in one statement,
  // so one txid covers the whole user-visible change.
  const [row] = await sql`
    WITH o AS (
      INSERT INTO orders (
        user_id, conversation_id, shopper_id, merchant_id, ref, product, image, quantity, unit_price, delivery_fee, payment,
        address, customer, customer_phone_verified, seller, status, tracking_ref,
        tracking_stage, tracking_times, reviewed, from_chat
      )
      VALUES (
        ${user.id}, ${d.conversationId}, ${conversation.shopper_id}, ${conversation.merchant_id},
        ${ref}, ${d.product.trim()}, ${d.image ?? null}, ${d.quantity},
        ${d.unitPrice}, ${d.deliveryFee}, ${d.payment}, ${d.address.trim()},
        ${user.name},
        COALESCE((SELECT phone_verified FROM profiles WHERE user_id = ${user.id}), false),
        ${conversation.business_name ?? d.seller ?? 'Merchant'}, 'active', ${trackingRef},
        1, ${times}::jsonb, false, true
      )
      RETURNING id
    )
    INSERT INTO messages (user_id, conversation_id, sender_user_id, sender, kind, order_id)
    SELECT ${user.id}, ${d.conversationId}, ${user.id}, 'buyer', 'order', id FROM o
    RETURNING (SELECT id FROM o) AS order_id, id AS message_id, pg_current_xact_id()::text AS txid`

  return Response.json({ kind: 'committed', txid: row.txid, orderId: row.order_id, ref })
}
