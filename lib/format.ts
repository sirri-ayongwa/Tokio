import type { OrderDraft, PaymentMethod } from './types'

export function formatTaka(amount: number) {
  return `৳${Math.round(amount).toLocaleString('en-IN')}`
}

export function orderTotal(order: Pick<OrderDraft, 'quantity' | 'unitPrice' | 'deliveryFee'>) {
  return order.quantity * order.unitPrice + order.deliveryFee
}

export const paymentLabels: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
  bkash: 'bKash (demo)',
}

export function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function nowDate() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function nowStamp() {
  return `${nowDate()}, ${nowTime()}`
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
