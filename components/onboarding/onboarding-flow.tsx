'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { BrandMark } from '@/components/app-shell'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { useLang } from '@/lib/i18n'

type Step = 'photo' | 'address'

export function OnboardingFlow({ userName }: { userName: string }) {
  const { t } = useLang()
  const [step, setStep] = useState<Step>('photo')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [skipOpen, setSkipOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Prefill the home address if one is already saved.
  useEffect(() => {
    fetch('/api/profile')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const p = data?.profile
        if (p?.address) setAddress(p.address)
      })
      .catch(() => {})
  }, [])

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

  const saveAddress = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      })
      if (!res.ok) throw new Error(t('ob.saveFail'))
      toast.success(t('ob.savedToast'), { description: t('ob.savedToastDesc') })
      done()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('ob.saveFail'))
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
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('address')}>
                  {t('ob.skip')}
                </Button>
                <Button type="button" className="flex-1" onClick={() => setStep('address')} disabled={uploading}>
                  {t('ob.continue')}
                </Button>
              </div>
            </div>
          )}

          {step === 'address' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="ob-address" className="text-sm font-medium">
                  {t('ob.address')}
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="ob-address"
                    type="text"
                    autoComplete="street-address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      setError(null)
                    }}
                    placeholder={t('ob.address.ph')}
                    className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-[15px] placeholder:text-muted-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('ob.addressHint')}</p>
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={saveAddress}
                disabled={busy || !address.trim()}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {t('ob.continue')}
              </button>
              <button
                type="button"
                onClick={() => setSkipOpen(true)}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                {t('ob.skipNow')}
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
