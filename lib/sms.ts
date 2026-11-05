// Sends SMS via Twilio's REST API. No SDK needed — plain fetch.
// Required env vars:
//   TWILIO_ACCOUNT_SID   (ACxxxxxxxx — Twilio Console → Account Info)
//   TWILIO_AUTH_TOKEN    (Twilio Console → Account Info → Auth Token)
//   TWILIO_PHONE_NUMBER  (+1xxxxxxxxxx — your purchased Twilio number)
//   …or TWILIO_MESSAGING_SERVICE_SID (MGxxxxxxxx) instead of a number
// Trial accounts can only text numbers verified in the Twilio Console.

export function twilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID),
  )
}

export async function sendSms(toE164: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return { sent: false as const, reason: 'not-configured' }

  const params = new URLSearchParams({ To: toE164, Body: body })
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    params.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID)
  } else {
    params.set('From', process.env.TWILIO_PHONE_NUMBER!)
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      },
      body: params,
      cache: 'no-store',
    },
  )
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    return { sent: false as const, reason: detail?.message ?? `twilio ${res.status}` }
  }
  return { sent: true as const }
}
