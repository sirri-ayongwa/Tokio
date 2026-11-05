'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { createRealtimeClient, type SealedLiveQuery } from '@neon/realtime/client'
import { RealtimeProvider, useLiveQuery } from '@neon/realtime-react'
import { PRODUCT } from './constants'
import { fmtDate, fmtTime } from './format'
import type {
  AccountRole,
  Conversation,
  Lang,
  Message,
  MessageRow,
  Merchant,
  Order,
  OrderDraft,
  OrderRow,
  ProfileRow,
  Product,
  Review,
  ReviewMarkRow,
  ReviewRow,
  Role,
  Tab,
  LiveKind,
} from './types'

export interface SessionUser {
  id: string
  name: string
  email: string
}

interface PersistedPrefs {
  lang: Lang
  role: Role
  showTranslations: boolean
}

interface State extends PersistedPrefs {
  tab: Tab
  openOrderId: string | null
  reviewOrderId: string | null
  messages: Message[]
  conversations: Conversation[]
  merchants: Merchant[]
  merchantLoadStatus: 'loading' | 'ready' | 'error'
  products: Product[]
  activeConversationId: string | null
  orders: Order[]
  reviews: Review[]
  marks: Set<string>
  phoneVerified: boolean
  phone: string | null
  accountRole: AccountRole | null
  address: string | null
  pickupAddress: string | null
  businessWebsite: string | null
  addressVisible: boolean
  avatarUrl: string | null
  verificationStatus: 'unverified' | 'pending' | 'verified'
  nidUrl: string | null
  passportUrl: string | null
  tradeLicenseUrl: string | null
  synced: boolean
}

type Action =
  | { type: 'prefs'; payload: Partial<PersistedPrefs> }
  | { type: 'sync'; kind: 'orders'; rows: OrderRow[] }
  | { type: 'sync'; kind: 'messages'; rows: MessageRow[] }
  | { type: 'sync'; kind: 'reviews'; rows: ReviewRow[] }
  | { type: 'sync'; kind: 'reviewMarks'; rows: ReviewMarkRow[] }
  | { type: 'sync'; kind: 'profile'; rows: ProfileRow[] }
  | { type: 'synced' }
  | { type: 'conversationData'; conversations: Conversation[]; merchants: Merchant[]; role: AccountRole }
  | { type: 'merchantData'; merchants: Merchant[] }
  | { type: 'merchantError' }
  | { type: 'selectConversation'; id: string | null }
  | { type: 'products'; products: Product[] }
  | { type: 'setTab'; tab: Tab }
  | { type: 'openOrder'; id: string | null }
  | { type: 'startReview'; orderId: string | null }
  | { type: 'setLang'; lang: Lang }
  | { type: 'setRole'; role: Role }
  | { type: 'toggleTranslations' }

const PREFS_KEY = 'tokio-prefs-v1'

const initialState: State = {
  tab: 'chat',
  openOrderId: null,
  reviewOrderId: null,
  messages: [],
  conversations: [],
  merchants: [],
  merchantLoadStatus: 'loading',
  products: [],
  activeConversationId: null,
  orders: [],
  reviews: [],
  marks: new Set<string>(),
  phoneVerified: false,
  phone: null,
  accountRole: null,
  address: null,
  pickupAddress: null,
  businessWebsite: null,
  addressVisible: false,
  avatarUrl: null,
  verificationStatus: 'unverified',
  nidUrl: null,
  passportUrl: null,
  tradeLicenseUrl: null,
  synced: false,
  lang: 'en',
  role: 'buyer',
  showTranslations: true,
}

const toDate = (d: string | Date) => (d instanceof Date ? d : new Date(d))

const toMessage = (r: MessageRow): Message => ({
  id: r.id,
  conversationId: r.conversation_id ?? undefined,
  senderUserId: r.sender_user_id ?? undefined,
  sender: r.sender,
  kind: r.kind,
  text: r.text ?? undefined,
  lang: r.lang ?? undefined,
  translation: r.translation ?? undefined,
  orderId: r.order_id ?? undefined,
  imageUrl: r.image_url ?? undefined,
  productId: r.product_id ?? undefined,
  time: fmtTime(toDate(r.created_at)),
  createdAt: r.created_at,
})

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  conversationId: r.conversation_id ?? undefined,
  ref: r.ref,
  product: r.product,
  image: r.image || PRODUCT.image,
  quantity: r.quantity,
  unitPrice: r.unit_price,
  deliveryFee: r.delivery_fee,
  payment: r.payment,
  address: r.address,
  customer: r.customer,
  customerPhoneVerified: r.customer_phone_verified,
  seller: r.seller,
  createdAt: fmtDate(toDate(r.created_at)),
  status: r.status,
  trackingRef: r.tracking_ref,
  trackingStage: r.tracking_stage,
  trackingTimes: r.tracking_times,
  reviewed: r.reviewed,
  fromChat: r.from_chat,
})

const toReview = (r: ReviewRow, marks: Set<string>): Review => ({
  id: r.id,
  name: r.name,
  initials: r.initials,
  avatarColor: r.avatar_color,
  rating: r.rating,
  text: r.text,
  date: fmtDate(toDate(r.created_at)),
  photos: r.photos ?? [],
  verified: r.verified,
  helpful: r.helpful,
  markedHelpful: marks.has(r.id),
  orderId: r.order_id,
})

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'prefs':
      return { ...state, ...action.payload }
    case 'sync': {
      if (action.kind === 'orders') return { ...state, orders: action.rows.map(toOrder) }
      if (action.kind === 'messages') return { ...state, messages: action.rows.map(toMessage) }
      if (action.kind === 'profile') {
        const p = action.rows[0]
        return {
          ...state,
          phoneVerified: p?.phone_verified ?? false,
          phone: p?.phone ?? null,
          accountRole: p?.role ?? null,
          address: p?.address ?? null,
          pickupAddress: p?.pickup_address ?? null,
          businessWebsite: p?.business_website ?? null,
          addressVisible: p?.address_visible ?? false,
          avatarUrl: p?.avatar_url ?? null,
          verificationStatus: p?.verification_status ?? 'unverified',
          nidUrl: p?.nid_url ?? null,
          passportUrl: p?.passport_url ?? null,
          tradeLicenseUrl: p?.trade_license_url ?? null,
        }
      }
      if (action.kind === 'reviewMarks') {
        const marks = new Set(action.rows.map((r) => r.review_id))
        return {
          ...state,
          marks,
          reviews: state.reviews.map((r) => ({ ...r, markedHelpful: marks.has(r.id) })),
        }
      }
      return { ...state, reviews: action.rows.map((r) => toReview(r, state.marks)) }
    }
    case 'synced':
      return { ...state, synced: true }
    case 'conversationData':
      return {
        ...state,
        conversations: action.conversations,
        merchants: action.merchants,
        accountRole: action.role,
        role: action.role === 'merchant' ? 'seller' : 'buyer',
        activeConversationId:
          state.activeConversationId && action.conversations.some((c) => c.id === state.activeConversationId)
            ? state.activeConversationId
            : action.conversations[0]?.id ?? null,
      }
    case 'merchantData':
      return { ...state, merchants: action.merchants, merchantLoadStatus: 'ready' }
    case 'merchantError':
      return { ...state, merchantLoadStatus: 'error' }
    case 'selectConversation':
      return { ...state, activeConversationId: action.id }
    case 'products':
      return { ...state, products: action.products }
    case 'setTab':
      return { ...state, tab: action.tab }
    case 'openOrder':
      return { ...state, openOrderId: action.id }
    case 'startReview':
      return { ...state, reviewOrderId: action.orderId }
    case 'setLang':
      return { ...state, lang: action.lang }
    case 'setRole':
      return { ...state, role: action.role, lang: action.role === 'seller' ? 'bn' : 'en' }
    case 'toggleTranslations':
      return { ...state, showTranslations: !state.showTranslations }
  }
}

async function api(path: string, body?: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data as { kind?: string; txid?: string | null; [k: string]: unknown }
}

async function fetchSealed(kind: LiveKind) {
  const res = await fetch('/api/live', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ kind }),
  })
  if (!res.ok) throw new Error(`Could not open live ${kind} (${res.status})`)
  return res.json()
}

interface LiveUtils {
  awaitTxId: (txid: string, timeout?: number) => Promise<unknown>
}

interface StoreCtx {
  state: State
  dispatch: React.Dispatch<Action>
  user: SessionUser
  actions: {
    sendMessage: (m: {
      kind: Message['kind']
      text?: string
      lang?: Lang
      translation?: string
      orderId?: string
      imageUrl?: string
      productId?: string
    }) => Promise<void>
    startConversation: (merchantId: string) => Promise<void>
    confirmOrder: (draft: OrderDraft) => Promise<{ orderId: string; ref: string }>
    cancelOrder: (id: string) => Promise<void>
    refreshTracking: (id: string) => Promise<{ advanced: number }>
    verifyPhone: (phone: string) => Promise<void>
    updateProfile: (body: {
      address?: string
      pickupAddress?: string
      businessWebsite?: string | null
      addressVisible?: boolean
      avatarUrl?: string
      verificationDocument?: { type: 'nid' | 'passport' | 'tradeLicense'; url: string }
    }) => Promise<void>
    addProduct: (body: { name: string; price: number; imageUrl?: string }) => Promise<void>
    addReview: (r: { orderId: string; rating: number; text: string; photos: string[] }) => Promise<void>
    toggleHelpful: (id: string) => Promise<void>
    uploadImage: (file: File) => Promise<string>
    clearAll: () => Promise<void>
  }
}

const StoreContext = createContext<StoreCtx | null>(null)

export function StoreProvider({
  user,
  children,
  initialRole = 'buyer',
  realtimeUrl,
}: {
  user: SessionUser
  children: ReactNode
  initialRole?: Role
  realtimeUrl: string
}) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    role: initialRole,
    accountRole: initialRole === 'seller' ? 'merchant' : 'shopper',
  })
  const liveUtils = useRef<Partial<Record<LiveKind, LiveUtils>>>({})
  const [rtClient] = useState(() => createRealtimeClient({ url: realtimeUrl }))
  const prefsLoaded = useRef(false)

  // Load UI preferences (language/role/translation toggle) from local storage.
  useEffect(() => {
    if (prefsLoaded.current) return
    prefsLoaded.current = true
    try {
      const raw = window.localStorage.getItem(PREFS_KEY)
      if (raw) dispatch({ type: 'prefs', payload: JSON.parse(raw) })
    } catch {
      // prefs stay at defaults
    }
  }, [])

  useEffect(() => {
    if (!prefsLoaded.current) return
    const { lang, role, showTranslations } = state
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ lang, role, showTranslations }))
    } catch {
      // storage unavailable
    }
  }, [state.lang, state.role, state.showTranslations])

  const wait = useCallback(async (kind: LiveKind, txid?: string | null) => {
    if (!txid) return
    try {
      await liveUtils.current[kind]?.awaitTxId(txid, 10_000)
    } catch {
      // The row will still arrive on the subscription; don't block the UI.
    }
  }, [])

  const actions = useMemo<StoreCtx['actions']>(
    () => ({
      sendMessage: async (m) => {
        if (!state.activeConversationId) throw new Error('Choose a conversation first')
        const r = await api('/api/messages', { ...m, conversationId: state.activeConversationId })
        await wait('messages', r.txid)
      },
      startConversation: async (merchantId) => {
        const r = await api('/api/conversations', { merchantId })
        const res = await fetch('/api/conversations')
        const data = await res.json()
        dispatch({ type: 'conversationData', ...data })
        dispatch({ type: 'selectConversation', id: r.id as string })
      },
      confirmOrder: async (draft) => {
        if (!state.activeConversationId) throw new Error('Choose a conversation first')
        const conversation = state.conversations.find((item) => item.id === state.activeConversationId)
        const product = state.products.find((item) => item.name.toLowerCase() === draft.product.trim().toLowerCase())
        const r = await api('/api/orders', {
          ...draft,
          conversationId: state.activeConversationId,
          image: product?.image_url || PRODUCT.image,
          seller: conversation?.merchant_name || 'Merchant',
        })
        await wait('orders', r.txid)
        await wait('messages', r.txid)
        return { orderId: r.orderId as string, ref: r.ref as string }
      },
      cancelOrder: async (id) => {
        const res = await fetch(`/api/orders/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Could not cancel order')
        await wait('orders', data.txid)
      },
      refreshTracking: async (id) => {
        const res = await fetch(`/api/orders/${id}/advance`, { method: 'POST' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Courier sync failed')
        return { advanced: data.advanced ?? 0 }
      },
      verifyPhone: async (phone) => {
        const r = await api('/api/profile', { phone, phoneVerified: true })
        await wait('profile', r.txid)
      },
      updateProfile: async (body) => {
        const r = await api('/api/profile', body)
        await wait('profile', r.txid)
      },
      addProduct: async (body) => {
        await api('/api/products', body)
        const res = await fetch(`/api/products?merchantId=${encodeURIComponent(user.id)}`)
        const data = await res.json()
        dispatch({ type: 'products', products: data.products ?? [] })
      },
      addReview: async (r) => {
        const res = await api('/api/reviews', r)
        await wait('reviews', res.txid)
      },
      toggleHelpful: async (id) => {
        const r = await api(`/api/reviews/${id}/helpful`)
        await wait('reviews', r.txid)
      },
      uploadImage: async (file) => {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const { uploadUrl, publicUrl } = await api('/api/uploads', {
          contentType: file.type,
          ext,
        })
        const put = await fetch(uploadUrl as string, {
          method: 'PUT',
          headers: { 'content-type': file.type },
          body: file,
        })
        if (!put.ok) throw new Error('Upload to storage failed')
        return publicUrl as string
      },
      clearAll: async () => {
        await api('/api/reset')
      },
    }),
    [wait, state.activeConversationId, state.conversations, state.products, user.id],
  )

  const ctx = useMemo<StoreCtx>(
    () => ({ state, dispatch, user, actions }),
    [state, user, actions],
  )

  useEffect(() => {
    let cancelled = false
    let reportedError = false
    const loadConversations = () => fetch('/api/conversations', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load conversations')
        return res.json()
      })
      .then((data) => { if (!cancelled) dispatch({ type: 'conversationData', ...data }) })
      .catch(() => {
        if (!cancelled && !reportedError) {
          reportedError = true
          toast.error('Could not load conversations. Retrying automatically.')
        }
      })
    const loadMerchants = () => fetch('/api/merchants', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load businesses')
        return res.json()
      })
      .then((data) => { if (!cancelled) dispatch({ type: 'merchantData', merchants: data.merchants ?? [] }) })
      .catch(() => { if (!cancelled) dispatch({ type: 'merchantError' }) })
    const load = () => {
      void loadConversations()
      void loadMerchants()
    }
    load()
    const interval = window.setInterval(load, 4000)
    return () => { cancelled = true; window.clearInterval(interval) }
  }, [])

  useEffect(() => {
    const updatePresence = (online: boolean) => fetch('/api/presence', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ online }),
      keepalive: true,
    }).catch(() => {})
    const heartbeat = () => updatePresence(true)
    const leave = () => {
      const body = new Blob([JSON.stringify({ online: false })], { type: 'application/json' })
      navigator.sendBeacon('/api/presence', body)
    }
    heartbeat()
    const interval = window.setInterval(heartbeat, 20_000)
    window.addEventListener('pagehide', leave)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('pagehide', leave)
      leave()
    }
  }, [])

  useEffect(() => {
    const conversation = state.conversations.find((item) => item.id === state.activeConversationId)
    const merchantId = state.accountRole === 'merchant' ? user.id : conversation?.merchant_id
    if (!merchantId) return dispatch({ type: 'products', products: [] })
    fetch(`/api/products?merchantId=${encodeURIComponent(merchantId)}`)
      .then((res) => res.json())
      .then((data) => dispatch({ type: 'products', products: data.products ?? [] }))
      .catch(() => dispatch({ type: 'products', products: [] }))
  }, [state.activeConversationId, state.accountRole, state.conversations, user.id])

  return (
    <RealtimeProvider client={rtClient}>
      <StoreContext.Provider value={ctx}>
        {children}
        <LiveSync userId={user.id} dispatch={dispatch} liveUtils={liveUtils} />
      </StoreContext.Provider>
    </RealtimeProvider>
  )
}

const KINDS: LiveKind[] = ['orders', 'messages', 'reviews', 'reviewMarks', 'profile']

function LiveSync({
  userId,
  dispatch,
  liveUtils,
}: {
  userId: string
  dispatch: React.Dispatch<Action>
  liveUtils: React.MutableRefObject<Partial<Record<LiveKind, LiveUtils>>>
}) {
  const [sealed, setSealed] = useState<Record<LiveKind, SealedLiveQuery<unknown>> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(KINDS.map((k) => fetchSealed(k)))
      .then((results) => {
        if (cancelled) return
        setSealed(Object.fromEntries(KINDS.map((k, i) => [k, results[i]])) as never)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (error) toast.error('Live connection failed', { description: error })
  }, [error])

  if (!sealed) return null
  return <LiveQueries sealed={sealed} dispatch={dispatch} liveUtils={liveUtils} />
}

function LiveQueries({
  sealed,
  dispatch,
  liveUtils,
}: {
  sealed: Record<LiveKind, SealedLiveQuery<unknown>>
  dispatch: React.Dispatch<Action>
  liveUtils: React.MutableRefObject<Partial<Record<LiveKind, LiveUtils>>>
}) {
  const ordersQ = useLiveQuery(sealed.orders as SealedLiveQuery<OrderRow>, {
    refreshQuery: useCallback(() => fetchSealed('orders'), []),
  })
  const messagesQ = useLiveQuery(sealed.messages as SealedLiveQuery<MessageRow>, {
    refreshQuery: useCallback(() => fetchSealed('messages'), []),
  })
  const reviewsQ = useLiveQuery(sealed.reviews as SealedLiveQuery<ReviewRow>, {
    refreshQuery: useCallback(() => fetchSealed('reviews'), []),
  })
  const marksQ = useLiveQuery(sealed.reviewMarks as SealedLiveQuery<ReviewMarkRow>, {
    refreshQuery: useCallback(() => fetchSealed('reviewMarks'), []),
  })
  const profileQ = useLiveQuery(sealed.profile as SealedLiveQuery<ProfileRow>, {
    refreshQuery: useCallback(() => fetchSealed('profile'), []),
  })

  useEffect(() => {
    liveUtils.current = {
      orders: ordersQ.utils,
      messages: messagesQ.utils,
      reviews: reviewsQ.utils,
      reviewMarks: marksQ.utils,
      profile: profileQ.utils,
    } as never
  })

  useEffect(() => {
    if (ordersQ.data) dispatch({ type: 'sync', kind: 'orders', rows: ordersQ.data as OrderRow[] })
  }, [ordersQ.data, dispatch])
  useEffect(() => {
    if (messagesQ.data)
      dispatch({ type: 'sync', kind: 'messages', rows: messagesQ.data as MessageRow[] })
  }, [messagesQ.data, dispatch])
  useEffect(() => {
    if (reviewsQ.data)
      dispatch({ type: 'sync', kind: 'reviews', rows: reviewsQ.data as ReviewRow[] })
  }, [reviewsQ.data, dispatch])
  useEffect(() => {
    if (marksQ.data)
      dispatch({ type: 'sync', kind: 'reviewMarks', rows: marksQ.data as ReviewMarkRow[] })
  }, [marksQ.data, dispatch])
  useEffect(() => {
    if (profileQ.data)
      dispatch({ type: 'sync', kind: 'profile', rows: profileQ.data as ProfileRow[] })
  }, [profileQ.data, dispatch])

  useEffect(() => {
    if (ordersQ.data && messagesQ.data && reviewsQ.data && marksQ.data && profileQ.data) {
      dispatch({ type: 'synced' })
    }
  }, [ordersQ.data, messagesQ.data, reviewsQ.data, marksQ.data, profileQ.data, dispatch])

  const errored =
    ordersQ.status === 'error' ||
    messagesQ.status === 'error' ||
    reviewsQ.status === 'error' ||
    marksQ.status === 'error' ||
    profileQ.status === 'error'
  useEffect(() => {
    if (errored) toast.error('Live updates paused', { description: 'Reconnecting…' })
  }, [errored])

  return null
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
