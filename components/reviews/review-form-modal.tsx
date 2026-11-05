'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import Image from 'next/image'
import { ImagePlus, Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useStore } from '@/lib/store'
import { BUYER } from '@/lib/mock-data'
import { nowDate, uid } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Order } from '@/lib/types'

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

function downscale(file: File, max = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}

export function ReviewFormModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const { dispatch } = useStore()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setRating(0)
    setText('')
    setPhoto(null)
    setError(null)
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
      toast.error('Please choose an image file')
      return
    }
    try {
      setPhoto(await downscale(file))
    } catch {
      toast.error('That image could not be loaded')
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!rating) return setError('Choose a star rating.')
    if (text.trim().length < 10) return setError('Write at least 10 characters about your experience.')
    dispatch({
      type: 'addReview',
      orderId: order?.id ?? null,
      review: {
        id: uid('rev'),
        name: BUYER.name,
        initials: 'EC',
        avatarColor: 'bg-sky-100 text-sky-800',
        rating,
        text: text.trim(),
        date: nowDate(),
        photos: photo ? [photo] : [],
        verified: true,
        helpful: 0,
      },
    })
    toast.success('Review published', { description: 'Marked as a verified purchase.' })
    close()
  }

  const shown = hover || rating

  return (
    <Modal
      open={!!order}
      onClose={close}
      title="Write a review"
      description={order ? `${order.product} · Order ${order.ref} · Delivered` : undefined}
      footer={
        <>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="review-form">
            Publish review
          </Button>
        </>
      }
    >
      <form id="review-form" onSubmit={submit} className="space-y-5" noValidate>
        <fieldset>
          <legend className="text-sm font-medium">Your rating</legend>
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
              {RATING_LABELS[shown]}
            </span>
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="review-text" className="text-sm font-medium">
            Your review
          </label>
          <textarea
            id="review-text"
            rows={4}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
            placeholder="How was the product, the seller and the delivery?"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-right text-xs text-muted-foreground">{text.trim().length} characters</p>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">
            Product photo <span className="font-normal text-muted-foreground">(optional)</span>
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
                <span className="sr-only">Remove photo</span>
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground transition-colors focus-within:outline-2 focus-within:outline-ring hover:border-primary/50 hover:bg-accent/40">
              <ImagePlus className="size-5" aria-hidden />
              <span>
                <span className="font-medium text-primary">Upload a photo</span> — stays on this device
              </span>
              <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
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
