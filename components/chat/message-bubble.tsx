'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CheckCheck, Languages, PackageCheck, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/lib/store'
import { formatTaka, orderTotal, paymentLabels } from '@/lib/format'
import { useLang, interpolate } from '@/lib/i18n'
import type { Message } from '@/lib/types'
import { StatusPill } from '@/components/shared/badges'

const LANG_NAMES = { en: 'English', bn: 'বাংলা' } as const

export function MessageBubble({ message }: { message: Message }) {
  const { state, user } = useStore()
  const { t } = useLang()
  const own = message.senderUserId ? message.senderUserId === user.id : message.sender === state.role
  const conversation = state.conversations.find((item) => item.id === message.conversationId)
  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <li className={cn('flex gap-2', own ? 'justify-end' : 'justify-start')}>
      {!own && (
        <span className="mt-auto hidden size-7 shrink-0 overflow-hidden rounded-full border bg-card sm:block">
          {message.sender === 'seller' && conversation?.merchant_avatar_url ? (
            <Image src={conversation.merchant_avatar_url} alt="" width={28} height={28} unoptimized className="size-full object-cover" />
          ) : (
            <span className="grid size-full place-items-center bg-sky-100 text-[10px] font-semibold text-sky-800">
              {initials}
            </span>
          )}
        </span>
      )}
      <div className={cn('flex max-w-[85%] flex-col sm:max-w-[70%]', own ? 'items-end' : 'items-start')}>
        {message.kind === 'text' && <TextContent message={message} own={own} />}
        {message.kind === 'product' && <ProductContent productId={message.productId} />}
        {message.kind === 'image' && message.imageUrl && <ImageContent src={message.imageUrl} />}
        {message.kind === 'order' && message.orderId && <OrderContent orderId={message.orderId} />}
        <span className="mt-1 flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
          <span className="sr-only">
            {message.sender === 'seller' ? t('chat.seller') : t('chat.buyer')}, sent at{' '}
          </span>
          {message.time}
          {own && <CheckCheck className="size-3.5 text-primary" aria-label="Sent" />}
        </span>
      </div>
    </li>
  )
}

function TextContent({ message, own }: { message: Message; own: boolean }) {
  const { state } = useStore()
  const { t } = useLang()
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
              {t('chat.translatedFrom')} {LANG_NAMES[message.lang!]}
            </span>
          )}
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="rounded underline-offset-2 hover:text-foreground hover:underline"
          >
            {showTranslated
              ? t('chat.seeOriginal')
              : interpolate(t('chat.seeTranslation'), { lang: LANG_NAMES[state.lang] })}
          </button>
        </div>
      )}
    </>
  )
}

function ImageContent({ src }: { src: string }) {
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border shadow-xs">
      <Image
        src={src}
        alt="Shared photo"
        width={240}
        height={240}
        unoptimized
        className="max-h-60 w-auto object-cover"
      />
    </a>
  )
}

function ProductContent({ productId }: { productId?: string }) {
  const { state } = useStore()
  const { t } = useLang()
  const product = state.products.find((item) => item.id === productId)
  if (!product) return null
  return (
    <div className="flex w-64 gap-3 rounded-2xl border bg-card p-2.5 shadow-xs">
      <Image
        src={product.image_url || '/placeholder.jpg'}
        alt={product.name}
        width={64}
        height={64}
        className="size-16 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 py-0.5">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-sm font-semibold text-primary">{formatTaka(product.price)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t('chat.inStock')} · {t('chat.sharedByBuyer')}
        </p>
      </div>
    </div>
  )
}

function OrderContent({ orderId }: { orderId: string }) {
  const { state, dispatch } = useStore()
  const { t } = useLang()
  const order = state.orders.find((o) => o.id === orderId)
  if (!order) return null
  const stageTitle = t(`track.stage${order.trackingStage + 1}`)

  return (
    <div className="w-72 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b bg-accent/60 px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-foreground">
          <PackageCheck className="size-4" aria-hidden />
          {t('od.confirmed')}
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
          <dt className="text-muted-foreground">{t('ai.delivery')}</dt>
          <dd>{formatTaka(order.deliveryFee)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{t('ai.payment')}</dt>
          <dd>{paymentLabels[order.payment]}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t pt-1.5 font-semibold">
          <dt>{t('ai.total')}</dt>
          <dd className="text-primary">{formatTaka(orderTotal(order))}</dd>
        </div>
      </dl>
      <div className="flex items-center justify-between gap-2 border-t px-3.5 py-2.5">
        <StatusPill
          status={order.status}
          label={order.status === 'cancelled' ? t('orders.statusCancelled') : stageTitle}
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
          {t('orders.track')}
        </button>
      </div>
    </div>
  )
}
