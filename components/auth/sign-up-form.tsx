'use client'

import { useState, type FormEvent } from 'react'
import {
  Building2,
  ChevronDown,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  User,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { CATEGORIES } from '@/lib/constants'
import { useLang } from '@/lib/i18n'
import type { AuthRole } from './auth-frame'
import { IconField, PasswordField } from './field'
import { isBdPhone, PhoneVerifyField } from './phone-verify-field'

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
  const [phone, setPhone] = useState('+880 ')
  const [phoneVerified, setPhoneVerified] = useState(false)
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
    try {
      const { error } = await authClient.signUp.email({ name, email: email.trim(), password })
      if (error) throw new Error(error.message ?? t('auth.signUpFailed'))
      await saveProfile({ role: 'shopper', phone, phoneVerified }).catch(() => {})
      window.location.href = '/onboarding'
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signUpFailed'))
      setBusy(false)
    }
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

      <PhoneVerifyField
        id="su-phone"
        label={t('m.phone')}
        placeholder={t('m.phone.ph')}
        phone={phone}
        onPhoneChange={setPhone}
        verified={phoneVerified}
        onVerifiedChange={setPhoneVerified}
        onError={setError}
      />

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
        disabled={busy || !firstName.trim() || !isBdPhone(phone) || !email.trim() || password.length < 6}
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
  const [verified, setVerified] = useState(false)
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!category || (category === 'Other' && !customCategory.trim())) {
      setError(t('m.chooseCategory'))
      return
    }
    setBusy(true)
    try {
      const { error } = await authClient.signUp.email({
        name: yourName.trim() || businessName.trim(),
        email: email.trim(),
        password,
      })
      if (error) throw new Error(error.message ?? t('auth.signUpFailed'))
      await saveProfile({
        role: 'merchant',
        businessName: businessName.trim(),
        businessWebsite: website.trim() || null,
        pickupAddress: pickupAddress.trim(),
        category: category === 'Other' ? customCategory.trim() : category,
        phone,
        phoneVerified: verified,
      }).catch(() => {})
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signUpFailed'))
      setBusy(false)
    }
  }

  const canSubmit =
    businessName.trim() &&
    yourName.trim() &&
    isBdPhone(phone) &&
    email.trim() &&
    pickupAddress.trim() &&
    category &&
    (category !== 'Other' || customCategory.trim()) &&
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

      <PhoneVerifyField
        id="m-phone"
        label={t('m.phone')}
        placeholder={t('m.phone.ph')}
        phone={phone}
        onPhoneChange={setPhone}
        verified={verified}
        onVerifiedChange={setVerified}
        onError={setError}
      />

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
        {category === 'Other' && (
          <IconField
            id="m-custom-category"
            icon={Building2}
            required
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder={t('m.category.other.ph')}
          />
        )}
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
