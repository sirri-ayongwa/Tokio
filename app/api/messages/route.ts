import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'
import { translateMessage } from '@/lib/translate-message'
import type { Lang } from '@/lib/types'

interface MessageInput {
  conversationId: string
  kind: 'text' | 'product' | 'order' | 'image'
  text?: string
  lang?: string
  translation?: string
  orderId?: string
  imageUrl?: string
  productId?: string
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const m = (await request.json()) as MessageInput
  if (!m.conversationId || !['text', 'product', 'order', 'image'].includes(m.kind)) {
    return Response.json({ error: 'Invalid message' }, { status: 400 })
  }
  if (m.kind === 'text' && !m.text?.trim()) {
    return Response.json({ error: 'Message text is required' }, { status: 400 })
  }

  await ensureSchema()
  const [conversation] = await sql`
    SELECT shopper_id, merchant_id FROM conversations
     WHERE id = ${m.conversationId} AND ${user.id} IN (shopper_id, merchant_id)`
  if (!conversation) return Response.json({ error: 'Conversation not found' }, { status: 404 })
  const sender = conversation.merchant_id === user.id ? 'seller' : 'buyer'
  const lang: Lang | null = m.kind === 'text'
    ? (/[ঀ-৿]/.test(m.text!) ? 'bn' : 'en')
    : null
  const translation = m.kind === 'text' ? await translateMessage(m.text!.trim(), lang!) : null
  const [row] = await sql`
    INSERT INTO messages (user_id, conversation_id, sender_user_id, sender, kind, text, lang, translation, order_id, image_url, product_id)
    VALUES (${conversation.shopper_id}, ${m.conversationId}, ${user.id}, ${sender}, ${m.kind}, ${m.text?.trim() ?? null}, ${lang},
            ${translation}, ${m.orderId ?? null}, ${m.imageUrl ?? null}, ${m.productId ?? null})
    RETURNING id, pg_current_xact_id()::text AS txid`
  await sql`UPDATE conversations SET updated_at = now() WHERE id = ${m.conversationId}`
  return Response.json({ kind: 'committed', txid: row.txid, id: row.id })
}
