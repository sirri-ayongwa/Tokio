'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { BrandMark } from '@/components/app-shell'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { useLang, interpolate } from '@/lib/i18n'
import { sendOtp, verifyOtp } from '@/lib/otp-client'
import { cn } from '@/lib/utils'

type Step = 'photo' | 'phone' | 'code'

const bdDigits = (v: string) => {
  const d = v.replace(/\D/g, '')
  return d.startsWith('880') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d
}
const isBdPhone = (v: string) => /^1[3-9]\d{8}$/.test(bdDigits(v))

export function OnboardingFlow({ userName }: { userName: string }) {
  const { t } = useLang()
  const [step, setStep] = useState<Step>('photo')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [phone, setPhone] = useState('+880 ')
  const [sentCode, setSentCode] = useState('')
  const [code, setCode] = useState(['', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [skipOpen, setSkipOpen] = useState(false)
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!cooldown) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const done = () => {
    try {
      window.localStorage.setItem('tokio-onboarded', '1')
    } catch {}
    window.location.href = '/'
  }

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file')
      return
    }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const res = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, ext }),
      })
      const { uploadUrl, publicUrl } = await res.json()
      if (!res.ok) throw new Error('Could not prepare upload')
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type },
        body: file,
      })
      if (!put.ok) throw new Error('Upload failed')
      setPhotoUrl(publicUrl as string)
      await authClient.updateUser({ image: publicUrl }).catch(() => {})
    } catch (err) {
      toast.error('Photo upload failed', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setUploading(false)
    }
  }

  const sendCode = async () => {
    try {
      const { devCode } = await sendOtp(phone)
      setSentCode(devCode ?? '')
      setCode(['', '', '', ''])
      setCooldown(30)
      setError(null)
      if (devCode) {
        toast(interpolate(t('phone.smsTo'), { phone }), {
          description: `Your Tokio verification code is ${devCode}`,
          duration: 30_000,
        })
      } else {
        toast(interpolate(t('phone.smsTo'), { phone }), {
          description: t('phone.enterCode'),
        })
      }
      setStep('code')
      setTimeout(() => codeRefs.current[0]?.focus(), 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the code')
    }
  }

  const onCodeDigit = (i: number, v: string) => {
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

  const onCodeKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) codeRefs.current[i - 1]?.focus()
  }

  const onCodePaste = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!digits) return
    e.preventDefault()
    setCode(digits.padEnd(4, '').split('').slice(0, 4))
    codeRefs.current[Math.min(digits.length, 3)]?.focus()
  }

  const verify = async () => {
    if (sentCode && code.join('') !== sentCode) {
      setError(t('m.codeMismatch'))
      return
    }
    setBusy(true)
    try {
      await verifyOtp(phone, code.join(''))
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, phoneVerified: true }),
      })
      if (!res.ok) throw new Error(t('ob.saveFail'))
      toast.success(t('ob.verifiedToast'), { description: t('ob.verifiedToastDesc') })
      done()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ob.verifyFail'))
      setBusy(false)
    }
  }

  const initials = userName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12 rounded-2xl" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('ob.welcome')}, {userName.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 'photo' ? t('ob.step1') : t('ob.step2')}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-xs">
          {step === 'photo' && (
            <div className="flex flex-col items-center gap-5 py-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="group relative grid size-28 place-items-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-primary/50"
              >
                {uploading ? (
                  <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
                ) : photoUrl ? (
                  <>
                    <Image
                      src={photoUrl}
                      alt="Your profile photo"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="size-6 text-white" aria-hidden />
                    </span>
                  </>
                ) : (
                  <span className="flex flex-col items-center gap-1 text-muted-foreground">
                    {initials ? (
                      <span className="text-2xl font-semibold">{initials}</span>
                    ) : (
                      <ImagePlus className="size-8" aria-hidden />
                    )}
                    <span className="text-xs">{t('ob.addPhoto')}</span>
                  </span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="sr-only" />
              <p className="text-center text-sm text-muted-foreground">{t('ob.photoHint')}</p>
              <div className="flex w-full gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('phone')}>
                  {t('ob.skip')}
                </Button>
                <Button type="button" className="flex-1" onClick={() => setStep('phone')} disabled={uploading}>
                  {t('ob.continue')}
                </Button>
              </div>
            </div>
          )}

          {step === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="ob-phone" className="text-sm font-medium">
                  {t('m.phone')}
                </label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="ob-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setError(null)
                    }}
                    placeholder={t('m.phone.ph')}
                    className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-[15px] placeholder:text-muted-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('ob.phoneHint')}</p>
              </div>
              {isBdPhone(phone) && (
                <button
                  type="button"
                  onClick={sendCode}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t('m.sendCode')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setSkipOpen(true)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                {t('ob.skipNow')}
              </button>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('ob.codeHint')}{' '}
                <span className="font-medium text-foreground">{phone}</span>
              </p>
              <div className="flex justify-center gap-2" onPaste={onCodePaste}>
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      codeRefs.current[i] = el
                    }}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => onCodeDigit(i, e.target.value)}
                    onKeyDown={(e) => onCodeKeyDown(i, e)}
                    aria-label={`Digit ${i + 1}`}
                    className="size-12 rounded-lg border border-input bg-background text-center font-mono text-xl"
                  />
                ))}
              </div>
              {error && (
                <p className="text-center text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={verify}
                disabled={busy || code.join('').length !== 4}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {t('ob.verify')}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                {cooldown > 0 ? (
                  <>{t('ob.resendIn')} {cooldown}s</>
                ) : (
                  <button type="button" onClick={sendCode} className="font-medium text-primary hover:underline">
                    {t('ob.resendCode')}
                  </button>
                )}
              </p>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                {t('ob.changeNumber')}
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 Tokio. All rights reserved.
        </p>
      </div>

      <Modal
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        title={t('ob.skipTitle')}
        description={t('ob.skipDesc')}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSkipOpen(false)}>
              {t('ob.cancel')}
            </Button>
            <Button type="button" variant="ghost" onClick={done}>
              {t('ob.skip')}
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <p>{t('ob.skipBody')}</p>
        </div>
      </Modal>
    </div>
  )
}
