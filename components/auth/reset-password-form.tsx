'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, Loader2, Lock } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useLang } from '@/lib/i18n'
import { PasswordField } from './field'

type Status = 'idle' | 'done' | 'error'

export function ResetPasswordForm() {
  const { t } = useLang()
  const params = useSearchParams()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<Status>(token ? 'idle' : 'error')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(token ? null : t('auth.reset.missing'))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t('auth.reset.mismatch'))
      return
    }
    setBusy(true)
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token: token! })
      if (error) throw new Error(error.message ?? t('auth.reset.failed'))
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.somethingWrong'))
    } finally {
      setBusy(false)
    }
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <p className="font-semibold">{t('auth.reset.updated')}</p>
        <p className="text-sm text-muted-foreground">{t('auth.reset.updatedDesc')}</p>
        <Link
          href="/auth/sign-in"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('auth.reset.go')}
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
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="rp-new" className="text-sm font-medium">
            {t('auth.newPassword')}
          </label>
          <PasswordField
            id="rp-new"
            icon={Lock}
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordHint')}
            disabled={!token}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="rp-confirm" className="text-sm font-medium">
            {t('auth.confirmPassword')}
          </label>
          <PasswordField
            id="rp-confirm"
            icon={Lock}
            required
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t('auth.passwordHint')}
            disabled={!token}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !token || password.length < 6}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {t('auth.reset.title')}
        </button>
      </form>
    </div>
  )
}
