'use client'

import Image from 'next/image'
import { BadgeCheck, Clock, MapPin, Package, Share2, ShieldCheck, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { PRODUCT, SHOP } from '@/lib/constants'
import { formatTaka, orderTotal } from '@/lib/format'
import { useLang } from '@/lib/i18n'
import { PhoneBadge, StatusPill, VerifiedSellerBadge } from '@/components/shared/badges'
import { PhoneVerifyButton } from '@/components/trust/phone-verify'

export function ChatInfoPanel() {
  const { state, dispatch, actions } = useStore()
  const { t } = useLang()
  const chatOrders = state.orders.filter((o) => o.fromChat)
  const avg = state.reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, state.reviews.length)
  const profileAddress = state.accountRole === 'merchant' ? state.pickupAddress : state.address

  return (
    <div className="space-y-5">
      <section aria-labelledby="shop-heading" className="text-center">
        <Image
          src={SHOP.logo}
          alt={`${SHOP.name} logo`}
          width={72}
          height={72}
          className="mx-auto size-18 rounded-2xl border object-cover"
        />
        <h2 id="shop-heading" className="mt-3 font-semibold">
          {SHOP.name}
        </h2>
        <p className="text-sm text-muted-foreground" lang="bn">
          {SHOP.nameBn}
        </p>
        <VerifiedSellerBadge className="mt-2" />
        <dl className="mt-4 grid grid-cols-3 divide-x rounded-xl border bg-background py-2.5 text-center">
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('info.rating')}</dt>
            <dd className="inline-flex items-center gap-0.5 text-sm font-semibold">
              <Star className="size-3.5 fill-gold text-gold" aria-hidden />
              {avg.toFixed(1)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('info.orders')}</dt>
            <dd className="text-sm font-semibold">{SHOP.completedOrders.toLocaleString('en-IN')}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground">{t('info.since')}</dt>
            <dd className="text-sm font-semibold">{SHOP.memberSince}</dd>
          </div>
        </dl>
        <ul className="mt-3 space-y-1.5 text-left text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden />
            {SHOP.location}
          </li>
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" aria-hidden />
            {t('chat.responseTime')}
          </li>
        </ul>
      </section>

      <section aria-labelledby="trust-heading" className="rounded-xl border bg-background p-4">
        <h3 id="trust-heading" className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-primary" aria-hidden />
          {t('chat.trust')}
        </h3>
        <ul className="mt-3 space-y-3 text-sm">
          <li className="flex items-start gap-2.5">
            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="font-medium">{t('chat.identityVerified')}</span>
              <span className="block text-xs text-muted-foreground">{t('chat.identityDesc')}</span>
            </span>
          </li>
          <li className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{t('info.yourPhone')}</span>
              <PhoneBadge verified={state.phoneVerified} />
            </div>
            <PhoneVerifyButton className="w-full" />
          </li>
          {state.addressVisible && profileAddress && (
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">
                <span className="font-medium">{t('info.yourAddress')}</span>
                <span className="block text-xs text-muted-foreground">{profileAddress}</span>
              </span>
            </li>
          )}
        </ul>
      </section>

      <section aria-labelledby="product-heading" className="rounded-xl border bg-background p-3">
        <h3 id="product-heading" className="sr-only">
          Product in this chat
        </h3>
        <div className="flex gap-3">
          <Image
            src={PRODUCT.image}
            alt={PRODUCT.name}
            width={56}
            height={56}
            className="size-14 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{PRODUCT.name}</p>
            <p className="text-sm font-semibold text-primary">{formatTaka(PRODUCT.price)}</p>
            <p className="text-xs text-muted-foreground">{PRODUCT.stock}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              actions
                .sendMessage({ kind: 'product' })
                .then(() => toast(t('chat.productShared')))
                .catch((e) => toast.error(t('chat.shareFail'), { description: e.message }))
            }
            title={t('chat.shareProduct')}
            className="grid size-9 shrink-0 place-items-center self-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Share2 className="size-4" aria-hidden />
            <span className="sr-only">{t('chat.shareProduct')}</span>
          </button>
        </div>
      </section>

      <section aria-labelledby="chat-orders-heading">
        <h3 id="chat-orders-heading" className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Package className="size-4 text-muted-foreground" aria-hidden />
          {t('info.ordersFromChat')}
        </h3>
        {chatOrders.length === 0 ? (
          <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
            {t('info.noOrders')}
          </p>
        ) : (
          <ul className="space-y-2">
            {chatOrders.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'setTab', tab: 'orders' })
                    dispatch({ type: 'openOrder', id: o.id })
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                >
                  <span>
                    <span className="block font-mono text-xs text-muted-foreground">{o.ref}</span>
                    <span className="text-sm font-medium">{formatTaka(orderTotal(o))}</span>
                  </span>
                  <StatusPill status={o.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
