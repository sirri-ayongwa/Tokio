import { ensureSchema, sqlDirect } from '@/lib/db'

const bdLocal = (v: string) => {
  const d = (v ?? '').replace(/\D/g, '')
  return d.startsWith('880') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d
}

export async function POST(request: Request) {
  const { phone, code } = (await request.json()) as { phone?: string; code?: string }
  const local = bdLocal(phone ?? '')
  const digits = `880${local}`
  if (!local || !code) {
    return Response.json({ error: 'Missing phone or code' }, { status: 400 })
  }

  await ensureSchema()
  const [row] = await sqlDirect`
    UPDATE otp_codes SET attempts = attempts + 1
    WHERE phone_digits = ${digits}
    RETURNING code, attempts, expires_at`

  if (!row) return Response.json({ error: 'No code was sent to this number.' }, { status: 400 })
  if (row.attempts > 5) {
    return Response.json({ error: 'Too many tries — request a new code.' }, { status: 429 })
  }
  if (new Date(row.expires_at) < new Date()) {
    return Response.json({ error: 'That code has expired — request a new one.' }, { status: 400 })
  }
  if (row.code !== String(code)) {
    return Response.json({ error: 'That code doesn’t match the one we sent.' }, { status: 400 })
  }

  await sqlDirect`DELETE FROM otp_codes WHERE phone_digits = ${digits}`
  return Response.json({ ok: true })
}
