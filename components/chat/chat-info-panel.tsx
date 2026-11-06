'use client'
import Image from 'next/image'
import { ExternalLink, Globe, MapPin, Package, Share2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { formatTaka, orderTotal } from '@/lib/format'
import { useLang } from '@/lib/i18n'
import { StatusPill, VerifiedSellerBadge } from '@/components/shared/badges'

export function ChatInfoPanel() {
  const { state, dispatch, actions } = useStore()
  const { t } = useLang()
  const conversation = state.conversations.find((item) => item.id === state.activeConversationId)
  if (!conversation) return null
  const orders = state.orders.filter((order) => order.conversationId === conversation.id)
  const avg = state.reviews.reduce((sum, review) => sum + review.rating, 0) / Math.max(1, state.reviews.length)
  const name = conversation.merchant_name || 'Merchant'
  const since = conversation.merchant_created_at ? new Date(conversation.merchant_created_at).getFullYear() : 2026
  const websiteHref = conversation.merchant_website
    ? (/^https?:\/\//i.test(conversation.merchant_website) ? conversation.merchant_website : `https://${conversation.merchant_website}`)
    : null
  return <div className="space-y-5">
    <section className="text-center">
      <span className="relative mx-auto grid size-18 overflow-hidden rounded-2xl border bg-accent text-xl font-semibold text-primary">{conversation.merchant_avatar_url ? <Image src={conversation.merchant_avatar_url} alt="" fill unoptimized className="object-cover" /> : <span className="grid size-full place-items-center">{name[0]?.toUpperCase()}</span>}</span>
      <h2 className="mt-3 font-semibold">{name}</h2><p className="text-sm text-muted-foreground">{conversation.merchant_category || 'Merchant'}</p>
      {websiteHref
        ? <a href={websiteHref} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"><Globe className="size-3.5 shrink-0" /><span className="truncate">{conversation.merchant_website}</span><ExternalLink className="size-3 shrink-0" /></a>
        : <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Globe className="size-3.5" />Website not added</p>}
      {conversation.merchant_verified && <VerifiedSellerBadge className="mt-2" />}
      <dl className="mt-4 grid grid-cols-3 divide-x rounded-xl border bg-background py-2.5 text-center">
        <div><dt className="text-[11px] text-muted-foreground">{t('info.rating')}</dt><dd className="inline-flex items-center gap-0.5 text-sm font-semibold"><Star className="size-3.5 fill-gold text-gold" />{avg.toFixed(1)}</dd></div>
        <div><dt className="text-[11px] text-muted-foreground">{t('info.orders')}</dt><dd className="text-sm font-semibold">{conversation.completed_orders || 0}</dd></div>
        <div><dt className="text-[11px] text-muted-foreground">{t('info.since')}</dt><dd className="text-sm font-semibold">{since}</dd></div>
      </dl>
      {conversation.merchant_address && <p className="mt-3 flex items-start gap-2 text-left text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" /><span>{conversation.merchant_address}</span></p>}
    </section>
    <section><h3 className="mb-2 text-sm font-semibold">Products</h3>{state.products.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">No products listed yet.</p> : <ul className="space-y-2">{state.products.map((product) => <li key={product.id} className="flex items-center gap-3 rounded-xl border bg-background p-2.5"><span className="relative grid size-12 shrink-0 overflow-hidden rounded-lg bg-muted">{product.image_url ? <Image src={product.image_url} alt="" fill unoptimized className="object-cover" /> : <Package className="m-auto size-5 text-muted-foreground" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{product.name}</span><span className="text-sm font-semibold text-primary">{formatTaka(product.price)}</span></span><button type="button" onClick={() => actions.sendMessage({ kind: 'product', productId: product.id }).then(() => toast(t('chat.productShared'))).catch((error) => toast.error(error.message))} className="grid size-9 place-items-center rounded-lg border"><Share2 className="size-4" /></button></li>)}</ul>}</section>
    <section><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Package className="size-4" />{t('info.ordersFromChat')}</h3>{orders.length === 0 ? <p className="rounded-xl border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">{t('info.noOrders')}</p> : <ul className="space-y-2">{orders.map((order) => <li key={order.id}><button type="button" onClick={() => { dispatch({ type: 'setTab', tab: 'orders' }); dispatch({ type: 'openOrder', id: order.id }) }} className="flex w-full items-center justify-between rounded-xl border p-3 text-left"><span><span className="block font-mono text-xs text-muted-foreground">{order.ref}</span><span className="text-sm font-medium">{formatTaka(orderTotal(order))}</span></span><StatusPill status={order.status} /></button></li>)}</ul>}</section>
  </div>
}
