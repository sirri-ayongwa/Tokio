'use client'

import { Loader2, LogOut, MessagesSquare, Package, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { useLang } from '@/lib/i18n'
import { TAGLINE } from '@/lib/constants'
import { authClient } from '@/lib/auth-client'
import type { Tab } from '@/lib/types'
import { ChatScreen } from './chat/chat-screen'
import { OrdersScreen } from './orders/orders-screen'
import { ReviewsScreen } from './reviews/reviews-screen'
import { OrderDetailModal } from './orders/order-detail-modal'

const NAV: { id: Tab; labelKey: string; icon: typeof MessagesSquare }[] = [
  { id: 'chat', labelKey: 'nav.chat', icon: MessagesSquare },
  { id: 'orders', labelKey: 'nav.orders', icon: Package },
  { id: 'reviews', labelKey: 'nav.reviews', icon: Star },
]

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn('grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground', className)}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.3">
        <path d="M4.5 7.4c4.8-3.2 10.2-3.2 15 0" strokeLinecap="round" />
        <path d="M12 7.4v9.2" strokeLinecap="round" />
        <circle cx="12" cy="19.4" r="1.25" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}

export function AppShell() {
  const { state, dispatch, actions, user } = useStore()
  const { t, lang } = useLang()
  const activeCount = state.orders.filter((o) => o.status === 'active').length

  const clearAll = () => {
    if (!window.confirm(t('nav.clearConfirm'))) return
    actions
      .clearAll()
      .then(() => toast.success(t('nav.cleared'), { description: t('nav.clearedDesc') }))
      .catch((e) => toast.error(t('nav.clearFail'), { description: e.message }))
  }

  const signOut = async () => {
    await authClient.signOut()
    window.location.reload()
  }

  if (!state.synced) {
    return (
      <div className="grid h-dvh place-items-center bg-background" role="status">
        <div className="flex flex-col items-center gap-3">
          <BrandMark className="size-12 rounded-2xl" />
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t('app.loading')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background md:flex-row">
      <aside className="hidden w-16 shrink-0 flex-col border-r bg-sidebar md:flex lg:w-60">
        <div className="flex h-16 items-center gap-2.5 px-3.5 lg:px-5">
          <BrandMark />
          <div className="hidden min-w-0 lg:block">
            <p className="font-heading font-semibold leading-tight tracking-tight">Tokio</p>
            <p className="text-xs text-muted-foreground">
              {lang === 'bn' ? 'একটি কথোপকথন। একটি অর্ডার।' : TAGLINE}
            </p>
          </div>
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-2.5 py-3 lg:px-3">
          {NAV.map(({ id, labelKey, icon: Icon }) => {
            const active = state.tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => dispatch({ type: 'setTab', tab: id })}
                aria-current={active ? 'page' : undefined}
                title={t(labelKey)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="hidden lg:inline">{t(labelKey)}</span>
                {id === 'orders' && activeCount > 0 && (
                  <span className="ml-auto hidden rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground lg:inline">
                    {activeCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="space-y-1 border-t p-3">
          <p className="hidden truncate px-2.5 pb-1 text-xs text-muted-foreground lg:block" title={user.email}>
            {t('nav.signedInAs')} <span className="font-medium text-foreground">{user.name}</span>
          </p>
          <button
            type="button"
            onClick={clearAll}
            title={t('nav.clearData')}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            <span className="hidden lg:inline">{t('nav.clearData')}</span>
          </button>
          <button
            type="button"
            onClick={signOut}
            title={t('nav.signOut')}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            <span className="hidden lg:inline">{t('nav.signOut')}</span>
          </button>
        </div>
      </aside>

      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <BrandMark className="size-8" />
          <span className="font-semibold tracking-tight">Tokio</span>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="sr-only">{t('nav.signOut')}</span>
        </button>
      </header>

      <main className="min-h-0 min-w-0 flex-1">
        {state.tab === 'chat' && <ChatScreen />}
        {state.tab === 'orders' && <OrdersScreen />}
        {state.tab === 'reviews' && <ReviewsScreen />}
      </main>

      <nav
        aria-label="Primary"
        className="grid shrink-0 grid-cols-3 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {NAV.map(({ id, labelKey, icon: Icon }) => {
          const active = state.tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => dispatch({ type: 'setTab', tab: id })}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden />
              {t(labelKey)}
              {id === 'orders' && activeCount > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-2 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <OrderDetailModal />
    </div>
  )
}
