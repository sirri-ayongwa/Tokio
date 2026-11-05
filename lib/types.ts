export type Lang = 'en' | 'bn'
export type Role = 'buyer' | 'seller'
export type AccountRole = 'shopper' | 'merchant'
export type Tab = 'chat' | 'orders' | 'reviews' | 'settings'
export type PaymentMethod = 'cod' | 'bkash'
export type OrderStatus = 'active' | 'completed' | 'cancelled'
export type MessageKind = 'text' | 'product' | 'order' | 'image'

export interface Message {
  id: string
  conversationId?: string
  senderUserId?: string
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

export interface Conversation {
  id: string
  shopper_id: string
  merchant_id: string
  shopper_email: string | null
  merchant_name: string | null
  merchant_category: string | null
  last_message: string | null
  updated_at: string | Date
}

export interface Merchant {
  id: string
  name: string
  category: string | null
}

export interface Order extends OrderDraft {
  id: string
  conversationId?: string
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
  conversation_id: string | null
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
  conversation_id: string | null
  sender_user_id: string | null
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
  role: AccountRole | null
  address: string | null
  pickup_address: string | null
  address_visible: boolean
}

export type LiveKind = 'orders' | 'messages' | 'reviews' | 'reviewMarks' | 'profile'
