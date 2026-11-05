'use client'

import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { Loader2, Paperclip, SendHorizontal, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { langOf } from '@/lib/extract-order'
import { useLang } from '@/lib/i18n'

const QUICK_REPLIES = {
  buyer: ['When will it arrive?', 'Do you have gift wrapping?', 'Can I see another photo?'],
  seller: ['জি, পাঠানো হয়েছে।', 'ধন্যবাদ!', 'আজকেই ডেলিভারি দেওয়া হবে।'],
}

export function Composer({
  onOpenAi,
  onSellerTyping,
}: {
  onOpenAi: () => void
  onSellerTyping: (typing: boolean) => void
}) {
  const { state, actions } = useStore()
  const { t } = useLang()
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const send = (value: string) => {
    const body = value.trim()
    if (!body) return
    const lang = langOf(body)
    actions
      .sendMessage({ kind: 'text', lang, text: body })
      .catch((e) => toast.error(t('chat.msgFail'), { description: e.message }))
    setText('')

  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(text)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('chat.onlyImages'))
      return
    }
    setUploading(true)
    try {
      const url = await actions.uploadImage(file)
      await actions.sendMessage({ kind: 'image', imageUrl: url })
    } catch (err) {
      toast.error(t('chat.uploadFail'), { description: err instanceof Error ? err.message : undefined })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border-t bg-card px-3 pt-2 pb-3 sm:px-4">
      <div className="mb-2 flex gap-2 overflow-x-auto pb-0.5" aria-label="Quick replies" role="group">
        {QUICK_REPLIES[state.role].map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            lang={state.role === 'seller' ? 'bn' : 'en'}
            className="shrink-0 rounded-full border border-primary/30 px-3 py-1 text-xs text-accent-foreground transition-colors hover:bg-accent"
          >
            {q}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="sr-only" />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <Paperclip className="size-5" aria-hidden />
          )}
          <span className="sr-only">{t('chat.attach')}</span>
        </button>
        <label htmlFor="chat-input" className="sr-only">
          {t('chat.msgPlaceholder')}
        </label>
        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          lang={state.lang}
          placeholder={t('chat.msgPlaceholder')}
          className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-[15px] placeholder:text-muted-foreground"
        />
        {state.accountRole === 'merchant' && (
          <button
            type="button"
            onClick={onOpenAi}
            className="inline-flex h-11 items-center gap-1.5 rounded-full border border-primary/30 bg-accent px-3 text-sm font-medium text-accent-foreground transition-colors hover:border-primary/60"
          >
            <Sparkles className="size-4" aria-hidden />
            <span className="hidden sm:inline">{t('chat.createAi')}</span>
            <span className="sr-only sm:hidden">{t('chat.createAi')}</span>
          </button>
        )}
        <button
          type="submit"
          disabled={!text.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <SendHorizontal className="size-5" aria-hidden />
          <span className="sr-only">{t('chat.send')}</span>
        </button>
      </form>
    </div>
  )
}
