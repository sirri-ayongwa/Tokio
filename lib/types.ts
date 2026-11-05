export type Lang = 'en' | 'bn'
export type Role = 'buyer' | 'seller'
export type Tab = 'chat' | 'orders' | 'reviews'
export type PaymentMethod = 'cod' | 'bkash'
export type OrderStatus = 'active' | 'completed' | 'cancelled'

export interface Message {
  id: string
  sender: Role
  kind: 'text' | 'product' | 'order'
  text?: string
  lang?: Lang
  translation?: string
  orderId?: string
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
}
