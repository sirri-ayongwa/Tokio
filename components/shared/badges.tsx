import { BadgeCheck, ShieldAlert, ShieldCheck, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

export function VerifiedSellerBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground',
        className,
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden />
      Verified seller
    </span>
  )
}

export function PhoneBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      <ShieldCheck className="size-3.5" aria-hidden />
      Phone verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-xs font-medium text-gold-foreground">
      <ShieldAlert className="size-3.5" aria-hidden />
      Phone unverified
    </span>
  )
}

const statusStyles: Record<OrderStatus, string> = {
  active: 'bg-sky-50 text-sky-800 ring-sky-200',
  completed: 'bg-accent text-accent-foreground ring-emerald-200',
  cancelled: 'bg-red-50 text-red-700 ring-red-200',
}

export function StatusPill({ status, label }: { status: OrderStatus; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        statusStyles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn(
            size === 'sm' ? 'size-3.5' : 'size-4',
            n <= Math.round(rating) ? 'fill-gold text-gold' : 'fill-muted text-border',
          )}
        />
      ))}
    </span>
  )
}
