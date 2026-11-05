'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { ArrowLeft, Loader2, Mail, MailCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useLang, interpolate } from '@/lib/i18n'
import { IconField } from './field'

type Status = 'idle' | 'sent' | 'error'

export function ForgotPasswordForm() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const client = authClient as unknown as {
        requestPasswordReset?: (a: { email: string; redirectTo: string }) => Promise<{ error?: { message?: string } | null }>
        forgetPassword?: (a: { email: string; redirectTo: string }) => Promise<{ error?: { message?: string } | null }>
      }
      const fn = client.requestPasswordReset ?? client.forgetPassword
      if (!fn) throw new Error(t('auth.reset.disabled'))
      const { error } = await fn({
        email: email.trim(),
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw new Error(error.message ?? t('auth.reset.fail'))
      setStatus('sent')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.somethingWrong'))
      setStatus('error')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <p className="font-semibold">{t('auth.reset.sent')}</p>
        <p className="text-sm text-muted-foreground">
          {interpolate(t('auth.reset.sentDesc'), { email })}
        </p>
        <Link
          href="/auth/sign-in"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('auth.backToSignIn')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link
        href="/auth/sign-in"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t('auth.backToSignIn')}
      </Link>
      <p className="text-sm text-muted-foreground">{t('auth.reset.sub')}</p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="fp-email" className="text-sm font-medium">
            {t('auth.email')}
          </label>
          <IconField
            id="fp-email"
            icon={Mail}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.email.ph')}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {t('auth.reset.send')}
        </button>
      </form>
    </div>
  )
}
