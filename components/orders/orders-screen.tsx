'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCircle2, ChevronRight, Clock3, Inbox, Package, Sparkles, XCircle } from 'lucide-react'
import { useStore } from '@/lib/store'
import { formatTaka, orderTotal, paymentLabels } from '@/lib/format'
import { useLang, interpolate } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus } from '@/lib/types'
import { StatusPill } from '@/components/shared/badges'

type Filter = 'all' | OrderStatus

const FILTERS: { id: Filter; key: string }[] = [
  { id: 'all', key: 'orders.allOrders' },
  { id: 'active', key: 'orders.active' },
  { id: 'completed', key: 'orders.completed' },
  { id: 'cancelled', key: 'orders.cancelled' },
]

export function OrdersScreen() {
  const { state, dispatch } = useStore()
  const { t } = useLang()
  const [filter, setFilter] = useState<Filter>('all')
  const orders = state.orders
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length
  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter)
  const open = (id: string) => dispatch({ type: 'openOrder', id })

  const statusLabel = (o: Order) =>
    o.status === 'cancelled' ? t('orders.statusCancelled') : t(`track.stage${o.trackingStage + 1}`)

  const stats = [
    { label: t('orders.total'), value: orders.length, icon: Package, tone: 'bg-muted text-foreground' },
    { label: t('orders.active'), value: count('active'), icon: Clock3, tone: 'bg-sky-500/15 text-sky-400' },
    { label: t('orders.completed'), value: count('completed'), icon: CheckCircle2, tone: 'bg-accent text-primary' },
    { label: t('orders.cancelled'), value: count('cancelled'), icon: XCircle, tone: 'bg-red-500/15 text-red-400' },
  ]

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t('orders.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('orders.sub')}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {interpolate(t('orders.revenue'), {
              total: formatTaka(
                orders.filter((o) => o.status === 'completed').reduce((s, o) => s + orderTotal(o), 0),
              ),
            })}
          </p>
        </header>

        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <li key={label} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{label}</p>
                <span className={cn('grid size-8 place-items-center rounded-lg', tone)}>
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
            </li>
          ))}
        </ul>

        <section aria-labelledby="order-list-h" className="rounded-2xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <h2 id="order-list-h" className="font-semibold">
              {t('orders.list')}
            </h2>
            <div role="tablist" aria-label="Filter orders" className="flex gap-1 overflow-x-auto rounded-lg bg-muted p-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    filter === f.id ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(f.key)}
                  <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                    {f.id === 'all' ? orders.length : count(f.id)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-muted">
                <Inbox className="size-5 text-muted-foreground" aria-hidden />
              </span>
              <div>
                <p className="font-medium">
                  {interpolate(t('orders.emptyTitle'), { filter: filter === 'all' ? '' : t(`orders.${filter}`) })}
                </p>
                <p className="text-sm text-muted-foreground">{t('orders.emptyDesc')}</p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'setTab', tab: 'chat' })}
                className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
              >
                {t('orders.goChat')}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th scope="col" className="px-4 py-2.5 font-medium">{t('th.product')}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{t('th.ref')}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{t('th.customer')}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{t('th.date')}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{t('th.payment')}</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">{t('th.total')}</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">{t('th.status')}</th>
                      <th scope="col" className="w-10 px-2"><span className="sr-only">{t('ai.view')}</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {visible.map((o) => (
                      <tr
                        key={o.id}
                        onClick={() => open(o.id)}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Image src={o.image} alt="" width={36} height={36} className="size-9 rounded-lg object-cover" />
                            <span className="font-medium">
                              {o.product}
                              {o.fromChat && (
                                <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-accent px-1.5 py-0.5 align-middle text-[10px] font-medium text-accent-foreground">
                                  <Sparkles className="size-2.5" aria-hidden />
                                  {t('orders.fromChat')}
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{o.ref}</td>
                        <td className="px-4 py-3">{o.customer}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{o.createdAt}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{paymentLabels[o.payment]}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{formatTaka(orderTotal(o))}</td>
                        <td className="px-4 py-3">
                          <StatusPill status={o.status} label={statusLabel(o)} />
                        </td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              open(o.id)
                            }}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <ChevronRight className="size-4" aria-hidden />
                            <span className="sr-only">{interpolate(t('orders.viewRef'), { ref: o.ref })}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y md:hidden">
                {visible.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => open(o.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <Image src={o.image} alt="" width={48} height={48} className="size-12 shrink-0 rounded-xl object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-medium">{o.product}</span>
                          <span className="shrink-0 font-semibold tabular-nums">{formatTaka(orderTotal(o))}</span>
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          <span className="font-mono">{o.ref}</span> · {o.customer} · {o.createdAt}
                        </span>
                        <span className="mt-1.5 flex items-center justify-between gap-2">
                          <StatusPill status={o.status} label={statusLabel(o)} />
                          <span className="text-xs text-muted-foreground">{paymentLabels[o.payment]}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
