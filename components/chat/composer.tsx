'use client'

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Paperclip, SendHorizontal, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'
import { SELLER_AUTO_REPLY } from '@/lib/mock-data'
import { nowTime, uid } from '@/lib/format'

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
  const { state, dispatch } = useStore()
  const [text, setText] = useState('')
  const autoReplied = useRef(false)

  const send = (value: string) => {
    const body = value.trim()
    if (!body) return
    dispatch({
      type: 'sendMessage',
      message: { id: uid('new'), sender: state.role, kind: 'text', lang: state.lang, text: body, time: nowTime() },
    })
    setText('')

    const alreadyReplied = autoReplied.current || state.messages.some((m) => m.id.startsWith('auto'))
    if (state.role === 'buyer' && !alreadyReplied) {
      autoReplied.current = true
      setTimeout(() => onSellerTyping(true), 500)
      setTimeout(() => {
        onSellerTyping(false)
        dispatch({
          type: 'sendMessage',
          message: {
            id: uid('auto'),
            sender: 'seller',
            kind: 'text',
            lang: 'bn',
            text: SELLER_AUTO_REPLY.text,
            translation: SELLER_AUTO_REPLY.translation,
            time: nowTime(),
          },
        })
      }, 2000)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(text)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
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
        <button
          type="button"
          onClick={() => toast('Attachments are disabled in the demo', { description: 'Photos and files would be shared here.' })}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Paperclip className="size-5" aria-hidden />
          <span className="sr-only">Attach a file</span>
        </button>
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          lang={state.lang}
          placeholder={state.lang === 'bn' ? 'মেসেজ লিখুন…' : 'Type a message…'}
          className="h-11 min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-[15px] placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onOpenAi}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-primary/30 bg-accent px-3 text-sm font-medium text-accent-foreground transition-colors hover:border-primary/60"
        >
          <Sparkles className="size-4" aria-hidden />
          <span className="hidden sm:inline">Create order with AI</span>
          <span className="sr-only sm:hidden">Create order with AI</span>
        </button>
        <button
          type="submit"
          disabled={!text.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <SendHorizontal className="size-5" aria-hidden />
          <span className="sr-only">Send message</span>
        </button>
      </form>
    </div>
  )
}
