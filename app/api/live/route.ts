import { requireUser } from '@/lib/auth-server'
import { ensureSchema } from '@/lib/db'
import { getRealtime, liveQueries, type LiveKind } from '@/lib/realtime-server'

const KINDS = new Set<LiveKind>(['orders', 'messages', 'reviews', 'reviewMarks', 'profile'])

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { kind } = (await request.json()) as { kind: LiveKind }
  if (!KINDS.has(kind)) return Response.json({ error: 'Unknown live query' }, { status: 400 })

  await ensureSchema()
  const query = liveQueries[kind](user.id)
  const sealed = await getRealtime().seal({ query })
  return Response.json(sealed)
}
