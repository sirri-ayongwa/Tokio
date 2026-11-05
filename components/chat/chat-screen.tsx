'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { BadgeCheck, Info, Languages, MessageCircle, Search, Sparkles, Store } from 'lucide-react'
import { useStore } from '@/lib/store'
import { hasOrderSignals } from '@/lib/extract-order'
import { useLang } from '@/lib/i18n'
import { responseLabel } from '@/lib/format'
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
  const showAiCard = state.accountRole === 'merchant' && !hasChatOrder && hasOrderSignals(messages)
  const peerName = state.accountRole === 'merchant'
    ? active?.shopper_name || active?.shopper_email || 'Shopper'
    : active?.merchant_name || 'Merchant'
  const peerAvatar = state.accountRole === 'merchant' ? active?.shopper_avatar_url : active?.merchant_avatar_url
  const peerOnline = state.accountRole === 'merchant' ? active?.shopper_online : active?.merchant_online

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [state.messages.length, sellerTyping])

  useEffect(() => {
    if (!state.activeConversationId) return
    fetch(`/api/conversations/${state.activeConversationId}/read`, { method: 'POST' }).catch(() => {})
  }, [state.activeConversationId, messages.length])

  if (!active) return <EmptyChat />

  return (
    <div className="flex h-full">
      <section aria-label={`Conversation with ${peerName}`} className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <span className="relative shrink-0">
            <span className="grid size-11 place-items-center rounded-full border bg-accent font-semibold text-primary">
              {peerAvatar
                ? <Image src={peerAvatar} alt="" width={44} height={44} unoptimized className="size-full rounded-full object-cover" />
                : peerName.slice(0, 1).toUpperCase()}
            </span>
            <span
              className={cn('absolute right-0 bottom-0 size-3 rounded-full border-2 border-card', peerOnline ? 'bg-emerald-500' : 'bg-red-500')}
              aria-hidden
            />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-1.5 truncate font-semibold">
              {peerName}
              {((state.accountRole === 'shopper' && active.merchant_verified) || (state.accountRole === 'merchant' && active.shopper_verified)) && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified account" />}
            </h1>
            <p className="text-xs text-muted-foreground">
              <span className={cn('font-medium', peerOnline ? 'text-primary' : 'text-red-500')}>
                {peerOnline ? t('chat.online') : t('chat.offline')}
              </span>{' · '}{state.accountRole === 'merchant' ? 'Shopper' : active.merchant_category || 'Merchant'}
            </p>
            {state.accountRole === 'shopper' && (
              <p className="mt-0.5 text-[11px] italic text-muted-foreground">{responseLabel(active.response_seconds)}</p>
            )}
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
                <MessageBubble key={m.id} message={m} onReorder={() => setAiOpen(true)} />
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
      <AiOrderModal open={state.accountRole === 'merchant' && aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}

function EmptyChat() {
  const { state, actions } = useStore()
  const merchant = state.accountRole === 'merchant'
  const [query, setQuery] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const merchants = state.merchants.filter((item) => `${item.name} ${item.category ?? ''}`.toLowerCase().includes(query.toLowerCase()))
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
          <div
            className="relative mt-5 text-left"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPickerOpen(false)
            }}
          >
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onFocus={() => setPickerOpen(true)}
                onChange={(event) => { setQuery(event.target.value); setPickerOpen(true) }}
                placeholder="Search businesses"
                role="combobox"
                aria-expanded={pickerOpen}
                aria-controls="business-search-results"
                className="h-11 w-full rounded-xl border bg-card pl-10 pr-3 text-sm"
              />
            </label>
            {pickerOpen && <div id="business-search-results" className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 space-y-1 overflow-y-auto rounded-xl border bg-card p-2 shadow-xl">
            {state.merchantLoadStatus === 'error' ? (
              <p className="p-3 text-center text-sm text-destructive">Businesses could not be loaded. Please reload the page and try again.</p>
            ) : merchants.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">{state.merchantLoadStatus === 'loading' ? 'Loading businesses…' : 'No merchant accounts are available yet.'}</p>
            ) : merchants.map((item) => (
              <button key={item.id} type="button" onClick={() => void actions.startConversation(item.id)} className="flex w-full items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted focus:bg-muted">
                <span className="grid size-10 place-items-center rounded-full bg-accent font-semibold text-primary">{item.name.slice(0, 1).toUpperCase()}</span>
                <span><span className="block font-medium">{item.name}</span><span className="text-xs text-muted-foreground">{item.category || 'Merchant'}</span></span>
              </button>
            ))}
            </div>}
          </div>
        )}
      </div>
    </div>
  )
}

function ConversationBar() {
  const { state, dispatch, actions } = useStore()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const shopper = state.accountRole === 'shopper'
  const merchants = state.merchants.filter((merchant) =>
    `${merchant.name} ${merchant.category ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const chooseMerchant = async (merchantId: string) => {
    const existing = state.conversations.find((conversation) => conversation.merchant_id === merchantId)
    if (existing) dispatch({ type: 'selectConversation', id: existing.id })
    else await actions.startConversation(merchantId)
    setPickerOpen(false)
    setQuery('')
  }

  return (
    <div className="relative border-b bg-card/80">
      <div className="flex items-center gap-2 overflow-x-auto px-3 py-2">
        {state.conversations.map((conversation) => {
          const label = state.accountRole === 'merchant' ? conversation.shopper_name || conversation.shopper_email || 'Shopper' : conversation.merchant_name || 'Merchant'
          return (
            <button key={conversation.id} type="button" onClick={() => dispatch({ type: 'selectConversation', id: conversation.id })}
              className={cn('shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors', state.activeConversationId === conversation.id ? 'border-primary bg-accent text-primary' : 'bg-background text-muted-foreground hover:text-foreground')}>
              {label}
            </button>
          )
        })}
        {shopper && (
          <button type="button" onClick={() => setPickerOpen((open) => !open)} aria-expanded={pickerOpen}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary">
            <Search className="size-3.5" aria-hidden /> Find a business
          </button>
        )}
      </div>
      {shopper && pickerOpen && (
        <div className="absolute left-3 right-3 top-full z-30 mt-1 rounded-xl border bg-card p-3 shadow-xl sm:right-auto sm:w-96">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all businesses" className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm" />
          </label>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {merchants.length === 0 ? (
              <p className="p-3 text-center text-sm text-muted-foreground">No businesses match your search.</p>
            ) : merchants.map((merchant) => {
              const isOpen = state.conversations.some((conversation) => conversation.merchant_id === merchant.id)
              return (
                <button key={merchant.id} type="button" onClick={() => void chooseMerchant(merchant.id)} className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left hover:bg-muted">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent font-semibold text-primary">{merchant.name.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{merchant.name}</span><span className="block truncate text-xs text-muted-foreground">{merchant.category || 'Merchant'}</span></span>
                  {isOpen && <span className="text-[11px] text-primary">Open</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
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
