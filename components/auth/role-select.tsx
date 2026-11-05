'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Languages, ShoppingBag, Store } from 'lucide-react'
import { BrandMark } from '@/components/app-shell'
import { TAGLINE } from '@/lib/constants'
import { getStoredLang, useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const SPLASH_MS = 5000

type Phase = 'splash' | 'lang' | 'roles'

export function RoleSelect() {
  const router = useRouter()
  const { lang, setLang, t } = useLang()

  // Also seed the conversation-language preference the store will load.
  const chooseLang = (l: 'en' | 'bn') => {
    setLang(l)
    try {
      const raw = window.localStorage.getItem('tokio-prefs-v1')
      const prefs = raw ? JSON.parse(raw) : {}
      window.localStorage.setItem('tokio-prefs-v1', JSON.stringify({ ...prefs, lang: l }))
    } catch {}
  }
  const [phase, setPhase] = useState<Phase | null>(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Splash once per browser session; language popup until a choice is stored.
    const seen = window.sessionStorage.getItem('tokio-splash-seen')
    if (!seen) setPhase('splash')
    else setPhase(getStoredLang() ? 'roles' : 'lang')
  }, [])

  useEffect(() => {
    if (phase !== 'splash') return
    const fade = setTimeout(() => setFading(true), SPLASH_MS - 500)
    const hide = setTimeout(() => {
      try {
        window.sessionStorage.setItem('tokio-splash-seen', '1')
      } catch {}
      setPhase(getStoredLang() ? 'roles' : 'lang')
    }, SPLASH_MS)
    return () => {
      clearTimeout(fade)
      clearTimeout(hide)
    }
  }, [phase])

  const pick = (role: 'shopper' | 'merchant') => router.push(`/auth/sign-in?role=${role}`)

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4">
      {/* Role select */}
      <div
        className={cn(
          'w-full max-w-md transition-opacity duration-500',
          phase !== 'roles' && 'opacity-0',
        )}
        aria-hidden={phase !== 'roles'}
      >
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12 rounded-2xl" />
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {t('role.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('role.subtitle')}</p>
          </div>
        </div>
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => pick('shopper')}
            className="group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-primary">
              <ShoppingBag className="size-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t('role.shopper.title')}</span>
              <span className="block text-sm text-muted-foreground">
                {t('role.shopper.desc')}
              </span>
            </span>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>
          <button
            type="button"
            onClick={() => pick('merchant')}
            className="group flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left shadow-xs transition-all hover:border-primary/50 hover:shadow-sm"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold-foreground">
              <Store className="size-6" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{t('role.merchant.title')}</span>
              <span className="block text-sm text-muted-foreground">
                {t('role.merchant.desc')}
              </span>
            </span>
            <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </button>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © 2026 Tokio. All rights reserved.
        </p>
      </div>

      {/* Language selection */}
      {phase === 'lang' && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-background px-4">
          <div className="w-full max-w-xs rounded-2xl border bg-card p-6 text-center shadow-xs">
            <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-accent text-primary">
              <Languages className="size-6" aria-hidden />
            </span>
            <h2 className="font-heading text-lg font-semibold">
              Choose your language
            </h2>
            <p className="text-sm text-muted-foreground" lang="bn">
              আপনার ভাষা বেছে নিন
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Select your preferred language
            </p>
            <p className="text-sm text-muted-foreground" lang="bn">
              আপনার পছন্দের ভাষা নির্বাচন করুন
            </p>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => {
                  chooseLang('en')
                  setPhase('roles')
                }}
                className={cn(
                  'flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors hover:bg-muted',
                  lang === 'en' && 'border-primary bg-accent text-primary',
                )}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  chooseLang('bn')
                  setPhase('roles')
                }}
                lang="bn"
                className={cn(
                  'flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors hover:bg-muted',
                  lang === 'bn' && 'border-primary bg-accent text-primary',
                )}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Splash overlay */}
      {phase === 'splash' && (
        <div
          className={cn(
            'absolute inset-0 z-10 grid place-items-center bg-background transition-opacity duration-500',
            fading && 'opacity-0',
          )}
          role="status"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <BrandMark className="size-16 rounded-3xl" />
            <div>
              <p className="font-heading text-3xl font-semibold tracking-tight">Tokio</p>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{TAGLINE}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
