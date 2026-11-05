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
import { PRODUCT, SHOP } from './constants'
import { fmtDate, fmtTime } from './format'
import type {
  AccountRole,
  Lang,
  Message,
  MessageRow,
  Order,
  OrderDraft,
  OrderRow,
  ProfileRow,
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
  orders: Order[]
  reviews: Review[]
  marks: Set<string>
  phoneVerified: boolean
  phone: string | null
  accountRole: AccountRole | null
  address: string | null
  pickupAddress: string | null
  addressVisible: boolean
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
  orders: [],
  reviews: [],
  marks: new Set<string>(),
  phoneVerified: false,
  phone: null,
  accountRole: null,
  address: null,
  pickupAddress: null,
  addressVisible: false,
  synced: false,
  lang: 'en',
  role: 'buyer',
  showTranslations: true,
}

const toDate = (d: string | Date) => (d instanceof Date ? d : new Date(d))

const toMessage = (r: MessageRow): Message => ({
  id: r.id,
  sender: r.sender,
  kind: r.kind,
  text: r.text ?? undefined,
  lang: r.lang ?? undefined,
  translation: r.translation ?? undefined,
  orderId: r.order_id ?? undefined,
  imageUrl: r.image_url ?? undefined,
  time: fmtTime(toDate(r.created_at)),
})

const toOrder = (r: OrderRow): Order => ({
  id: r.id,
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
          addressVisible: p?.address_visible ?? false,
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
      sender: Role
      kind: Message['kind']
      text?: string
      lang?: Lang
      translation?: string
      orderId?: string
      imageUrl?: string
    }) => Promise<void>
    confirmOrder: (draft: OrderDraft) => Promise<{ orderId: string; ref: string }>
    cancelOrder: (id: string) => Promise<void>
    refreshTracking: (id: string) => Promise<{ advanced: number }>
    verifyPhone: (phone: string) => Promise<void>
    updateProfile: (body: {
      address?: string
      pickupAddress?: string
      addressVisible?: boolean
    }) => Promise<void>
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
  const [state, dispatch] = useReducer(reducer, { ...initialState, role: initialRole })
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
        const r = await api('/api/messages', m)
        await wait('messages', r.txid)
      },
      confirmOrder: async (draft) => {
        const r = await api('/api/orders', {
          ...draft,
          image: PRODUCT.image,
          seller: SHOP.name,
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
    [wait],
  )

  const ctx = useMemo<StoreCtx>(
    () => ({ state, dispatch, user, actions }),
    [state, user, actions],
  )

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
