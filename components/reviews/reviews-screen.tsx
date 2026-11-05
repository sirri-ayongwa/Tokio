'use client'

import { useState } from 'react'
import Image from 'next/image'
import { BadgeCheck, Lock, PenLine, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { PRODUCT } from '@/lib/mock-data'
import { formatTaka } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Review } from '@/lib/types'
import { Stars } from '@/components/shared/badges'
import { ReviewFormModal } from './review-form-modal'

export function ReviewsScreen() {
  const { state, dispatch } = useStore()
  const [withPhoto, setWithPhoto] = useState(false)
  const reviews = state.reviews
  const visible = withPhoto ? reviews.filter((r) => r.photos.length) : reviews
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / Math.max(1, reviews.length)
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }))
  const maxCount = Math.max(1, ...dist.map((d) => d.count))

  const eligible = state.orders.find((o) => o.fromChat && o.status === 'completed' && !o.reviewed)
  const pendingChatOrder = state.orders.find((o) => o.fromChat && o.status === 'active')
  const reviewOrder = state.orders.find((o) => o.id === state.reviewOrderId) ?? null

  const startReview = () => {
    if (eligible) return dispatch({ type: 'startReview', orderId: eligible.id })
    toast('Reviews unlock after delivery', {
      description: pendingChatOrder
        ? `Advance ${pendingChatOrder.ref} to Delivered in Orders first.`
        : 'Create and confirm an order from chat first.',
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ratings &amp; reviews</h1>
            <p className="text-sm text-muted-foreground">Only buyers with a delivered order can review.</p>
          </div>
          <button
            type="button"
            onClick={startReview}
            aria-disabled={!eligible}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors',
              eligible
                ? 'bg-primary text-primary-foreground shadow-sm hover:opacity-90'
                : 'border bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {eligible ? <PenLine className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
            Write a review
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <div className="space-y-4 lg:sticky lg:top-0 lg:self-start">
            <section aria-labelledby="product-h" className="flex gap-3 rounded-2xl border bg-card p-3">
              <Image src={PRODUCT.image} alt={PRODUCT.name} width={64} height={64} className="size-16 rounded-xl object-cover" />
              <div>
                <h2 id="product-h" className="font-medium">
                  {PRODUCT.name}
                </h2>
                <p className="text-sm text-muted-foreground">Golden Bracelet Shop</p>
                <p className="text-sm font-semibold text-primary">{formatTaka(PRODUCT.price)}</p>
              </div>
            </section>

            <section aria-labelledby="summary-h" className="rounded-2xl border bg-card p-5">
              <h2 id="summary-h" className="sr-only">
                Rating summary
              </h2>
              <div className="flex items-end gap-3">
                <p className="text-5xl font-semibold tracking-tight tabular-nums">{avg.toFixed(1)}</p>
                <div className="pb-1.5">
                  <Stars rating={avg} size="md" />
                  <p className="text-xs text-muted-foreground">{reviews.length} ratings</p>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5">
                {dist.map(({ n, count }) => (
                  <li key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted-foreground tabular-nums">{n}</span>
                    <span className="sr-only">stars:</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </span>
                    <span className="w-4 text-right text-muted-foreground tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </section>

            {!eligible && (
              <p className="rounded-2xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                <Lock className="mr-1.5 inline size-3.5 align-[-2px]" aria-hidden />
                {pendingChatOrder
                  ? `Your order ${pendingChatOrder.ref} is on its way. You can review it once it's delivered.`
                  : 'Place an order from chat and receive it to leave a verified review.'}
              </p>
            )}
          </div>

          <section aria-labelledby="list-h">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="list-h" className="text-lg font-semibold">
                {visible.length} review{visible.length === 1 ? '' : 's'}
              </h2>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={withPhoto}
                  onChange={(e) => setWithPhoto(e.target.checked)}
                  className="size-4 accent-primary"
                />
                With photo
              </label>
            </div>
            {visible.length === 0 ? (
              <p className="rounded-2xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No reviews with photos yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {visible.map((r) => (
                  <ReviewCard key={r.id} review={r} onHelpful={() => dispatch({ type: 'toggleHelpful', id: r.id })} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <ReviewFormModal order={reviewOrder} onClose={() => dispatch({ type: 'startReview', orderId: null })} />
    </div>
  )
}

function ReviewCard({ review, onHelpful }: { review: Review; onHelpful: () => void }) {
  return (
    <li>
      <article className="rounded-2xl border bg-card p-4 sm:p-5">
        <header className="flex items-start gap-3">
          <span
            className={cn('grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold', review.avatarColor)}
            aria-hidden
          >
            {review.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3">
              <h3 className="font-medium">{review.name}</h3>
              <time className="text-xs text-muted-foreground">{review.date}</time>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <Stars rating={review.rating} />
              {review.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  Verified purchase
                </span>
              )}
            </div>
          </div>
        </header>
        <p className="mt-3 text-sm leading-relaxed text-pretty" lang={/[\u0980-\u09FF]/.test(review.text) ? 'bn' : 'en'}>
          {review.text}
        </p>
        {review.photos.length > 0 && (
          <ul className="mt-3 flex gap-2 overflow-x-auto">
            {review.photos.map((src, i) => (
              <li key={i} className="shrink-0">
                <Image
                  src={src}
                  alt={`Photo ${i + 1} from ${review.name}`}
                  width={112}
                  height={112}
                  unoptimized={src.startsWith('data:')}
                  className="size-24 rounded-xl border object-cover sm:size-28"
                />
              </li>
            ))}
          </ul>
        )}
        <footer className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onHelpful}
            aria-pressed={!!review.markedHelpful}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors',
              review.markedHelpful ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            <ThumbsUp className={cn('size-3.5', review.markedHelpful && 'fill-current')} aria-hidden />
            Helpful · {review.helpful}
          </button>
        </footer>
      </article>
    </li>
  )
}
