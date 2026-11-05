'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2, Pencil, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { PhoneBadge } from '@/components/shared/badges'
import { PhoneVerifyButton } from '@/components/trust/phone-verify'
import { useStore } from '@/lib/store'
import { SHOP } from '@/lib/constants'
import { extractOrder, type Extraction } from '@/lib/extract-order'
import { formatTaka, orderTotal, paymentLabels } from '@/lib/format'
import { useLang, interpolate } from '@/lib/i18n'
import type { OrderDraft, PaymentMethod } from '@/lib/types'
import { cn } from '@/lib/utils'

const ANALYSIS_KEYS = ['ai.step1', 'ai.step2', 'ai.step3']

type Errors = Partial<Record<keyof OrderDraft, string>>

function validate(d: OrderDraft, t: (k: string) => string): Errors {
  const errors: Errors = {}
  if (!d.product.trim()) errors.product = t('ai.reqProduct')
  if (!Number.isInteger(d.quantity) || d.quantity < 1 || d.quantity > 20)
    errors.quantity = t('ai.reqQty')
  if (!Number.isFinite(d.unitPrice) || d.unitPrice <= 0) errors.unitPrice = t('ai.reqPrice')
  if (!Number.isFinite(d.deliveryFee) || d.deliveryFee < 0) errors.deliveryFee = t('ai.reqFee')
  if (d.address.trim().length < 3) errors.address = t('ai.reqAddress')
  return errors
}

export function AiOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch, actions } = useStore()
  const { t } = useLang()
  const [phase, setPhase] = useState<'analyzing' | 'ready' | 'saving'>('analyzing')
  const [step, setStep] = useState(0)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<OrderDraft | null>(null)
  const [sources, setSources] = useState<Extraction['sources'] | null>(null)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => {
    if (!open) return
    setPhase('analyzing')
    setStep(0)
    setEditing(false)
    setErrors({})
    const timers = [
      setTimeout(() => setStep(1), 450),
      setTimeout(() => setStep(2), 900),
    ]
    // The server reads the whole conversation through an LLM when configured;
    // otherwise we fall back to the local extractor.
    const analyse = async () => {
      try {
        const res = await fetch('/api/extract-order', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: state.messages.filter((message) => message.conversationId === state.activeConversationId) }),
        })
        if (!res.ok) throw new Error()
        const ai = await res.json()
        setDraft(ai)
        setSources(null)
      } catch {
        const { draft, sources } = extractOrder(state.messages.filter((message) => message.conversationId === state.activeConversationId))
        setDraft(draft)
        setSources(sources)
      }
      setPhase('ready')
    }
    const t3 = setTimeout(analyse, 1200)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(t3)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const update = <K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const confirm = async () => {
    if (!draft) return
    const found = validate(draft, t)
    if (Object.keys(found).length) {
      setErrors(found)
      setEditing(true)
      return
    }
    setPhase('saving')
    try {
      const { orderId, ref } = await actions.confirmOrder(draft)
      onClose()
      toast.success(interpolate(t('ai.confirmed'), { ref }), {
        description: interpolate(t('ai.confirmedDesc'), {
          product: draft.product,
          total: formatTaka(orderTotal(draft)),
        }),
        action: {
          label: t('ai.view'),
          onClick: () => {
            dispatch({ type: 'setTab', tab: 'orders' })
            dispatch({ type: 'openOrder', id: orderId })
          },
        },
      })
    } catch (e) {
      setPhase('ready')
      toast.error(t('ai.fail'), {
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="sm:max-w-xl"
      title={
        <span className="inline-flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          {t('ai.title')}
        </span>
      }
      description={interpolate(t('ai.desc'), { shop: SHOP.name })}
      footer={
        phase === 'ready' && draft ? (
          <>
            <Button type="button" variant="outline" onClick={() => setEditing((e) => !e)}>
              {editing ? <Check aria-hidden /> : <Pencil aria-hidden />}
              {editing ? t('ai.done') : t('ai.edit')}
            </Button>
            <Button type="button" onClick={confirm}>
              <Check aria-hidden />
              {t('ai.confirm')} · {formatTaka(orderTotal(draft))}
            </Button>
          </>
        ) : phase === 'saving' ? (
          <Button type="button" disabled>
            <Loader2 className="animate-spin" aria-hidden />
            {t('ai.confirming')}
          </Button>
        ) : undefined
      }
    >
      {phase === 'analyzing' ? (
        <div className="py-6" role="status" aria-live="polite">
          <ul className="space-y-3">
            {ANALYSIS_KEYS.map((key, i) => (
              <li key={key} className="flex items-center gap-3 text-sm">
                {i < step ? (
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" aria-hidden />
                  </span>
                ) : i === step ? (
                  <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
                ) : (
                  <span className="size-5 rounded-full border-2 border-border" aria-hidden />
                )}
                <span className={cn(i > step && 'text-muted-foreground')}>{t(key)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ) : draft ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold-foreground">
              <Sparkles className="size-3" aria-hidden />
              {t('ai.badge')}
            </span>
          </div>

          {editing ? (
            <EditFields draft={draft} errors={errors} update={update} />
          ) : (
            <dl className="divide-y rounded-xl border">
              <Row label={t('ai.product')} value={draft.product} source={sources?.product} />
              <Row label={t('ai.quantity')} value={String(draft.quantity)} source={sources?.quantity} />
              <Row label={t('ai.unitPrice')} value={formatTaka(draft.unitPrice)} source={sources?.unitPrice} />
              <Row label={t('ai.deliveryFee')} value={formatTaka(draft.deliveryFee)} source={sources?.deliveryFee} />
              <Row label={t('ai.payment')} value={paymentLabels[draft.payment]} source={sources?.payment} />
              <Row label={t('ai.address')} value={draft.address || '—'} source={sources?.address} />
            </dl>
          )}

          <div className="rounded-xl bg-muted/60 px-4 py-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {t('ai.subtotal')} ({draft.quantity || 0} × {formatTaka(draft.unitPrice || 0)})
              </span>
              <span>{formatTaka((draft.quantity || 0) * (draft.unitPrice || 0))}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t('ai.delivery')}</span>
              <span>{formatTaka(draft.deliveryFee || 0)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t pt-2">
              <span className="font-semibold">{t('ai.total')}</span>
              <output aria-live="polite" className="text-xl font-semibold text-primary tabular-nums">
                {formatTaka(orderTotal({
                  quantity: draft.quantity || 0,
                  unitPrice: draft.unitPrice || 0,
                  deliveryFee: draft.deliveryFee || 0,
                }))}
              </output>
            </div>
          </div>

          {!draft.address.trim() && (
            <p className="text-sm text-gold-foreground" role="note">
              {t('ai.noAddress')}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">{t('ai.trustCheck')}</p>
              <PhoneBadge verified={state.phoneVerified} />
            </div>
            <PhoneVerifyButton />
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

function Row({ label, value, source }: { label: string; value: string; source?: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 px-4 py-2.5 sm:grid-cols-[9rem_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0">
        <p className="text-sm font-medium">{value}</p>
        {source && (
          <p className="truncate text-[11px] text-muted-foreground" title={source}>
            {source}
          </p>
        )}
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
  const { t } = useLang()
  const num = (v: string) => (v === '' ? Number.NaN : Number(v))

  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      <legend className="sr-only">{t('ai.edit')}</legend>
      <Field id="f-product" label={t('ai.productName')} error={errors.product} className="sm:col-span-2">
        <input
          id="f-product"
          className={inputClass}
          value={draft.product}
          onChange={(e) => update('product', e.target.value)}
          aria-invalid={!!errors.product}
        />
      </Field>
      <Field id="f-qty" label={t('ai.quantity')} error={errors.quantity}>
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
      <Field id="f-price" label={t('ai.pricePh')} error={errors.unitPrice}>
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
      <Field id="f-fee" label={t('ai.feePh')} error={errors.deliveryFee}>
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
      <Field id="f-pay" label={t('ai.paymentMethod')}>
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
      <Field id="f-address" label={t('ai.address')} error={errors.address} className="sm:col-span-2">
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
