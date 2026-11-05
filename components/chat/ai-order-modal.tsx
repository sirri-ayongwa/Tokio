'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Pencil, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { PhoneBadge } from '@/components/shared/badges'
import { PhoneVerifyButton } from '@/components/trust/phone-verify'
import { useStore } from '@/lib/store'
import { AI_DRAFT, AI_SOURCES, BUYER, PRODUCT, SHOP } from '@/lib/mock-data'
import { formatTaka, nowDate, nowStamp, nowTime, orderTotal, paymentLabels } from '@/lib/format'
import type { Order, OrderDraft, PaymentMethod } from '@/lib/types'
import { cn } from '@/lib/utils'

const ANALYSIS_STEPS = ['Reading 3 messages', 'Translating বাংলা → English', 'Extracting order details']

type Errors = Partial<Record<keyof OrderDraft, string>>

function validate(d: OrderDraft): Errors {
  const errors: Errors = {}
  if (!d.product.trim()) errors.product = 'Product name is required.'
  if (!Number.isInteger(d.quantity) || d.quantity < 1 || d.quantity > 20)
    errors.quantity = 'Quantity must be a whole number from 1 to 20.'
  if (!Number.isFinite(d.unitPrice) || d.unitPrice <= 0) errors.unitPrice = 'Price must be greater than ৳0.'
  if (!Number.isFinite(d.deliveryFee) || d.deliveryFee < 0) errors.deliveryFee = 'Delivery fee can’t be negative.'
  if (d.address.trim().length < 3) errors.address = 'Enter a delivery address.'
  return errors
}

export function AiOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore()
  const [phase, setPhase] = useState<'analyzing' | 'ready'>('analyzing')
  const [step, setStep] = useState(0)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<OrderDraft>(AI_DRAFT)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    if (!open) return
    setPhase('analyzing')
    setStep(0)
    setEditing(false)
    setDraft(AI_DRAFT)
    setErrors({})
    const timers = [
      setTimeout(() => setStep(1), 450),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setPhase('ready'), 1400),
    ]
    return () => timers.forEach(clearTimeout)
  }, [open])

  const update = <K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const confirm = () => {
    const found = validate(draft)
    if (Object.keys(found).length) {
      setErrors(found)
      setEditing(true)
      return
    }
    const chatOrders = state.orders.filter((o) => o.fromChat).length
    const stamp = nowStamp()
    const order: Order = {
      ...draft,
      product: draft.product.trim(),
      address: draft.address.trim(),
      id: `o-${Date.now()}`,
      ref: `OB-${1048 + chatOrders}`,
      image: PRODUCT.image,
      customer: BUYER.name,
      customerPhoneVerified: state.phoneVerified,
      seller: SHOP.name,
      createdAt: nowDate(),
      status: 'active',
      trackingRef: `PATHAO-DEMO-${String(chatOrders + 1).padStart(3, '0')}`,
      trackingStage: 1,
      trackingTimes: [stamp, stamp, null, null, null],
      reviewed: false,
      fromChat: true,
    }
    dispatch({
      type: 'confirmOrder',
      order,
      message: { id: `order-${order.id}`, sender: 'buyer', kind: 'order', orderId: order.id, time: nowTime() },
    })
    onClose()
    toast.success(`Order ${order.ref} confirmed`, {
      description: `${order.product} · ${formatTaka(orderTotal(order))} · Added to Orders`,
      action: {
        label: 'View',
        onClick: () => {
          dispatch({ type: 'setTab', tab: 'orders' })
          dispatch({ type: 'openOrder', id: order.id })
        },
      },
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-xl"
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          AI order assistant
        </span>
      }
      description="Order details found in your conversation with Golden Bracelet Shop."
      footer={
        phase === 'ready' && (
          <>
            <Button type="button" variant="outline" onClick={() => setEditing((e) => !e)}>
              {editing ? <Check aria-hidden /> : <Pencil aria-hidden />}
              {editing ? 'Done editing' : 'Edit order'}
            </Button>
            <Button type="button" onClick={confirm}>
              <Check aria-hidden />
              Confirm order · {formatTaka(orderTotal(draft))}
            </Button>
          </>
        )
      }
    >
      {phase === 'analyzing' ? (
        <div className="py-6" role="status" aria-live="polite">
          <ul className="space-y-3">
            {ANALYSIS_STEPS.map((label, i) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                {i < step ? (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" aria-hidden />
                  </span>
                ) : i === step ? (
                  <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
                ) : (
                  <span className="size-5 rounded-full border-2 border-border" aria-hidden />
                )}
                <span className={cn(i > step && 'text-muted-foreground')}>{label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold-foreground">
              <Sparkles className="size-3" aria-hidden />
              AI-generated draft — please review
            </span>
            <span className="text-xs text-muted-foreground">Simulated extraction · no AI service connected</span>
          </div>

          {editing ? (
            <EditFields draft={draft} errors={errors} update={update} />
          ) : (
            <dl className="divide-y rounded-xl border">
              <Row label="Product" value={draft.product} source={AI_SOURCES.product} />
              <Row label="Quantity" value={String(draft.quantity)} source={AI_SOURCES.quantity} />
              <Row label="Unit price" value={formatTaka(draft.unitPrice)} source={AI_SOURCES.unitPrice} />
              <Row label="Delivery fee" value={formatTaka(draft.deliveryFee)} source={AI_SOURCES.deliveryFee} />
              <Row label="Payment" value={paymentLabels[draft.payment]} source={AI_SOURCES.payment} />
              <Row label="Delivery address" value={draft.address} source={AI_SOURCES.address} />
            </dl>
          )}

          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Subtotal ({draft.quantity || 0} × {formatTaka(draft.unitPrice || 0)})
              </span>
              <span>{formatTaka((draft.quantity || 0) * (draft.unitPrice || 0))}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery</span>
              <span>{formatTaka(draft.deliveryFee || 0)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t pt-2">
              <span className="font-semibold">Total</span>
              <output aria-live="polite" className="text-xl font-semibold text-primary tabular-nums">
                {formatTaka(orderTotal({
                  quantity: draft.quantity || 0,
                  unitPrice: draft.unitPrice || 0,
                  deliveryFee: draft.deliveryFee || 0,
                }))}
              </output>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Buyer trust check</p>
              <PhoneBadge verified={state.phoneVerified} />
            </div>
            <PhoneVerifyButton />
          </div>
        </div>
      )}
    </Modal>
  )
}

function Row({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-2.5 sm:grid-cols-[9rem_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0">
        <p className="text-sm font-medium">{value}</p>
        <p className="truncate text-[11px] text-muted-foreground" title={source}>
          {source}
        </p>
      </dd>
    </div>
  )
}

const inputClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors aria-invalid:border-destructive'

function EditFields({
  draft,
  errors,
  update,
}: {
  draft: OrderDraft
  errors: Errors
  update: <K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) => void
}) {
  const num = (v: string) => (v === '' ? Number.NaN : Number(v))

  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">Edit order details</legend>
      <Field id="f-product" label="Product name" error={errors.product} className="sm:col-span-2">
        <input
          id="f-product"
          className={inputClass}
          value={draft.product}
          onChange={(e) => update('product', e.target.value)}
          aria-invalid={!!errors.product}
        />
      </Field>
      <Field id="f-qty" label="Quantity" error={errors.quantity}>
        <div className="flex">
          <button
            type="button"
            className="h-10 w-10 rounded-l-lg border border-r-0 border-input text-lg hover:bg-muted"
            onClick={() => update('quantity', Math.max(1, (draft.quantity || 1) - 1))}
          >
            <span aria-hidden>−</span>
            <span className="sr-only">Decrease quantity</span>
          </button>
          <input
            id="f-qty"
            type="number"
            min={1}
            max={20}
            step={1}
            inputMode="numeric"
            className={cn(inputClass, 'rounded-none text-center')}
            value={Number.isNaN(draft.quantity) ? '' : draft.quantity}
            onChange={(e) => update('quantity', num(e.target.value))}
            aria-invalid={!!errors.quantity}
          />
          <button
            type="button"
            className="h-10 w-10 rounded-r-lg border border-l-0 border-input text-lg hover:bg-muted"
            onClick={() => update('quantity', Math.min(20, (draft.quantity || 0) + 1))}
          >
            <span aria-hidden>+</span>
            <span className="sr-only">Increase quantity</span>
          </button>
        </div>
      </Field>
      <Field id="f-price" label="Unit price (৳)" error={errors.unitPrice}>
        <input
          id="f-price"
          type="number"
          min={0}
          inputMode="decimal"
          className={inputClass}
          value={Number.isNaN(draft.unitPrice) ? '' : draft.unitPrice}
          onChange={(e) => update('unitPrice', num(e.target.value))}
          aria-invalid={!!errors.unitPrice}
        />
      </Field>
      <Field id="f-fee" label="Delivery fee (৳)" error={errors.deliveryFee}>
        <input
          id="f-fee"
          type="number"
          min={0}
          inputMode="decimal"
          className={inputClass}
          value={Number.isNaN(draft.deliveryFee) ? '' : draft.deliveryFee}
          onChange={(e) => update('deliveryFee', num(e.target.value))}
          aria-invalid={!!errors.deliveryFee}
        />
      </Field>
      <Field id="f-pay" label="Payment method">
        <select
          id="f-pay"
          className={inputClass}
          value={draft.payment}
          onChange={(e) => update('payment', e.target.value as PaymentMethod)}
        >
          <option value="cod">{paymentLabels.cod}</option>
          <option value="bkash">{paymentLabels.bkash}</option>
        </select>
      </Field>
      <Field id="f-address" label="Delivery address" error={errors.address} className="sm:col-span-2">
        <textarea
          id="f-address"
          rows={2}
          className={cn(inputClass, 'h-auto py-2')}
          value={draft.address}
          onChange={(e) => update('address', e.target.value)}
          aria-invalid={!!errors.address}
        />
      </Field>
    </fieldset>
  )
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string
  label: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
