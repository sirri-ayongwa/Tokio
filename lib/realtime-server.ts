import { createRealtime, rawSql } from '@neon/realtime/server'
import type { LiveKind } from './types'

export type { LiveKind }

let cached: ReturnType<typeof createRealtime> | null = null

export function getRealtime() {
  if (!cached) {
    const conn = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
    if (!process.env.NEON_REALTIME_SECRET || !conn) {
      throw new Error('Missing NEON_REALTIME_SECRET or DATABASE_URL')
    }
    cached = createRealtime({
      secret: process.env.NEON_REALTIME_SECRET,
      db: new URL(conn).pathname.slice(1),
    })
  }
  return cached
}

const ORDER_COLS = `id, conversation_id, ref, product, image, quantity, unit_price, delivery_fee, payment,
  address, customer, customer_phone_verified, seller, status, tracking_ref,
  tracking_stage, tracking_times, reviewed, from_chat, created_at`

export const liveQueries = {
  orders: (userId: string) =>
    rawSql(`SELECT ${ORDER_COLS} FROM orders WHERE user_id = $1 OR shopper_id = $1 OR merchant_id = $1 ORDER BY created_at DESC`, [userId]),
  messages: (userId: string) =>
    rawSql(
      `SELECT m.id, m.conversation_id, m.sender_user_id, m.sender, m.kind, m.text, m.product_id,
              m.lang, m.translation, m.order_id, m.image_url, m.created_at
         FROM messages m
         LEFT JOIN conversations c ON c.id = m.conversation_id
        WHERE m.user_id = $1 OR $1 IN (c.shopper_id, c.merchant_id)
        ORDER BY m.created_at`,
      [userId],
    ),
  reviews: (_userId: string) =>
    rawSql(
      `SELECT id, user_id, order_id, name, initials, avatar_color, rating, text,
              photos, verified, helpful, created_at
         FROM reviews ORDER BY created_at DESC`,
    ),
  reviewMarks: (userId: string) =>
    rawSql(`SELECT review_id FROM review_marks WHERE user_id = $1`, [userId]),
  profile: (userId: string) =>
    rawSql(
      `SELECT user_id, phone, phone_verified, role, address, pickup_address, business_website, address_visible,
              avatar_url, verification_status, nid_url, passport_url, trade_license_url
         FROM profiles WHERE user_id = $1`,
      [userId],
    ),
} satisfies Record<LiveKind, (userId: string) => ReturnType<typeof rawSql>>
