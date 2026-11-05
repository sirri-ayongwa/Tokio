import { createRealtime, rawSql } from '@neon/realtime/server'
import type { LiveKind } from './types'

export type { LiveKind }

export const realtime = createRealtime({
  secret: process.env.NEON_REALTIME_SECRET!,
  db: new URL(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!).pathname.slice(1),
})

const ORDER_COLS = `id, ref, product, image, quantity, unit_price, delivery_fee, payment,
  address, customer, customer_phone_verified, seller, status, tracking_ref,
  tracking_stage, tracking_times, reviewed, from_chat, created_at`

export const liveQueries = {
  orders: (userId: string) =>
    rawSql(`SELECT ${ORDER_COLS} FROM orders WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
  messages: (userId: string) =>
    rawSql(
      `SELECT id, sender, kind, text, lang, translation, order_id, image_url, created_at
         FROM messages WHERE user_id = $1 ORDER BY created_at`,
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
    rawSql(`SELECT user_id, phone, phone_verified FROM profiles WHERE user_id = $1`, [userId]),
} satisfies Record<LiveKind, (userId: string) => ReturnType<typeof rawSql>>
