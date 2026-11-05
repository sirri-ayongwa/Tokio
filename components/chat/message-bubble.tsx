'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, CheckCheck, Languages, PackageCheck, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { PRODUCT, SHOP, TRACKING_STAGES } from '@/lib/mock-data'
import { formatTaka, orderTotal, paymentLabels } from '@/lib/format'
import type { Message } from '@/lib/types'
import { StatusPill } from '@/components/shared/badges'

const LANG_NAMES = { en: 'English', bn: 'বাংলা' } as const

export function MessageBubble({ message }: { message: Message }) {
  const { state } = useStore()
  const own = message.sender === state.role

  return (
    <li className={cn('flex gap-2', own ? 'justify-end' : 'justify-start')}>
      {!own && (
        <span className="mt-auto hidden size-7 shrink-0 overflow-hidden rounded-full border bg-card sm:block">
          {message.sender === 'seller' ? (
            <Image src={SHOP.logo} alt="" width={28} height={28} className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center bg-sky-100 text-[10px] font-semibold text-sky-800">
              EC
            </span>
          )}
        </span>
      )}
      <div className={cn('flex max-w-[85%] flex-col sm:max-w-[70%]', own ? 'items-end' : 'items-start')}>
        {message.kind === 'text' && <TextContent message={message} own={own} />}
        {message.kind === 'product' && <ProductContent />}
        {message.kind === 'order' && message.orderId && <OrderContent orderId={message.orderId} />}
        <span className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
          <span className="sr-only">{message.sender === 'seller' ? 'Seller' : 'Buyer'}, sent at </span>
          {message.time}
          {own &&
            (message.id.startsWith('m') ? (
              <CheckCheck className="size-3.5 text-primary" aria-label="Read" />
            ) : (
              <Check className="size-3.5" aria-label="Sent" />
            ))}
        </span>
      </div>
    </li>
  )
}

function TextContent({ message, own }: { message: Message; own: boolean }) {
  const { state } = useStore()
  const [flipped, setFlipped] = useState(false)
  const needsTranslation = message.lang !== state.lang && !!message.translation
  const autoTranslated = needsTranslation && state.showTranslations
  const showTranslated = needsTranslation && (flipped ? !autoTranslated : autoTranslated)
  const text = showTranslated ? message.translation : message.text
  const displayLang = showTranslated ? state.lang : message.lang

  return (
    <>
      <div
        lang={displayLang}
        className={cn(
          'rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed text-pretty',
          own
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md border bg-card text-card-foreground shadow-xs',
        )}
      >
        {text}
      </div>
      {needsTranslation && (
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 px-1 text-[11px] text-muted-foreground">
          {showTranslated && (
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <Languages className="size-3" aria-hidden />
              Translated from {LANG_NAMES[message.lang!]}
            </span>
          )}
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="rounded underline-offset-2 hover:text-foreground hover:underline"
          >
            {showTranslated ? 'See original' : `See translation (${LANG_NAMES[state.lang]})`}
          </button>
        </div>
      )}
      {!message.translation && message.lang !== state.lang && (
        <span className="mt-1 px-1 text-[11px] text-muted-foreground">
          Live translation is not connected in this demo
        </span>
      )}
    </>
  )
}

function ProductContent() {
  return (
    <div className="flex w-64 gap-3 rounded-2xl border bg-card p-2.5 shadow-xs">
      <Image
        src={PRODUCT.image}
        alt={PRODUCT.name}
        width={64}
        height={64}
        className="size-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 py-0.5">
        <p className="truncate text-sm font-medium">{PRODUCT.name}</p>
        <p className="text-sm font-semibold text-primary">{formatTaka(PRODUCT.price)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {PRODUCT.stock} · Shared by buyer
        </p>
      </div>
    </div>
  )
}

function OrderContent({ orderId }: { orderId: string }) {
  const { state, dispatch } = useStore()
  const order = state.orders.find((o) => o.id === orderId)
  if (!order) return null
  const stage = TRACKING_STAGES[order.trackingStage]

  return (
    <div className="w-72 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b bg-accent/60 px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-foreground">
          <PackageCheck className="size-4" aria-hidden />
          Order confirmed
        </span>
        <span className="font-mono text-xs text-muted-foreground">{order.ref}</span>
      </div>
      <dl className="space-y-1.5 px-3.5 py-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">
            {order.product} × {order.quantity}
          </dt>
          <dd>{formatTaka(order.quantity * order.unitPrice)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd>{formatTaka(order.deliveryFee)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Payment</dt>
          <dd>{paymentLabels[order.payment]}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t pt-1.5 font-semibold">
          <dt>Total</dt>
          <dd className="text-primary">{formatTaka(orderTotal(order))}</dd>
        </div>
      </dl>
      <div className="flex items-center justify-between gap-2 border-t px-3.5 py-2.5">
        <StatusPill
          status={order.status}
          label={order.status === 'cancelled' ? 'Cancelled' : stage.title}
        />
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'setTab', tab: 'orders' })
            dispatch({ type: 'openOrder', id: order.id })
          }}
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary hover:underline"
        >
          <Truck className="size-4" aria-hidden />
          Track order
        </button>
      </div>
    </div>
  )
}
