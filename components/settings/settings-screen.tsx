'use client'

import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Image from 'next/image'
import { Camera, Eye, EyeOff, FileCheck, Loader2, Lock, MapPin, PackagePlus, Smartphone, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { PhoneBadge } from '@/components/shared/badges'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export function SettingsScreen() {
  const { state, actions, user } = useStore()
  const { t } = useLang()
  const isMerchant = state.accountRole === 'merchant'
  const savedAddress = (isMerchant ? state.pickupAddress : state.address) ?? ''
  const [address, setAddress] = useState(savedAddress)
  const [savingAddress, setSavingAddress] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAddress(savedAddress)
  }, [savedAddress])

  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const saveAddress = async () => {
    setSavingAddress(true)
    try {
      await actions.updateProfile(
        isMerchant ? { pickupAddress: address.trim() } : { address: address.trim() },
      )
      toast.success(t('settings.saved'))
    } catch (e) {
      toast.error(t('settings.saveFail'), {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSavingAddress(false)
    }
  }

  const toggleVisible = async () => {
    setToggling(true)
    try {
      await actions.updateProfile({ addressVisible: !state.addressVisible })
    } catch (e) {
      toast.error(t('settings.saveFail'), {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setToggling(false)
    }
  }

  const upload = async (event: ChangeEvent<HTMLInputElement>, kind: 'avatar' | 'nid' | 'passport' | 'tradeLicense') => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(kind)
    try {
      const url = await actions.uploadImage(file)
      if (kind === 'avatar') {
        await Promise.all([actions.updateProfile({ avatarUrl: url }), authClient.updateUser({ image: url })])
      } else {
        await actions.updateProfile({ verificationDocument: { type: kind, url } })
      }
      toast.success(kind === 'avatar' ? 'Profile photo saved' : 'Document uploaded for review')
    } catch (error) {
      toast.error('Upload failed', { description: error instanceof Error ? error.message : undefined })
    } finally {
      setUploading(null)
    }
  }

  const addProduct = async () => {
    try {
      await actions.addProduct({ name: productName.trim(), price: Number(productPrice) })
      setProductName('')
      setProductPrice('')
      toast.success('Product added')
    } catch (error) {
      toast.error('Could not add product', { description: error instanceof Error ? error.message : undefined })
    }
  }

  const clearAll = () => {
    if (!window.confirm(t('nav.clearConfirm'))) return
    actions.clearAll().then(() => toast.success(t('nav.cleared'))).catch((error) => toast.error(t('nav.clearFail'), { description: error.message }))
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{t('settings.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('settings.sub')}</p>
        </header>

        <section aria-labelledby="settings-profile" className="rounded-2xl border bg-card p-4">
          <h2 id="settings-profile" className="font-semibold">
            {t('settings.profile')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('settings.profileDesc')}</p>
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={() => photoRef.current?.click()} className="group relative size-14 shrink-0 overflow-hidden rounded-full bg-muted" aria-label="Upload profile photo">
              {state.avatarUrl ? <Image src={state.avatarUrl} alt="" fill unoptimized className="object-cover" /> : <span className="grid size-full place-items-center text-sm font-semibold">{initials}</span>}
              <span className="absolute right-0 top-0 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow"><Camera className="size-3.5" /></span>
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="sr-only" onChange={(event) => upload(event, 'avatar')} />
            <div className="min-w-0">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5 border-t pt-4 text-sm">
            <li className="flex items-center gap-2.5">
              <Smartphone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{state.phone ?? '—'}</span>
              <PhoneBadge verified={state.phoneVerified} />
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              {state.addressVisible && savedAddress ? (
                <>
                  <span className="min-w-0 flex-1 truncate">{savedAddress}</span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    <Eye className="size-3.5" aria-hidden />
                    {t('settings.addressShown')}
                  </span>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">
                    {savedAddress ? t('settings.addressHidden') : t('settings.noAddress')}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <EyeOff className="size-3.5" aria-hidden />
                    {t('settings.hidden')}
                  </span>
                </>
              )}
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border bg-card p-4">
          <h2 className="flex items-center gap-2 font-semibold"><FileCheck className="size-4 text-primary" />Identity verification</h2>
          <p className="mt-1 text-xs text-muted-foreground">Uploaded documents remain pending until reviewed. Verification badges appear only after approval.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(isMerchant ? [['tradeLicense', 'Trade licence', state.tradeLicenseUrl], ['nid', 'NID', state.nidUrl]] : [['nid', 'NID', state.nidUrl], ['passport', 'Passport', state.passportUrl]]).map(([kind, label, value]) => (
              <label key={kind} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm hover:border-primary/50">
                <span><span className="block font-medium">{label}</span><span className="text-xs text-muted-foreground">{value ? 'Pending review' : 'Not uploaded'}</span></span>
                {uploading === kind ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4 text-muted-foreground" />}
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => upload(event, kind as 'nid' | 'passport' | 'tradeLicense')} />
              </label>
            ))}
          </div>
        </section>

        {isMerchant && <section className="rounded-2xl border bg-card p-4">
          <h2 className="flex items-center gap-2 font-semibold"><PackagePlus className="size-4 text-primary" />Products</h2>
          <p className="text-xs text-muted-foreground">Products you add appear in shopper conversations and can be shared in chat.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
            <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Product name" className="h-10 rounded-lg border bg-background px-3 text-sm" />
            <input value={productPrice} onChange={(event) => setProductPrice(event.target.value)} type="number" min="1" placeholder="Price" className="h-10 rounded-lg border bg-background px-3 text-sm" />
            <Button type="button" onClick={addProduct} disabled={!productName.trim() || Number(productPrice) <= 0}>Add</Button>
          </div>
          {state.products.length > 0 && <ul className="mt-3 divide-y rounded-xl border">{state.products.map((product) => <li key={product.id} className="flex justify-between px-3 py-2 text-sm"><span>{product.name}</span><span className="font-medium">৳{product.price}</span></li>)}</ul>}
        </section>}

        <section className="rounded-2xl border border-destructive/30 bg-card p-4">
          <h2 className="font-semibold">Data</h2>
          <p className="mb-3 text-xs text-muted-foreground">Clear your messages, orders, and reviews.</p>
          <Button type="button" variant="outline" onClick={clearAll}><Trash2 className="size-4" />{t('nav.clearData')}</Button>
        </section>

        <section aria-labelledby="settings-privacy" className="rounded-2xl border bg-card p-4">
          <h2 id="settings-privacy" className="flex items-center gap-2 font-semibold">
            <Lock className="size-4 text-primary" aria-hidden />
            {t('settings.privacy')}
          </h2>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t('settings.showAddress')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t('settings.showAddressDesc')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state.addressVisible}
              aria-label={t('settings.showAddress')}
              disabled={toggling}
              onClick={toggleVisible}
              className={cn(
                'relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50',
                state.addressVisible ? 'bg-primary' : 'bg-input',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform',
                  state.addressVisible && 'translate-x-4',
                )}
              />
            </button>
          </div>
        </section>

        <section aria-labelledby="settings-address" className="rounded-2xl border bg-card p-4">
          <h2 id="settings-address" className="font-semibold">
            {isMerchant ? t('settings.addressBiz') : t('settings.address')}
          </h2>
          <div className="mt-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="settings-address-input"
                type="text"
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('settings.address.ph')}
                aria-label={isMerchant ? t('settings.addressBiz') : t('settings.address')}
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="button"
              onClick={saveAddress}
              disabled={savingAddress || !address.trim() || address.trim() === savedAddress}
            >
              {savingAddress && <Loader2 className="animate-spin" aria-hidden />}
              {t('settings.save')}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t('settings.addressHint')}</p>
        </section>
      </div>
    </div>
  )
}
