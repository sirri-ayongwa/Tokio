import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

interface MessageInput {
  sender: 'buyer' | 'seller'
  kind: 'text' | 'product' | 'order' | 'image'
  text?: string
  lang?: string
  translation?: string
  orderId?: string
  imageUrl?: string
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const m = (await request.json()) as MessageInput
  if (!['buyer', 'seller'].includes(m.sender) || !['text', 'product', 'order', 'image'].includes(m.kind)) {
    return Response.json({ error: 'Invalid message' }, { status: 400 })
  }
  if (m.kind === 'text' && !m.text?.trim()) {
    return Response.json({ error: 'Message text is required' }, { status: 400 })
  }

  await ensureSchema()
  const [row] = await sql`
    INSERT INTO messages (user_id, sender, kind, text, lang, translation, order_id, image_url)
    VALUES (${user.id}, ${m.sender}, ${m.kind}, ${m.text ?? null}, ${m.lang ?? null},
            ${m.translation ?? null}, ${m.orderId ?? null}, ${m.imageUrl ?? null})
    RETURNING id, pg_current_xact_id()::text AS txid`
  return Response.json({ kind: 'committed', txid: row.txid, id: row.id })
}
