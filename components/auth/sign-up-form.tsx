'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Smartphone,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { CATEGORIES } from '@/lib/constants'
import { useLang, interpolate } from '@/lib/i18n'
import { sendOtp, verifyOtp } from '@/lib/otp-client'
import type { AuthRole } from './auth-frame'
import { IconField, PasswordField } from './field'

const bdDigits = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d.startsWith('880') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d
}
const isBdPhone = (v: string) => /^1[3-9]\d{8}$/.test(bdDigits(v))

const saveProfile = (body: Record<string, unknown>) =>
  fetch('/api/profile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

export function SignUpForm({ role }: { role: AuthRole }) {
  const { t } = useLang()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitShopper = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const name = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!name) {
      setError(t('auth.enterName'))
      return
    }
    setBusy(true)
    const { error } = await authClient.signUp.email({ name, email: email.trim(), password })
    if (error) {
      setError(error.message ?? t('auth.signUpFailed'))
      setBusy(false)
      return
    }
    await saveProfile({ role: 'shopper' }).catch(() => {})
    window.location.href = '/onboarding'
  }

  return role === 'merchant' ? (
    <MerchantFields />
  ) : (
    <form onSubmit={submitShopper} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="su-first" className="text-sm font-medium">
            {t('auth.firstName')}
          </label>
          <IconField
            id="su-first"
            icon={User}
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t('auth.firstName.ph')}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="su-last" className="text-sm font-medium">
            {t('auth.lastName')}
          </label>
          <IconField
            id="su-last"
            icon={User}
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t('auth.lastName.ph')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="su-email" className="text-sm font-medium">
          {t('auth.email')}
        </label>
        <IconField
          id="su-email"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('auth.email.ph')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="su-password" className="text-sm font-medium">
          {t('auth.password')}
        </label>
        <PasswordField
          id="su-password"
          icon={Lock}
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.passwordHint')}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !firstName.trim() || !email.trim() || password.length < 6}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t('auth.createAccount')}
      </button>
    </form>
  )
}

function MerchantFields() {
  const { t } = useLang()
  const [businessName, setBusinessName] = useState('')
  const [yourName, setYourName] = useState('')
  const [phone, setPhone] = useState('+880 ')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [category, setCategory] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Inline phone verification
  const [codeSent, setCodeSent] = useState(false)
  const [sentCode, setSentCode] = useState('')
  const [code, setCode] = useState(['', '', '', ''])
  const [verified, setVerified] = useState(false)
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
      setError(null)
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
      setError(err instanceof Error ? err.message : 'Could not send the code')
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
    setError(null)
  }

  const onDigitKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) codeRefs.current[i - 1]?.focus()
  }

  const verify = async () => {
    if (sentCode && code.join('') !== sentCode) {
      setError(t('m.codeMismatch'))
      return
    }
    try {
      await verifyOtp(phone, code.join(''))
      setVerified(true)
      setCodeSent(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('m.codeMismatch'))
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!category) {
      setError(t('m.chooseCategory'))
      return
    }
    setBusy(true)
    const { error } = await authClient.signUp.email({
      name: yourName.trim() || businessName.trim(),
      email: email.trim(),
      password,
    })
    if (error) {
      setError(error.message ?? t('auth.signUpFailed'))
      setBusy(false)
      return
    }
    await saveProfile({
      role: 'merchant',
      businessName: businessName.trim(),
      businessWebsite: website.trim() || null,
      pickupAddress: pickupAddress.trim(),
      category,
      phone,
      phoneVerified: verified,
    }).catch(() => {})
    window.location.href = '/'
  }

  const canSubmit =
    businessName.trim() &&
    yourName.trim() &&
    isBdPhone(phone) &&
    email.trim() &&
    pickupAddress.trim() &&
    category &&
    password.length >= 6

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="m-business" className="text-sm font-medium">
          {t('m.business')}
        </label>
        <IconField
          id="m-business"
          icon={Building2}
          required
          autoComplete="organization"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder={t('m.business.ph')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="m-name" className="text-sm font-medium">
          {t('m.yourName')}
        </label>
        <IconField
          id="m-name"
          icon={User}
          required
          autoComplete="name"
          value={yourName}
          onChange={(e) => setYourName(e.target.value)}
          placeholder={t('m.yourName.ph')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="m-phone" className="text-sm font-medium">
          {t('m.phone')}
        </label>
        <div className="flex gap-2">
          <IconField
            id="m-phone"
            icon={Smartphone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            disabled={verified}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              setVerified(false)
            }}
            placeholder={t('m.phone.ph')}
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
            <p className="text-xs text-muted-foreground">{t('ob.resendIn')} {cooldown}s</p>
          ) : (
            <button type="button" onClick={sendCode} className="text-xs font-medium text-primary hover:underline">
              {t('m.resendCode')}
            </button>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="m-email" className="text-sm font-medium">
          {t('auth.email')}
        </label>
        <IconField
          id="m-email"
          icon={Mail}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contact@yourbusiness.com"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="m-website" className="text-sm font-medium">
          {t('m.website')} <span className="font-normal text-muted-foreground">({t('m.optional')})</span>
        </label>
        <IconField
          id="m-website"
          icon={Globe}
          type="url"
          inputMode="url"
          autoComplete="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder={t('m.website.ph')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="m-pickup" className="text-sm font-medium">
          {t('m.pickup')}
        </label>
        <IconField
          id="m-pickup"
          icon={MapPin}
          required
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
          placeholder={t('m.pickup.ph')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="m-category" className="text-sm font-medium">
          {t('m.category')}
        </label>
        <div className="relative">
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <select
            id="m-category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-9 text-[15px]"
          >
            <option value="" disabled>
              {t('m.category.ph')}
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="m-password" className="text-sm font-medium">
          {t('auth.password')}
        </label>
        <PasswordField
          id="m-password"
          icon={Lock}
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.passwordHint')}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !canSubmit}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t('m.create')}
      </button>
    </form>
  )
}
