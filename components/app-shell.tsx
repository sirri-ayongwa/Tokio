'use client'

import { MessagesSquare, Package, RotateCcw, Star, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import type { Tab } from '@/lib/types'
import { ChatScreen } from './chat/chat-screen'
import { OrdersScreen } from './orders/orders-screen'
import { ReviewsScreen } from './reviews/reviews-screen'
import { OrderDetailModal } from './orders/order-detail-modal'

const NAV: { id: Tab; label: string; icon: typeof MessagesSquare }[] = [
  { id: 'chat', label: 'Chat', icon: MessagesSquare },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'reviews', label: 'Reviews', icon: Star },
]

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn('grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground', className)}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M4 15c0-4 3.5-7 8-7s8 3 8 7" strokeLinecap="round" />
        <path d="M4 15v3M20 15v3M12 8V5" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-gold-foreground',
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden />
      Demo mode
    </span>
  )
}

export function AppShell() {
  const { state, dispatch } = useStore()
  const activeCount = state.orders.filter((o) => o.status === 'active').length

  const resetDemo = () => {
    dispatch({ type: 'reset' })
    toast.success('Demo data reset', { description: 'Conversation, orders and reviews restored.' })
  }

  return (
    <div className="flex h-dvh flex-col bg-background md:flex-row">
      <aside className="hidden w-16 shrink-0 flex-col border-r bg-sidebar md:flex lg:w-60">
        <div className="flex h-16 items-center gap-2.5 px-3.5 lg:px-5">
          <BrandMark />
          <div className="hidden min-w-0 lg:block">
            <p className="font-semibold leading-tight tracking-tight">OrderBridge</p>
            <p className="text-xs text-muted-foreground">Chat-to-order for Bangladesh</p>
          </div>
        </div>
        <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 px-2.5 py-3 lg:px-3">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = state.tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => dispatch({ type: 'setTab', tab: id })}
                aria-current={active ? 'page' : undefined}
                title={label}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="hidden lg:inline">{label}</span>
                {id === 'orders' && activeCount > 0 && (
                  <span className="ml-auto hidden rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground lg:inline">
                    {activeCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="space-y-3 border-t p-3">
          <DemoBadge className="hidden lg:inline-flex" />
          <p className="hidden text-xs leading-relaxed text-muted-foreground lg:block">
            Prototype with mock data. No real payments, SMS, AI or courier calls.
          </p>
          <button
            type="button"
            onClick={resetDemo}
            title="Reset demo"
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-4 shrink-0" aria-hidden />
            <span className="hidden lg:inline">Reset demo</span>
            <span className="sr-only lg:hidden">Reset demo</span>
          </button>
        </div>
      </aside>

      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <BrandMark className="size-8" />
          <span className="font-semibold tracking-tight">OrderBridge</span>
        </div>
        <div className="flex items-center gap-1">
          <DemoBadge />
          <button
            type="button"
            onClick={resetDemo}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
          >
            <RotateCcw className="size-4" aria-hidden />
            <span className="sr-only">Reset demo</span>
          </button>
        </div>
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
        {NAV.map(({ id, label, icon: Icon }) => {
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
              {label}
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
