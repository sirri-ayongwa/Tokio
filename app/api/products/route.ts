import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

export async function GET(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const merchantId = new URL(request.url).searchParams.get('merchantId')
  if (!merchantId) return Response.json({ products: [] })
  await ensureSchema()
  const products = await sql`
    SELECT id, merchant_id, name, price, image_url, stock_status
      FROM products WHERE merchant_id = ${merchantId} ORDER BY created_at DESC`
  return Response.json({ products })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as { name?: string; price?: number; imageUrl?: string }
  if (!body.name?.trim() || !Number.isFinite(body.price) || Number(body.price) <= 0) {
    return Response.json({ error: 'Enter a product name and valid price' }, { status: 400 })
  }
  await ensureSchema()
  const [profile] = await sql`SELECT role FROM profiles WHERE user_id = ${user.id}`
  if (profile?.role !== 'merchant') return Response.json({ error: 'Merchant account required' }, { status: 403 })
  const [row] = await sql`
    INSERT INTO products (merchant_id, name, price, image_url)
    VALUES (${user.id}, ${body.name.trim()}, ${Number(body.price)}, ${body.imageUrl ?? null})
    RETURNING id, pg_current_xact_id()::text AS txid`
  return Response.json({ id: row.id, txid: row.txid })
}
