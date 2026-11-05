'use client'

import Image from 'next/image'
import { Loader2, MapPin, MessageSquareText, PenLine, RefreshCw, Truck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { PhoneBadge, StatusPill } from '@/components/shared/badges'
import { useStore } from '@/lib/store'
import { TRACKING_STAGES } from '@/lib/constants'
import { formatTaka, orderTotal, paymentLabels } from '@/lib/format'
import { useLang, interpolate } from '@/lib/i18n'
import { TrackingTimeline } from './tracking-timeline'

export function OrderDetailModal() {
  const { state, dispatch, actions } = useStore()
  const { t } = useLang()
  const [syncing, setSyncing] = useState(false)
  const order = state.orders.find((o) => o.id === state.openOrderId)
  const close = () => dispatch({ type: 'openOrder', id: null })

  if (!order) return <Modal open={false} onClose={close} title="">{null}</Modal>

  const lastStage = TRACKING_STAGES.length - 1
  const delivered = order.trackingStage === lastStage
  const canRefresh = order.status === 'active' && !delivered && !syncing

  const refresh = async () => {
    setSyncing(true)
    try {
      const { advanced } = await actions.refreshTracking(order.id)
      if (advanced === 0) {
        toast(t('od.noScans'), { description: `${order.ref} · ${order.trackingRef}` })
      } else if (order.trackingStage + advanced >= lastStage) {
        toast.success(t('od.deliveredToast'), { description: t('od.deliveredToastDesc') })
      } else {
        const next = Math.min(order.trackingStage + advanced, lastStage)
        toast(interpolate(t('od.statusUpdate'), { stage: t(`track.stage${next + 1}`) }), {
          description: `${order.ref} · ${order.trackingRef}`,
        })
      }
    } catch (e) {
      toast.error(t('od.syncFail'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSyncing(false)
    }
  }

  const cancel = async () => {
    try {
      await actions.cancelOrder(order.id)
      toast(interpolate(t('od.cancelled'), { ref: order.ref }))
    } catch (e) {
      toast.error(t('od.cancelFail'), { description: e instanceof Error ? e.message : undefined })
    }
  }

  const review = () => {
    close()
    dispatch({ type: 'setTab', tab: 'reviews' })
    dispatch({ type: 'startReview', orderId: order.id })
  }

  return (
    <Modal
      open={!!order}
      onClose={close}
      className="sm:max-w-2xl"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t('od.title')} <span className="font-mono">{order.ref}</span>
          <StatusPill status={order.status} />
        </span>
      }
      description={interpolate(t('od.placedAt'), { date: order.createdAt, seller: order.seller })}
      footer={
        <>
          {order.status === 'active' && (
            <Button type="button" variant="ghost" onClick={cancel} className="mr-auto text-destructive">
              <XCircle aria-hidden />
              {t('od.cancel')}
            </Button>
          )}
          {order.fromChat && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                close()
                dispatch({ type: 'setTab', tab: 'chat' })
              }}
            >
              <MessageSquareText aria-hidden />
              {t('od.openChat')}
            </Button>
          )}
          {delivered && order.status === 'completed' && !order.reviewed && (
            <Button type="button" onClick={review}>
              <PenLine aria-hidden />
              {t('od.writeReview')}
            </Button>
          )}
          {delivered && order.reviewed && (
            <span className="self-center text-sm text-muted-foreground">{t('od.reviewDone')}</span>
          )}
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <section aria-labelledby="summary-h" className="rounded-xl border">
            <h3 id="summary-h" className="border-b px-4 py-2.5 text-sm font-semibold">
              {t('od.summary')}
            </h3>
            <div className="flex gap-3 px-4 py-3">
              <Image
                src={order.image}
                alt=""
                width={56}
                height={56}
                className="size-14 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="font-medium">{order.product}</p>
                <p className="text-sm text-muted-foreground">
                  {order.quantity} × {formatTaka(order.unitPrice)}
                </p>
              </div>
            </div>
            <dl className="space-y-1.5 border-t px-4 py-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('od.subtotal')}</dt>
                <dd>{formatTaka(order.quantity * order.unitPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('od.deliveryFee')}</dt>
                <dd>{formatTaka(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('od.payment')}</dt>
                <dd>{paymentLabels[order.payment]}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <dt>{t('od.total')}</dt>
                <dd className="text-primary">{formatTaka(orderTotal(order))}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="delivery-h" className="rounded-xl border px-4 py-3">
            <h3 id="delivery-h" className="text-sm font-semibold">
              {t('od.deliveryInfo')}
            </h3>
            <dl className="mt-2 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{t('od.customer')}</dt>
                <dd className="flex flex-wrap items-center gap-2 font-medium">
                  {order.customer}
                  <PhoneBadge verified={order.customerPhoneVerified} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{t('od.address')}</dt>
                <dd className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {order.address}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <section aria-labelledby="tracking-h" className="rounded-xl border">
          <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
            <div>
              <h3 id="tracking-h" className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="size-4 text-primary" aria-hidden />
                {t('od.tracking')}
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{order.trackingRef}</p>
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{t('od.progress')}</span>
                <span>
                  {order.status === 'cancelled'
                    ? t('orders.statusCancelled')
                    : `${order.trackingStage + 1} ${t('od.of')} ${TRACKING_STAGES.length}`}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Delivery progress"
                aria-valuemin={1}
                aria-valuemax={TRACKING_STAGES.length}
                aria-valuenow={order.trackingStage + 1}
              >
                <div
                  className={
                    order.status === 'cancelled'
                      ? 'h-full bg-destructive/60'
                      : 'h-full bg-primary transition-[width] duration-500'
                  }
                  style={{ width: `${((order.trackingStage + 1) / TRACKING_STAGES.length) * 100}%` }}
                />
              </div>
            </div>
            <TrackingTimeline order={order} />
            {order.status !== 'cancelled' && (
              <Button
                type="button"
                variant="outline"
                className="mt-5 w-full"
                onClick={refresh}
                disabled={!canRefresh}
              >
                {syncing ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}
                {delivered ? t('od.delivered') : syncing ? t('od.checking') : t('od.refresh')}
              </Button>
            )}
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {t('od.liveNote')}
            </p>
          </div>
        </section>
      </div>
    </Modal>
  )
}
