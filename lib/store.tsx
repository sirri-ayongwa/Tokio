'use client'

import { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react'
import { initialMessages, initialOrders, initialReviews, TRACKING_STAGES } from './mock-data'
import type { Lang, Message, Order, Review, Role, Tab } from './types'

const STORAGE_KEY = 'orderbridge-demo-v1'

interface PersistedState {
  messages: Message[]
  orders: Order[]
  reviews: Review[]
  phoneVerified: boolean
  lang: Lang
  role: Role
  showTranslations: boolean
}

interface State extends PersistedState {
  tab: Tab
  openOrderId: string | null
  reviewOrderId: string | null
  hydrated: boolean
}

type Action =
  | { type: 'hydrate'; payload: Partial<PersistedState> }
  | { type: 'reset' }
  | { type: 'setTab'; tab: Tab }
  | { type: 'openOrder'; id: string | null }
  | { type: 'startReview'; orderId: string | null }
  | { type: 'sendMessage'; message: Message }
  | { type: 'setLang'; lang: Lang }
  | { type: 'setRole'; role: Role }
  | { type: 'toggleTranslations' }
  | { type: 'confirmOrder'; order: Order; message: Message }
  | { type: 'advanceTracking'; id: string; time: string }
  | { type: 'cancelOrder'; id: string }
  | { type: 'verifyPhone' }
  | { type: 'addReview'; review: Review; orderId: string | null }
  | { type: 'toggleHelpful'; id: string }

const persistedDefaults: PersistedState = {
  messages: initialMessages,
  orders: initialOrders,
  reviews: initialReviews,
  phoneVerified: false,
  lang: 'en',
  role: 'buyer',
  showTranslations: true,
}

const initialState: State = {
  ...persistedDefaults,
  tab: 'chat',
  openOrderId: null,
  reviewOrderId: null,
  hydrated: false,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.payload, hydrated: true }
    case 'reset':
      return { ...initialState, hydrated: true }
    case 'setTab':
      return { ...state, tab: action.tab }
    case 'openOrder':
      return { ...state, openOrderId: action.id }
    case 'startReview':
      return { ...state, reviewOrderId: action.orderId }
    case 'sendMessage':
      return { ...state, messages: [...state.messages, action.message] }
    case 'setLang':
      return { ...state, lang: action.lang }
    case 'setRole':
      return { ...state, role: action.role, lang: action.role === 'seller' ? 'bn' : 'en' }
    case 'toggleTranslations':
      return { ...state, showTranslations: !state.showTranslations }
    case 'confirmOrder':
      return {
        ...state,
        orders: [action.order, ...state.orders],
        messages: [...state.messages, action.message],
      }
    case 'advanceTracking':
      return {
        ...state,
        orders: state.orders.map((order) => {
          if (order.id !== action.id || order.status !== 'active') return order
          const nextStage = Math.min(order.trackingStage + 1, TRACKING_STAGES.length - 1)
          const trackingTimes = [...order.trackingTimes]
          trackingTimes[nextStage] = action.time
          return {
            ...order,
            trackingStage: nextStage,
            trackingTimes,
            status: nextStage === TRACKING_STAGES.length - 1 ? 'completed' : 'active',
          }
        }),
      }
    case 'cancelOrder':
      return {
        ...state,
        orders: state.orders.map((o) => (o.id === action.id ? { ...o, status: 'cancelled' } : o)),
      }
    case 'verifyPhone':
      return {
        ...state,
        phoneVerified: true,
        orders: state.orders.map((o) => (o.fromChat ? { ...o, customerPhoneVerified: true } : o)),
      }
    case 'addReview':
      return {
        ...state,
        reviews: [action.review, ...state.reviews],
        orders: state.orders.map((o) => (o.id === action.orderId ? { ...o, reviewed: true } : o)),
        reviewOrderId: null,
      }
    case 'toggleHelpful':
      return {
        ...state,
        reviews: state.reviews.map((r) =>
          r.id === action.id
            ? { ...r, markedHelpful: !r.markedHelpful, helpful: r.helpful + (r.markedHelpful ? -1 : 1) }
            : r,
        ),
      }
  }
}

const StoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      dispatch({ type: 'hydrate', payload: raw ? (JSON.parse(raw) as Partial<PersistedState>) : {} })
    } catch {
      dispatch({ type: 'hydrate', payload: {} })
    }
  }, [])

  useEffect(() => {
    if (!state.hydrated) return
    const { messages, orders, reviews, phoneVerified, lang, role, showTranslations } = state
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages, orders, reviews, phoneVerified, lang, role, showTranslations }),
      )
    } catch {
      // Storage can be full or unavailable (private mode); the demo still works in memory.
    }
  }, [state])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
