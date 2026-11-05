import { PRODUCT } from './constants'
import type { Lang, Message, OrderDraft, PaymentMethod } from './types'

// Extracts an order draft from the conversation. Each field records the
// message it was read from so the UI can show provenance.

export interface Extraction {
  draft: OrderDraft
  sources: Record<keyof OrderDraft, string>
  /** Number of fields confidently read from the chat. */
  found: number
}

const BN_DIGITS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
}

const normalize = (s: string) => s.replace(/[০-৯]/g, (d) => BN_DIGITS[d])

const NUM_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  এক: 1, একটি: 1, একটা: 1, দুই: 2, দুটো: 2, দুটি: 2,
  তিন: 3, তিনটি: 3, চার: 4, চারটি: 4, পাঁচ: 5, পাঁচটি: 5,
}

const PRODUCT_WORDS =
  /\b(bracelets?|bangles?|earrings?|jhumkas?|necklaces?|rings?|anklets?|chains?|pendants?|ব্রেসলেট|কানের দুল|নেকলেস|আংটি|পায়েল)\b/i

const snippet = (m: Message) => {
  const text = normalize(m.text ?? (m.kind === 'product' ? PRODUCT.name : ''))
  const short = text.length > 44 ? `${text.slice(0, 41)}…` : text
  return `“${short}” · ${m.time}`
}

// ৳650 · 650 taka · Tk 650 · ৬৫০ টাকা — capture group 1, 2 or 3.
const AMOUNT = /৳\s*(\d[\d,]*)|(\d[\d,]*)\s*(?:taka|tk|৳|টাকা)|tk\.?\s*(\d[\d,]*)/gi
const LEADING_AMOUNT = /(?:price|দাম|costs?|দামে?)\D{0,12}(\d[\d,]*)/i

function findAmounts(m: Message): { amount: number; delivery: boolean }[] {
  if (!m.text) return []
  const text = normalize(m.text)
  const isDelivery = /delivery|ডেলিভারি|চার্জ|charge|fee|courier/i.test(text)
  const out: { amount: number; delivery: boolean }[] = []
  for (const match of text.matchAll(AMOUNT)) {
    const raw = match[1] ?? match[2] ?? match[3]
    const n = Number(raw.replace(/,/g, ''))
    if (Number.isFinite(n) && n > 0) out.push({ amount: n, delivery: isDelivery })
  }
  if (!out.length) {
    const lead = text.match(LEADING_AMOUNT)
    if (lead) {
      const n = Number(lead[1].replace(/,/g, ''))
      if (Number.isFinite(n) && n > 0) out.push({ amount: n, delivery: isDelivery })
    }
  }
  return out
}

export function extractOrder(messages: Message[]): Extraction {
  const draft: OrderDraft = {
    product: '',
    quantity: 1,
    unitPrice: Number.NaN,
    deliveryFee: 0,
    payment: 'cod',
    address: '',
  }
  const sources = {} as Record<keyof OrderDraft, string>
  let found = 0

  const set = <K extends keyof OrderDraft>(key: K, value: OrderDraft[K], m: Message) => {
    draft[key] = value
    sources[key] = snippet(m)
    found += 1
  }

  // Product: prefer an explicit product card, otherwise a named product word.
  const productMsg = messages.find((m) => m.kind === 'product')
  if (productMsg) {
    set('product', PRODUCT.name, productMsg)
  } else {
    for (const m of messages) {
      const match = normalize(m.text ?? '').match(PRODUCT_WORDS)
      if (match) {
        const w = match[1]
        set('product', /[\u0980-\u09FF]/.test(w) ? PRODUCT.name : w[0].toUpperCase() + w.slice(1), m)
        break
      }
    }
  }

  // Quantity: "order one", "I'd like 2", "২টি", "x3".
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    const text = normalize(m.text ?? '')
    const wordQty = text.match(
      /(?:order|buy|want|like|need|take|চাই|নেব|নিব|দিন)\D{0,15}?\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an|এক|একটি|একটা|দুই|দুটো|দুটি|তিন|তিনটি|চার|চারটি|পাঁচ|পাঁচটি)\b/i,
    )
    const numQty = text.match(/\b(\d{1,2})\s*(?:x|pcs?|pieces?|টা|টি|টো)\b/i)
    const raw = numQty?.[1] ?? wordQty?.[1]
    if (raw) {
      const q = /^\d+$/.test(raw) ? Number(raw) : NUM_WORDS[raw.toLowerCase()]
      if (q && q >= 1 && q <= 20) {
        set('quantity', q, m)
        break
      }
    }
  }

  // Prices: amounts tagged by whether their message talks about delivery.
  const allAmounts = messages.flatMap((m) =>
    findAmounts(m).map((a) => ({ ...a, m })),
  )
  const feeHit = allAmounts.find((a) => a.delivery)
  const priceHit = allAmounts.find((a) => !a.delivery) ?? allAmounts.find((a) => a !== feeHit)
  if (priceHit) set('unitPrice', priceHit.amount, priceHit.m)
  if (feeHit) set('deliveryFee', feeHit.amount, feeHit.m)

  // Payment: bKash/Nagad beats the cash-on-delivery default only if mentioned.
  for (const m of messages) {
    const text = m.text ?? ''
    if (/\b(bkash|nagad|rocket|বিকাশ|নগদ|রকেট)\b/i.test(text)) {
      set('payment', 'bkash', m)
      break
    }
    if (/cash on delivery|\bcod\b|ক্যাশ অন ডেলিভারি|ক্যাশ/i.test(text)) {
      set('payment', 'cod' as PaymentMethod, m)
      break
    }
  }

  // Address: "deliver to Dhanmondi, Dhaka", "address is …", "পাঠান …".
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    const text = m.text ?? ''
    const match = text.match(
      /(?:deliver(?:y)?\s+to|ship\s+to|send\s+to|address\s*(?:is|:)|পাঠান(?:ো)?|ডেলিভারি\s+দিন|ঠিকানা)\s*[,:]?\s*([A-Za-z0-9\u0980-\u09FF ,.'’/-]{3,80})/i,
    )
    if (match) {
      const addr = match[1].replace(/[.!?,;]+$/, '').trim()
      if (addr.length >= 3) {
        set('address', addr, m)
        break
      }
    }
  }

  // Sensible fallbacks so the form is never empty-handed.
  draft.product ||= PRODUCT.name
  sources.product ||= 'Shop catalog'
  if (!Number.isFinite(draft.unitPrice)) draft.unitPrice = PRODUCT.price
  if (!draft.address) draft.address = ''

  return { draft, sources, found }
}

export function hasOrderSignals(messages: Message[]): boolean {
  return extractOrder(messages).found >= 2
}

export function langOf(text: string): Lang {
  return /[\u0980-\u09FF]/.test(text) ? 'bn' : 'en'
}
