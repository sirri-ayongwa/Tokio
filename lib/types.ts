export type Lang = 'en' | 'bn'
export type Role = 'buyer' | 'seller'
export type Tab = 'chat' | 'orders' | 'reviews'
export type PaymentMethod = 'cod' | 'bkash'
export type OrderStatus = 'active' | 'completed' | 'cancelled'
export type MessageKind = 'text' | 'product' | 'order' | 'image'

export interface Message {
  id: string
  sender: Role
  kind: MessageKind
  text?: string
  lang?: Lang
  translation?: string
  orderId?: string
  imageUrl?: string
  time: string
}

export interface OrderDraft {
  product: string
  quantity: number
  unitPrice: number
  deliveryFee: number
  payment: PaymentMethod
  address: string
}

export interface Order extends OrderDraft {
  id: string
  ref: string
  image: string
  customer: string
  customerPhoneVerified: boolean
  seller: string
  createdAt: string
  status: OrderStatus
  trackingRef: string
  trackingStage: number
  trackingTimes: (string | null)[]
  reviewed: boolean
  fromChat?: boolean
}

export interface Review {
  id: string
  name: string
  initials: string
  avatarColor: string
  rating: number
  text: string
  date: string
  photos: string[]
  verified: boolean
  helpful: number
  markedHelpful?: boolean
  orderId?: string | null
}

// Row shapes returned by live queries (snake_case from Postgres).
export interface OrderRow {
  id: string
  ref: string
  product: string
  image: string | null
  quantity: number
  unit_price: number
  delivery_fee: number
  payment: PaymentMethod
  address: string
  customer: string
  customer_phone_verified: boolean
  seller: string
  status: OrderStatus
  tracking_ref: string
  tracking_stage: number
  tracking_times: (string | null)[]
  reviewed: boolean
  from_chat: boolean
  created_at: string | Date
}

export interface MessageRow {
  id: string
  sender: Role
  kind: MessageKind
  text: string | null
  lang: Lang | null
  translation: string | null
  order_id: string | null
  image_url: string | null
  created_at: string | Date
}

export interface ReviewRow {
  id: string
  user_id: string
  order_id: string | null
  name: string
  initials: string
  avatar_color: string
  rating: number
  text: string
  photos: string[]
  verified: boolean
  helpful: number
  created_at: string | Date
}

export interface ReviewMarkRow {
  review_id: string
}

export interface ProfileRow {
  user_id: string
  phone: string | null
  phone_verified: boolean
}

export type LiveKind = 'orders' | 'messages' | 'reviews' | 'reviewMarks' | 'profile'
