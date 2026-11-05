import { ensureSchema, sqlDirect } from '@/lib/db'

// Resolves a Bangladeshi phone number to an account email for the
// sign-in-with-number flow. Returns only the email, never other data.
export async function POST(request: Request) {
  const { phone } = (await request.json()) as { phone?: string }
  const raw = (phone ?? '').replace(/\D/g, '')
  const local = raw.startsWith('880') ? raw.slice(3) : raw.startsWith('0') ? raw.slice(1) : raw
  if (!/^1[3-9]\d{8}$/.test(local)) {
    return Response.json({ error: 'Invalid number' }, { status: 400 })
  }

  await ensureSchema()
  const variants = [local, `0${local}`, `880${local}`]
  const [row] = await sqlDirect`
    SELECT email FROM profiles
    WHERE phone_digits = ANY(${variants})
    LIMIT 1`
  if (!row?.email) return Response.json({ error: 'No account uses this number yet.' }, { status: 404 })
  return Response.json({ email: row.email })
}
