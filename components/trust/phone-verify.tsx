'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useStore } from '@/lib/store'
import { useLang, interpolate } from '@/lib/i18n'
import { sendOtp, verifyOtp } from '@/lib/otp-client'
import { cn } from '@/lib/utils'

type Step = 'phone' | 'code' | 'done'

export function PhoneVerifyButton({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'default' }) {
  const { state } = useStore()
  const { t } = useLang()
  const [open, setOpen] = useState(false)

  return (
    <>
      {state.phoneVerified ? (
        <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-primary', className)}>
          <CheckCircle2 className="size-4" aria-hidden />
          {t('phone.verified')}
        </span>
      ) : (
        <Button type="button" variant="outline" size={size} className={className} onClick={() => setOpen(true)}>
          <Smartphone aria-hidden />
          {t('phone.verify')}
        </Button>
      )}
      <PhoneVerifyModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function PhoneVerifyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useStore()
  const { t } = useLang()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState(state.phone ?? '+880 ')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (!cooldown) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const close = () => {
    onClose()
    setTimeout(() => {
      setStep('phone')
      setCode('')
      setError(null)
    }, 200)
  }

  const doSend = async () => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 11) {
      setError(t('phone.invalid'))
      return
    }
    setError(null)
    setBusy(true)
    try {
      const { devCode } = await sendOtp(phone)
      setStep('code')
      setCode('')
      setCooldown(30)
      if (devCode) {
        toast(interpolate(t('phone.smsTo'), { phone }), {
          description: `Your Tokio verification code is ${devCode}`,
          duration: 30_000,
        })
      } else {
        toast(interpolate(t('phone.smsTo'), { phone }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('phone.fail'))
    } finally {
      setBusy(false)
    }
  }

  const sendCode = (e: FormEvent) => {
    e.preventDefault()
    doSend()
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await verifyOtp(phone, code)
      await actions.verifyPhone(phone)
      setStep('done')
      toast.success(t('phone.done'), { description: t('phone.toastDesc') })
    } catch (err) {
      setError(err instanceof Error ? err.message : t('phone.fail'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('phone.title')}
      description={t('phone.desc')}
    >
      {step === 'phone' && (
        <form onSubmit={sendCode} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="otp-phone" className="text-sm font-medium">
              {t('phone.mobile')}
            </label>
            <input
              id="otp-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'otp-phone-error' : undefined}
              placeholder="+880 1712-345678"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
            {error && (
              <p id="otp-phone-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden />}
            {t('phone.sendCode')}
          </Button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={verify} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">
            {t('phone.codeSent')}{' '}
            <span className="font-medium text-foreground">{phone}</span>.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="otp-code" className="text-sm font-medium">
              {t('phone.code')}
            </label>
            <input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''))
                setError(null)
              }}
              aria-invalid={!!error}
              aria-describedby="otp-code-hint"
              className="h-12 w-full rounded-lg border border-input bg-background px-3 text-center font-mono text-xl tracking-[0.5em]"
              autoFocus
            />
            <p id="otp-code-hint" className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
              {error ?? t('phone.enterCode')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={doSend} disabled={busy || cooldown > 0}>
              {cooldown > 0 ? `${t('phone.resendIn')} ${cooldown}s` : t('phone.resend')}
            </Button>
            <Button type="submit" className="flex-1" disabled={busy || code.length !== 4}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              {t('phone.verifyBtn')}
            </Button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center gap-3 py-4 text-center" role="status">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
            <ShieldCheck className="size-7" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">{t('phone.done')}</p>
            <p className="text-sm text-muted-foreground">
              {interpolate(t('phone.doneDesc'), { phone })}
            </p>
          </div>
          <Button type="button" onClick={close} className="mt-2">
            {t('phone.doneBtn')}
          </Button>
        </div>
      )}
    </Modal>
  )
}
