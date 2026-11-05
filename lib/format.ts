import type { OrderDraft, PaymentMethod } from './types'

export function formatTaka(amount: number) {
  return `৳${Math.round(amount).toLocaleString('en-IN')}`
}

export function orderTotal(order: Pick<OrderDraft, 'quantity' | 'unitPrice' | 'deliveryFee'>) {
  return order.quantity * order.unitPrice + order.deliveryFee
}

export const paymentLabels: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
  bkash: 'bKash',
}

export function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function fmtDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtStamp(d: Date) {
  return `${fmtDate(d)}, ${fmtTime(d)}`
}

export function nowTime() {
  return fmtTime(new Date())
}

export function nowDate() {
  return fmtDate(new Date())
}

export function nowStamp() {
  return fmtStamp(new Date())
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}
