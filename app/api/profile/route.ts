import { requireUser } from '@/lib/auth-server'
import { ensureSchema, sql } from '@/lib/db'

const ROLES = new Set(['shopper', 'merchant'])

export async function GET() {
  const user = await requireUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  await ensureSchema()
  const [row] = await sql`
    SELECT phone, phone_verified AS "phoneVerified", role,
           address, pickup_address AS "pickupAddress",
           business_website AS "businessWebsite",
           address_visible AS "addressVisible", avatar_url AS "avatarUrl",
           verification_status AS "verificationStatus",
           nid_url AS "nidUrl", passport_url AS "passportUrl",
           trade_license_url AS "tradeLicenseUrl"
      FROM profiles WHERE user_id = ${user.id}`
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
    businessWebsite?: string | null
    pickupAddress?: string
    address?: string
    addressVisible?: boolean
    category?: string
    avatarUrl?: string
    verificationDocument?: { type: 'nid' | 'passport' | 'tradeLicense'; url: string }
  }
  if (body.role && !ROLES.has(body.role)) {
    return Response.json({ error: 'Invalid role' }, { status: 400 })
  }

  const digits = body.phone ? body.phone.replace(/\D/g, '') : null
  const nidUrl = body.verificationDocument?.type === 'nid' ? body.verificationDocument.url : null
  const passportUrl = body.verificationDocument?.type === 'passport' ? body.verificationDocument.url : null
  const tradeLicenseUrl = body.verificationDocument?.type === 'tradeLicense' ? body.verificationDocument.url : null
  await ensureSchema()
  // Upsert the profile and mark this user's chat orders as phone-verified
  // in the same transaction, so one txid covers both changes.
  const [row] = await sql`
    WITH p AS (
      INSERT INTO profiles (
        user_id, email, phone, phone_digits, phone_verified, role,
        business_name, business_website, pickup_address, address,
        address_visible, category, avatar_url, verification_status,
        nid_url, passport_url, trade_license_url
      )
      VALUES (
        ${user.id}, ${user.email}, ${body.phone ?? null}, ${digits},
        ${body.phoneVerified === true}, ${body.role ?? null},
        ${body.businessName ?? null}, ${body.businessWebsite ?? null},
        ${body.pickupAddress ?? null}, ${body.address ?? null},
        ${body.addressVisible === true}, ${body.category ?? null}, ${body.avatarUrl ?? null},
        ${body.verificationDocument ? 'pending' : 'unverified'},
        ${nidUrl}, ${passportUrl}, ${tradeLicenseUrl}
      )
      ON CONFLICT (user_id)
      DO UPDATE SET email = EXCLUDED.email,
                    phone = COALESCE(EXCLUDED.phone, profiles.phone),
                    phone_digits = COALESCE(EXCLUDED.phone_digits, profiles.phone_digits),
                    phone_verified = profiles.phone_verified OR EXCLUDED.phone_verified,
                    role = COALESCE(EXCLUDED.role, profiles.role),
                    business_name = COALESCE(EXCLUDED.business_name, profiles.business_name),
                    business_website = CASE WHEN ${body.businessWebsite !== undefined}
                                       THEN EXCLUDED.business_website
                                       ELSE profiles.business_website END,
                    pickup_address = COALESCE(EXCLUDED.pickup_address, profiles.pickup_address),
                    address = COALESCE(EXCLUDED.address, profiles.address),
                    address_visible = CASE WHEN ${body.addressVisible !== undefined}
                                      THEN EXCLUDED.address_visible
                                      ELSE profiles.address_visible END,
                    category = COALESCE(EXCLUDED.category, profiles.category),
                    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
                    verification_status = CASE WHEN ${!!body.verificationDocument}
                                          THEN 'pending' ELSE profiles.verification_status END,
                    nid_url = COALESCE(EXCLUDED.nid_url, profiles.nid_url),
                    passport_url = COALESCE(EXCLUDED.passport_url, profiles.passport_url),
                    trade_license_url = COALESCE(EXCLUDED.trade_license_url, profiles.trade_license_url),
                    updated_at = now()
      RETURNING user_id
    )
    , updated_orders AS (
      UPDATE orders SET customer_phone_verified = ${body.phoneVerified === true}
      WHERE user_id = ${user.id} AND from_chat = true AND ${body.phoneVerified !== undefined}
    )
    SELECT pg_current_xact_id()::text AS txid FROM p`
  return Response.json({ kind: 'committed', txid: row?.txid ?? null })
}
