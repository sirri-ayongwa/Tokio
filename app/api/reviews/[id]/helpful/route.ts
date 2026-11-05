import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

// Toggles the current user's "helpful" mark on a review in one statement.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await ensureSchema()
  const [row] = await sql`
    WITH m AS (
      INSERT INTO review_marks (review_id, user_id)
      VALUES (${id}, ${user.id})
      ON CONFLICT DO NOTHING
      RETURNING true AS added
    ),
    d AS (
      DELETE FROM review_marks
      WHERE review_id = ${id} AND user_id = ${user.id}
        AND NOT EXISTS (SELECT 1 FROM m)
      RETURNING true AS removed
    )
    UPDATE reviews
       SET helpful = helpful + CASE WHEN EXISTS (SELECT 1 FROM m) THEN 1 ELSE -1 END
     WHERE id = ${id}
    RETURNING helpful, EXISTS (SELECT 1 FROM m) AS marked, pg_current_xact_id()::text AS txid`

  if (!row) return Response.json({ error: 'Review not found' }, { status: 404 })
  return Response.json({ kind: 'committed', txid: row.txid, helpful: row.helpful, marked: row.marked })
}
