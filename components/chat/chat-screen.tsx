'use client'

import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, Info, Languages, MessageCircle, Sparkles, Store } from 'lucide-react'
import { useStore } from '@/lib/store'
import { hasOrderSignals } from '@/lib/extract-order'
import { useLang } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { Lang } from '@/lib/types'
import { Modal } from '@/components/ui/modal'
import { MessageBubble } from './message-bubble'
import { Composer } from './composer'
import { ChatInfoPanel } from './chat-info-panel'
import { AiOrderModal } from './ai-order-modal'

export function ChatScreen() {
  const { state } = useStore()
  const { t } = useLang()
  const [aiOpen, setAiOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [sellerTyping, setSellerTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const active = state.conversations.find((c) => c.id === state.activeConversationId) ?? null
  const messages = state.messages.filter((m) => m.conversationId === state.activeConversationId)
  const hasChatOrder = state.orders.some((o) => o.fromChat && o.conversationId === state.activeConversationId)
  const showAiCard = state.accountRole === 'shopper' && !hasChatOrder && hasOrderSignals(messages)
  const peerName = state.accountRole === 'merchant'
    ? active?.shopper_email || 'Shopper'
    : active?.merchant_name || 'Merchant'

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [state.messages.length, sellerTyping])

  if (!active) return <EmptyChat />

  return (
    <div className="flex h-full">
      <section aria-label={`Conversation with ${peerName}`} className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <span className="relative shrink-0">
            <span className="grid size-11 place-items-center rounded-full border bg-accent font-semibold text-primary">
              {peerName.slice(0, 1).toUpperCase()}
            </span>
            <span
              className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-card bg-emerald-500"
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 truncate font-semibold">
              {peerName}
              {state.accountRole === 'shopper' && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified seller" />}
            </h1>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-primary">{t('chat.online')}</span> · Verified seller · {t('chat.responseTime')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className={cn('rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:hidden', state.accountRole === 'merchant' && 'hidden')}
          >
            <Info className="size-5" aria-hidden />
            <span className="sr-only">{t('chat.about')}</span>
          </button>
        </header>

        <ConversationBar />
        <ChatToolbar />

        <div className="min-h-0 flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-3xl px-3 py-5 sm:px-6">
            <p className="mb-4 text-center">
              <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                {state.lang === 'bn' ? 'আজ' : 'Today'}
              </span>
            </p>
            <ol className="space-y-4" aria-label="Messages" aria-live="polite">
              {messages.map((m) => (
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
                  {t('chat.seller')} {t('chat.typing')}
                </li>
              )}
            </ol>

            {showAiCard && (
              <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-primary/20 bg-accent/50 p-4 sm:flex-row sm:items-center">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{t('chat.aiDetected')}</p>
                  <p className="text-sm text-muted-foreground">{t('chat.aiDetectedDesc')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiOpen(true)}
                  className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t('chat.createAi')}
                </button>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        <Composer onOpenAi={() => setAiOpen(true)} onSellerTyping={setSellerTyping} />
      </section>

      <aside className={cn('hidden w-80 shrink-0 overflow-y-auto border-l bg-card p-5 xl:block', state.accountRole === 'merchant' && 'xl:hidden')} aria-label="Shop details">
        <ChatInfoPanel />
      </aside>

      <Modal open={state.accountRole === 'shopper' && infoOpen} onClose={() => setInfoOpen(false)} title={t('chat.about')}>
        <ChatInfoPanel />
      </Modal>
      <AiOrderModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}

function EmptyChat() {
  const { state, actions } = useStore()
  const merchant = state.accountRole === 'merchant'
  return (
    <div className="grid h-full place-items-center overflow-y-auto p-6">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
          {merchant ? <MessageCircle className="size-6" /> : <Store className="size-6" />}
        </span>
        <h1 className="mt-4 text-xl font-semibold">{merchant ? 'No shopper conversations yet' : 'Start a conversation'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {merchant ? 'New shopper messages will appear here.' : 'Choose a registered merchant to begin chatting.'}
        </p>
        {!merchant && (
          <div className="mt-5 space-y-2 text-left">
            {state.merchants.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">No merchant accounts are available yet.</p>
            ) : state.merchants.map((item) => (
              <button key={item.id} type="button" onClick={() => actions.startConversation(item.id)} className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-primary/50">
                <span className="grid size-10 place-items-center rounded-full bg-accent font-semibold text-primary">{item.name.slice(0, 1).toUpperCase()}</span>
                <span><span className="block font-medium">{item.name}</span><span className="text-xs text-muted-foreground">{item.category || 'Merchant'}</span></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ConversationBar() {
  const { state, dispatch, actions } = useStore()
  const unusedMerchants = state.merchants.filter((merchant) => !state.conversations.some((conversation) => conversation.merchant_id === merchant.id))
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b bg-card/80 px-3 py-2">
      {state.conversations.map((conversation) => {
        const label = state.accountRole === 'merchant' ? conversation.shopper_email || 'Shopper' : conversation.merchant_name || 'Merchant'
        return (
          <button key={conversation.id} type="button" onClick={() => dispatch({ type: 'selectConversation', id: conversation.id })}
            className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors', state.activeConversationId === conversation.id ? 'border-primary bg-accent text-primary' : 'bg-background text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        )
      })}
      {unusedMerchants.map((merchant) => (
        <button key={merchant.id} type="button" onClick={() => actions.startConversation(merchant.id)} className="shrink-0 rounded-full border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary">
          + {merchant.name}
        </button>
      ))}
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
  const { t } = useLang()

  return (
    <div className="flex items-center gap-x-4 gap-y-2 overflow-x-auto border-b bg-card/60 px-4 py-2 text-xs">
      <div className="hidden shrink-0 items-center gap-2">
        <span className="text-muted-foreground">{t('chat.viewAs')}</span>
        <Segmented<'buyer' | 'seller'>
          label={t('chat.viewAs')}
          value={state.role}
          onChange={(role) => dispatch({ type: 'setRole', role })}
          options={[
            { value: 'buyer', label: t('chat.roleBuyer') },
            { value: 'seller', label: t('chat.roleSeller') },
          ]}
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Languages className="size-4 text-muted-foreground" aria-hidden />
        <Segmented<Lang>
          label={t('chat.translations')}
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
          {state.showTranslations ? t('chat.translationsOn') : t('chat.translationsOff')}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={state.showTranslations}
          aria-label={t('chat.translations')}
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
