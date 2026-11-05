'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { Languages, ShoppingBag, Store } from 'lucide-react'
import { BrandMark } from '@/components/app-shell'
import { TAGLINE } from '@/lib/constants'
import { getStoredLang, useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const SPLASH_MS = 10_000

const SPLASH_BUBBLES = [
  { size: 86, left: '8%', top: '13%', depth: -90, duration: 7.2, delay: -1.4 },
  { size: 38, left: '22%', top: '68%', depth: 70, duration: 5.8, delay: -3.1 },
  { size: 58, left: '78%', top: '18%', depth: 130, duration: 6.5, delay: -4.2 },
  { size: 112, left: '82%', top: '70%', depth: -120, duration: 8.4, delay: -2.3 },
  { size: 26, left: '61%', top: '82%', depth: 180, duration: 5.2, delay: -0.8 },
  { size: 46, left: '13%', top: '43%', depth: 120, duration: 6.1, delay: -4.8 },
  { size: 22, left: '67%', top: '9%', depth: 210, duration: 4.8, delay: -2.7 },
  { size: 68, left: '42%', top: '87%', depth: -50, duration: 7.7, delay: -5.2 },
  { size: 32, left: '91%', top: '42%', depth: 90, duration: 5.5, delay: -1.9 },
  { size: 18, left: '34%', top: '20%', depth: 240, duration: 4.6, delay: -3.5 },
]

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
          phase === 'splash' && 'opacity-0',
        )}
        aria-hidden={phase === 'splash'}
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

      {/* Language selection — modal over the blurred role select */}
      {phase === 'lang' && (
        <div
          className="absolute inset-0 z-20 grid place-items-center bg-background/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Choose your language"
        >
          <div className="w-full max-w-xs rounded-2xl border bg-card p-6 text-center shadow-xl">
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
            'splash-scene absolute inset-0 z-10 grid place-items-center overflow-hidden bg-background transition-opacity duration-500',
            fading && 'opacity-0',
          )}
          role="status"
        >
          <div className="splash-aurora" aria-hidden />
          <div className="splash-bubbles" aria-hidden>
            {SPLASH_BUBBLES.map((bubble, index) => (
              <span
                key={index}
                className="splash-bubble"
                style={
                  {
                    '--bubble-size': `${bubble.size}px`,
                    '--bubble-left': bubble.left,
                    '--bubble-top': bubble.top,
                    '--bubble-depth': `${bubble.depth}px`,
                    '--bubble-duration': `${bubble.duration}s`,
                    '--bubble-delay': `${bubble.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
          <div className="splash-content relative z-10 flex flex-col items-center gap-4 text-center">
            <div className="splash-logo">
              <BrandMark className="size-16 rounded-3xl shadow-2xl" />
            </div>
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
