// Client helpers for the server-side SMS OTP endpoints.

export async function sendOtp(phone: string): Promise<{ devCode?: string }> {
  const res = await fetch('/api/otp/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Could not send the code')
  return data
}

export async function verifyOtp(phone: string, code: string): Promise<void> {
  const res = await fetch('/api/otp/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Verification failed')
}
