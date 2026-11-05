import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

const ROLES = new Set(['shopper', 'merchant'])

export async function GET() {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureSchema()
  const [row] = await sql`
    SELECT phone, phone_verified AS "phoneVerified", role FROM profiles WHERE user_id = ${user.id}`
  return Response.json({ profile: row ?? null })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as {
    phone?: string
    phoneVerified?: boolean
    role?: string
    businessName?: string
    businessWebsite?: string
    pickupAddress?: string
    category?: string
  }
  if (body.role && !ROLES.has(body.role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 })
  }

  const digits = body.phone ? body.phone.replace(/\D/g, '') : null
  await ensureSchema()
  // Upsert the profile and mark this user's chat orders as phone-verified
  // in the same transaction, so one txid covers both changes.
  const [row] = await sql`
    WITH p AS (
      INSERT INTO profiles (
        user_id, email, phone, phone_digits, phone_verified, role,
        business_name, business_website, pickup_address, category
      )
      VALUES (
        ${user.id}, ${user.email}, ${body.phone ?? null}, ${digits},
        ${body.phoneVerified === true}, ${body.role ?? null},
        ${body.businessName ?? null}, ${body.businessWebsite ?? null},
        ${body.pickupAddress ?? null}, ${body.category ?? null}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET email = EXCLUDED.email,
                    phone = COALESCE(EXCLUDED.phone, profiles.phone),
                    phone_digits = COALESCE(EXCLUDED.phone_digits, profiles.phone_digits),
                    phone_verified = profiles.phone_verified OR EXCLUDED.phone_verified,
                    role = COALESCE(EXCLUDED.role, profiles.role),
                    business_name = COALESCE(EXCLUDED.business_name, profiles.business_name),
                    business_website = COALESCE(EXCLUDED.business_website, profiles.business_website),
                    pickup_address = COALESCE(EXCLUDED.pickup_address, profiles.pickup_address),
                    category = COALESCE(EXCLUDED.category, profiles.category),
                    updated_at = now()
      RETURNING user_id
    )
    UPDATE orders SET customer_phone_verified = ${body.phoneVerified === true}
    WHERE user_id = ${user.id} AND from_chat = true
    RETURNING pg_current_xact_id()::text AS txid`
  return Response.json({ kind: 'committed', txid: row?.txid ?? null })
}
