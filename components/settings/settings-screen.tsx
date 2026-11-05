'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Loader2, Lock, MapPin, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { PhoneBadge } from '@/components/shared/badges'
import { Button } from '@/components/ui/button'

export function SettingsScreen() {
  const { state, actions, user } = useStore()
  const { t } = useLang()
  const isMerchant = state.accountRole === 'merchant'
  const savedAddress = (isMerchant ? state.pickupAddress : state.address) ?? ''
  const [address, setAddress] = useState(savedAddress)
  const [savingAddress, setSavingAddress] = useState(false)
  const [toggling, setToggling] = useState(false)

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
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">
              {initials}
            </span>
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
