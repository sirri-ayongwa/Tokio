import crypto from 'crypto'
import { ensureSchema, sqlDirect } from '@/lib/db'
import { sendSms, twilioConfigured } from '@/lib/sms'

const bdLocal = (v: string) => {
  const d = (v ?? '').replace(/\D/g, '')
  return d.startsWith('880') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d
}

export async function POST(request: Request) {
  const { phone } = (await request.json()) as { phone?: string }
  const local = bdLocal(phone ?? '')
  if (!/^1[3-9]\d{8}$/.test(local)) {
    return Response.json({ error: 'Enter a valid Bangladeshi mobile number.' }, { status: 400 })
  }

  const code = String(crypto.randomInt(1000, 9999))
  const digits = `880${local}`

  await ensureSchema()
  await sqlDirect`
    INSERT INTO otp_codes (phone_digits, code, expires_at)
    VALUES (${digits}, ${code}, now() + interval '5 minutes')
    ON CONFLICT (phone_digits)
    DO UPDATE SET code = EXCLUDED.code, attempts = 0, expires_at = EXCLUDED.expires_at`

  if (!twilioConfigured()) {
    // No SMS provider yet — return the code so the app stays testable.
    return Response.json({ sent: false, devCode: code })
  }

  const { sent, reason } = await sendSms(`+${digits}`, `Your Tokio verification code is ${code}`)
  if (!sent) {
    return Response.json(
      { error: `Could not send SMS (${reason}). Try again or check the number.` },
      { status: 502 },
    )
  }
  return Response.json({ sent: true })
}
