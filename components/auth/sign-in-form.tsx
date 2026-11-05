'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { Loader2, Lock, User } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useLang } from '@/lib/i18n'
import { IconField, PasswordField } from './field'

const bdDigits = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d.startsWith('880') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d
}
const isBdPhone = (v: string) => /^1[3-9]\d{8}$/.test(bdDigits(v))

export function SignInForm() {
  const { t } = useLang()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const id = identifier.trim()
    setBusy(true)
    try {
      let email = id
      if (isBdPhone(id)) {
        const res = await fetch('/api/phone-lookup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ phone: id }),
        })
        const data = await res.json()
        if (!res.ok || !data.email) {
          throw new Error(t('auth.noNumberAccount'))
        }
        email = data.email
      } else if (!id.includes('@')) {
        throw new Error(t('auth.enterId'))
      }
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe: keepSignedIn,
      })
      if (error) throw new Error(error.message ?? t('auth.signInFailed'))
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.signInFailed'))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="si-id" className="text-sm font-medium">
          {t('auth.emailOrPhone')}
        </label>
        <IconField
          id="si-id"
          icon={User}
          required
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={t('auth.emailOrPhone.ph')}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="si-password" className="text-sm font-medium">
          {t('auth.password')}
        </label>
        <PasswordField
          id="si-password"
          icon={Lock}
          required
          minLength={6}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('auth.password.ph')}
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
            className="size-4 rounded border-input accent-primary"
          />
          {t('auth.keepSignedIn')}
        </label>
        <Link
          href="/auth/forgot-password"
          className="text-sm font-medium text-primary hover:underline"
        >
          {t('auth.forgot')}
        </Link>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !identifier.trim() || password.length < 6}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {t('auth.signIn')}
      </button>
    </form>
  )
}
