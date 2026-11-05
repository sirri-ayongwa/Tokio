'use client'

import { Check } from 'lucide-react'
import { TRACKING_STAGES } from '@/lib/constants'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'

export function TrackingTimeline({ order }: { order: Order }) {
  const { t } = useLang()
  const cancelled = order.status === 'cancelled'

  return (
    <ol className="relative">
      {TRACKING_STAGES.map((stage, i) => {
        const done = i <= order.trackingStage && !(cancelled && i > 0)
        const current = i === order.trackingStage && !cancelled && order.status === 'active'
        const isLast = i === TRACKING_STAGES.length - 1
        return (
          <li key={stage.title} className="relative flex gap-3 pb-5 last:pb-0" aria-current={current ? 'step' : undefined}>
            {!isLast && (
              <span
                className={cn(
                  'absolute top-6 left-[11px] h-[calc(100%-1.5rem)] w-0.5',
                  i < order.trackingStage && !cancelled ? 'bg-primary' : 'bg-border',
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                'relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors',
                done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card',
                current && 'ring-4 ring-primary/15',
              )}
              aria-hidden
            >
              {done && <Check className="size-3.5" strokeWidth={3} />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={cn('text-sm font-medium', !done && 'text-muted-foreground')}>
                  {t(`track.stage${i + 1}`)}
                  <span className="sr-only">{done ? ` ${t('track.completedSr')}` : ` ${t('track.pendingSr')}`}</span>
                </p>
                {order.trackingTimes[i] && (
                  <p className="text-xs text-muted-foreground tabular-nums">{order.trackingTimes[i]}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t(`track.desc${i + 1}`)}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
