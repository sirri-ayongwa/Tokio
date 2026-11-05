import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'
import { translateMessage } from '@/lib/translate-message'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await ensureSchema()
  const [message] = await sql`
    SELECT m.id, m.text, m.lang, m.translation
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
     WHERE m.id = ${id}
       AND ${user.id} IN (c.shopper_id, c.merchant_id)
       AND m.kind = 'text'`
  if (!message) return Response.json({ error: 'Message not found' }, { status: 404 })
  if (message.translation) return Response.json({ kind: 'unchanged' })

  const translation = await translateMessage(message.text, message.lang === 'bn' ? 'bn' : 'en')
  if (!translation) return Response.json({ error: 'Translation unavailable' }, { status: 503 })

  const [row] = await sql`
    UPDATE messages
       SET translation = ${translation}
     WHERE id = ${id} AND translation IS NULL
    RETURNING pg_current_xact_id()::text AS txid`
  return Response.json({ kind: row ? 'committed' : 'unchanged', txid: row?.txid ?? null })
}
