'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { useLang, interpolate } from '@/lib/i18n'
import { sendOtp, verifyOtp } from '@/lib/otp-client'
import { IconField } from './field'

const bdDigits = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d.startsWith('880') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d
}
export const isBdPhone = (v: string) => /^1[3-9]\d{8}$/.test(bdDigits(v))

export function PhoneVerifyField({
  id,
  label,
  placeholder,
  phone,
  onPhoneChange,
  verified,
  onVerifiedChange,
  onError,
}: {
  id: string
  label: string
  placeholder: string
  phone: string
  onPhoneChange: (v: string) => void
  verified: boolean
  onVerifiedChange: (v: boolean) => void
  onError: (msg: string | null) => void
}) {
  const { t } = useLang()
  const [codeSent, setCodeSent] = useState(false)
  const [sentCode, setSentCode] = useState('')
  const [code, setCode] = useState(['', '', '', ''])
  const [cooldown, setCooldown] = useState(0)
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!cooldown) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const sendCode = async () => {
    try {
      const { devCode } = await sendOtp(phone)
      setSentCode(devCode ?? '')
      setCode(['', '', '', ''])
      setCooldown(30)
      setCodeSent(true)
      onError(null)
      if (devCode) {
        toast(interpolate(t('phone.smsTo'), { phone }), {
          description: `Your Tokio verification code is ${devCode}`,
          duration: 30_000,
        })
      } else {
        toast(interpolate(t('phone.smsTo'), { phone }))
      }
      setTimeout(() => codeRefs.current[0]?.focus(), 50)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not send the code')
    }
  }

  const onDigit = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1)
    setCode((c) => {
      const next = [...c]
      next[i] = digit
      return next
    })
    if (digit && i < 3) codeRefs.current[i + 1]?.focus()
    if (!digit && i > 0) codeRefs.current[i - 1]?.focus()
    onError(null)
  }

  const onDigitKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) codeRefs.current[i - 1]?.focus()
  }

  const verify = async () => {
    if (sentCode && code.join('') !== sentCode) {
      onError(t('m.codeMismatch'))
      return
    }
    try {
      await verifyOtp(phone, code.join(''))
      onVerifiedChange(true)
      setCodeSent(false)
      onError(null)
    } catch (err) {
      onError(err instanceof Error ? err.message : t('m.codeMismatch'))
    }
  }

  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="flex gap-2">
          <IconField
            id={id}
            icon={Smartphone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            disabled={verified}
            value={phone}
            onChange={(e) => {
              onPhoneChange(e.target.value)
              onVerifiedChange(false)
            }}
            placeholder={placeholder}
            className="flex-1"
          />
          {verified ? (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-accent px-3 text-sm font-medium text-primary">
              <CheckCircle2 className="size-4" aria-hidden />
              {t('m.verified')}
            </span>
          ) : (
            isBdPhone(phone) && (
              <button
                type="button"
                onClick={sendCode}
                className="h-11 shrink-0 rounded-lg border border-primary/30 px-3 text-sm font-medium text-primary hover:bg-accent"
              >
                {codeSent && cooldown > 0 ? `${t('m.resendIn')} (${cooldown}s)` : t('m.sendCode')}
              </button>
            )
          )}
        </div>
      </div>

      {codeSent && !verified && (
        <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">
            {t('m.codeHint')} <span className="font-medium text-foreground">{phone}</span>
          </p>
          <div className="flex items-center gap-2">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  codeRefs.current[i] = el
                }}
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => onDigit(i, e.target.value)}
                onKeyDown={(e) => onDigitKeyDown(i, e)}
                aria-label={`Digit ${i + 1}`}
                className="size-10 rounded-lg border border-input bg-background text-center font-mono text-lg"
              />
            ))}
            <button
              type="button"
              onClick={verify}
              disabled={code.join('').length !== 4}
              className="ml-auto h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {t('m.verify')}
            </button>
          </div>
          {cooldown > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t('ob.resendIn')} {cooldown}s
            </p>
          ) : (
            <button
              type="button"
              onClick={sendCode}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t('m.resendCode')}
            </button>
          )}
        </div>
      )}
    </>
  )
}
