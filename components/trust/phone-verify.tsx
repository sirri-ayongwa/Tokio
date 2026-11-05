'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Loader2, ShieldCheck, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useStore } from '@/lib/store'
import { BUYER, DEMO_OTP } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

type Step = 'phone' | 'code' | 'done'

export function PhoneVerifyButton({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'default' }) {
  const { state } = useStore()
  const [open, setOpen] = useState(false)

  return (
    <>
      {state.phoneVerified ? (
        <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium text-primary', className)}>
          <CheckCircle2 className="size-4" aria-hidden />
          Phone verified
        </span>
      ) : (
        <Button type="button" variant="outline" size={size} className={className} onClick={() => setOpen(true)}>
          <Smartphone aria-hidden />
          Verify phone number
        </Button>
      )}
      <PhoneVerifyModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function PhoneVerifyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useStore()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState(BUYER.phone)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    onClose()
    setTimeout(() => {
      setStep('phone')
      setCode('')
      setError(null)
    }, 200)
  }

  const sendCode = (e: FormEvent) => {
    e.preventDefault()
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 11) {
      setError('Enter a valid Bangladeshi mobile number, e.g. +880 1712-345678.')
      return
    }
    setError(null)
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setStep('code')
    }, 700)
  }

  const verify = (e: FormEvent) => {
    e.preventDefault()
    if (code !== DEMO_OTP) {
      setError('That code doesn’t match. Use the demo code shown below.')
      return
    }
    setError(null)
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setStep('done')
      dispatch({ type: 'verifyPhone' })
      toast.success('Phone verified', { description: 'Sellers will now see a trusted-buyer badge.' })
    }, 600)
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Verify your phone number"
      description="Verified buyers help sellers avoid fake orders. Simulated — no SMS is sent."
    >
      {step === 'phone' && (
        <form onSubmit={sendCode} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="otp-phone" className="text-sm font-medium">
              Mobile number
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
            Send verification code
          </Button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={verify} className="space-y-4" noValidate>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-medium text-foreground">{phone}</span>.
          </p>
          <div className="space-y-1.5">
            <label htmlFor="otp-code" className="text-sm font-medium">
              Verification code
            </label>
            <input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              aria-invalid={!!error}
              aria-describedby="otp-code-hint"
              className="h-12 w-full rounded-lg border border-input bg-background px-3 text-center font-mono text-xl tracking-[0.5em]"
              autoFocus
            />
            <p id="otp-code-hint" className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
              {error ?? (
                <>
                  Demo code: <span className="font-mono font-semibold text-foreground">{DEMO_OTP}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setCode(DEMO_OTP)}>
              Autofill demo code
            </Button>
            <Button type="submit" className="flex-1" disabled={busy || code.length !== 6}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              Verify
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
            <p className="font-semibold">Phone verified</p>
            <p className="text-sm text-muted-foreground">{phone} is now linked to your OrderBridge profile.</p>
          </div>
          <Button type="button" onClick={close} className="mt-2">
            Done
          </Button>
        </div>
      )}
    </Modal>
  )
}
