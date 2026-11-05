'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { BadgeCheck, Info, Languages, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import { SHOP } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import type { Lang, Role } from '@/lib/types'
import { Modal } from '@/components/ui/modal'
import { MessageBubble } from './message-bubble'
import { Composer } from './composer'
import { ChatInfoPanel } from './chat-info-panel'
import { AiOrderModal } from './ai-order-modal'

export function ChatScreen() {
  const { state } = useStore()
  const [aiOpen, setAiOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [sellerTyping, setSellerTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const hasChatOrder = state.orders.some((o) => o.fromChat)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [state.messages.length, sellerTyping])

  return (
    <div className="flex h-full">
      <section aria-label="Conversation with Golden Bracelet Shop" className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <span className="relative shrink-0">
            <Image
              src={SHOP.logo}
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-full border object-cover"
            />
            <span
              className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-card bg-emerald-500"
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 truncate font-semibold">
              {SHOP.name}
              <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified seller" />
            </h1>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-emerald-700">Online</span> · Verified seller · {SHOP.responseTime}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:hidden"
          >
            <Info className="size-5" aria-hidden />
            <span className="sr-only">Shop info and verification</span>
          </button>
        </header>

        <ChatToolbar />

        <div className="min-h-0 flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-3xl px-3 py-5 sm:px-6">
            <p className="mb-4 text-center">
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Today</span>
            </p>
            <ol className="space-y-4" aria-label="Messages" aria-live="polite">
              {state.messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {sellerTyping && (
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex gap-1 rounded-2xl rounded-bl-md border bg-card px-3.5 py-3" aria-hidden>
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                  Seller is typing…
                </li>
              )}
            </ol>

            {!hasChatOrder && state.hydrated && (
              <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-primary/20 bg-accent/50 p-4 sm:flex-row sm:items-center">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Order details detected</p>
                  <p className="text-sm text-muted-foreground">
                    Product, price, delivery and payment were mentioned. Turn them into a confirmed order.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiOpen(true)}
                  className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Create order with AI
                </button>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <Composer onOpenAi={() => setAiOpen(true)} onSellerTyping={setSellerTyping} />
      </section>

      <aside className="hidden w-80 shrink-0 overflow-y-auto border-l bg-card p-5 xl:block" aria-label="Shop details">
        <ChatInfoPanel />
      </aside>

      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title="Shop details">
        <ChatInfoPanel />
      </Modal>
      <AiOrderModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; lang?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          lang={o.lang}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            value === o.value ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ChatToolbar() {
  const { state, dispatch } = useStore()

  return (
    <div className="flex items-center gap-x-4 gap-y-2 overflow-x-auto border-b bg-card/60 px-4 py-2 text-xs">
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground">Viewing as</span>
        <Segmented<Role>
          label="Viewing as"
          value={state.role}
          onChange={(role) => dispatch({ type: 'setRole', role })}
          options={[
            { value: 'buyer', label: 'Buyer' },
            { value: 'seller', label: 'Seller' },
          ]}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Languages className="size-4 text-muted-foreground" aria-hidden />
        <Segmented<Lang>
          label="Preferred language"
          value={state.lang}
          onChange={(lang) => dispatch({ type: 'setLang', lang })}
          options={[
            { value: 'en', label: 'English' },
            { value: 'bn', label: 'বাংলা', lang: 'bn' },
          ]}
        />
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span className="text-muted-foreground" aria-hidden>
          Auto-translate
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={state.showTranslations}
          aria-label="Auto-translate messages"
          onClick={() => dispatch({ type: 'toggleTranslations' })}
          className={cn(
            'relative h-5 w-9 rounded-full transition-colors',
            state.showTranslations ? 'bg-primary' : 'bg-input',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform',
              state.showTranslations && 'translate-x-4',
            )}
          />
        </button>
      </div>
    </div>
  )
}
