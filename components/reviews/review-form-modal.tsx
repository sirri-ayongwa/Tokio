'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import Image from 'next/image'
import { ImagePlus, Loader2, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useStore } from '@/lib/store'
import { useLang, interpolate } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'

const RATING_KEYS = ['', 'rf.rate1', 'rf.rate2', 'rf.rate3', 'rf.rate4', 'rf.rate5']

export function ReviewFormModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { actions } = useStore()
  const { t } = useLang()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setRating(0)
    setText('')
    setPhoto(null)
    setError(null)
    setSaving(false)
  }

  const close = () => {
    onClose()
    reset()
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('rf.imageOnly'))
      return
    }
    setUploading(true)
    try {
      setPhoto(await actions.uploadImage(file))
    } catch (err) {
      toast.error(t('rf.uploadFail'), { description: err instanceof Error ? err.message : undefined })
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!order) return
    if (!rating) return setError(t('rf.needRating'))
    if (text.trim().length < 10) return setError(t('rf.needText'))
    setSaving(true)
    try {
      await actions.addReview({
        orderId: order.id,
        rating,
        text: text.trim(),
        photos: photo ? [photo] : [],
      })
      toast.success(t('rf.published'), { description: t('rf.publishedDesc') })
      close()
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error ? err.message : t('rf.fail'))
    }
  }

  const shown = hover || rating

  return (
    <Modal
      open={!!order}
      onClose={close}
      title={t('rf.title')}
      description={
        order
          ? interpolate(t('rf.desc'), { product: order.product, ref: order.ref })
          : undefined
      }
      footer={
        <>
          <Button type="button" variant="outline" onClick={close}>
            {t('rf.cancel')}
          </Button>
          <Button type="submit" form="review-form" disabled={saving || uploading}>
            {saving && <Loader2 className="animate-spin" aria-hidden />}
            {t('rf.publish')}
          </Button>
        </>
      }
    >
      <form id="review-form" onSubmit={submit} className="space-y-5" noValidate>
        <fieldset>
          <legend className="text-sm font-medium">{t('rf.rating')}</legend>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="cursor-pointer p-0.5" onMouseEnter={() => setHover(n)}>
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={rating === n}
                    onChange={() => {
                      setRating(n)
                      setError(null)
                    }}
                    className="peer sr-only"
                  />
                  <span className="sr-only">
                    {n} star{n > 1 && 's'}
                  </span>
                  <Star
                    aria-hidden
                    className={cn(
                      'size-8 rounded transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-ring',
                      n <= shown ? 'fill-gold text-gold' : 'text-border',
                    )}
                  />
                </label>
              ))}
            </div>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {shown ? t(RATING_KEYS[shown]) : ''}
            </span>
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="review-text" className="text-sm font-medium">
            {t('rf.text')}
          </label>
          <textarea
            id="review-text"
            rows={4}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
            placeholder={t('rf.ph')}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-right text-xs text-muted-foreground">
            {text.trim().length} {t('rf.characters')}
          </p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">
            {t('rf.photo')} <span className="font-normal text-muted-foreground">({t('rf.optional')})</span>
          </p>
          {photo ? (
            <div className="relative inline-block">
              <Image
                src={photo}
                alt="Preview of your uploaded photo"
                width={112}
                height={112}
                unoptimized
                className="size-28 rounded-xl border object-cover"
              />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border bg-card shadow-sm"
              >
                <X className="size-3.5" aria-hidden />
                <span className="sr-only">{t('rf.remove')}</span>
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground transition-colors focus-within:outline-2 focus-within:outline-ring hover:border-primary/50 hover:bg-accent/40">
              {uploading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="size-5" aria-hidden />
              )}
              <span>
                <span className="font-medium text-primary">
                  {uploading ? t('rf.uploading') : t('rf.upload')}
                </span>{' '}
                — {t('rf.stored')}
              </span>
              <input type="file" accept="image/*" onChange={onFile} disabled={uploading} className="sr-only" />
            </label>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
