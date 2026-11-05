import { neon } from '@neondatabase/serverless'

// Pooled connection for application traffic; direct for schema setup.
const pooledUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!
const directUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!

export const sql = neon(pooledUrl)
export const sqlDirect = neon(directUrl)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS profiles (
  user_id text PRIMARY KEY,
  email text,
  phone text,
  phone_digits text,
  phone_verified boolean NOT NULL DEFAULT false,
  role text,
  business_name text,
  business_website text,
  pickup_address text,
  address text,
  address_visible boolean NOT NULL DEFAULT false,
  category text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_digits text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_website text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pickup_address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_visible boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS category text;

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopper_id text NOT NULL,
  merchant_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shopper_id, merchant_id)
);
CREATE INDEX IF NOT EXISTS conversations_shopper_idx ON conversations (shopper_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS conversations_merchant_idx ON conversations (merchant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  ref text NOT NULL,
  product text NOT NULL,
  image text,
  quantity integer NOT NULL,
  unit_price double precision NOT NULL,
  delivery_fee double precision NOT NULL,
  payment text NOT NULL,
  address text NOT NULL,
  customer text NOT NULL,
  customer_phone_verified boolean NOT NULL DEFAULT false,
  seller text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  tracking_ref text NOT NULL,
  tracking_stage integer NOT NULL DEFAULT 0,
  tracking_times jsonb NOT NULL DEFAULT '[]',
  reviewed boolean NOT NULL DEFAULT false,
  from_chat boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations (id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shopper_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS merchant_id text;
CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  sender text NOT NULL,
  kind text NOT NULL DEFAULT 'text',
  text text,
  lang text,
  translation text,
  order_id uuid REFERENCES orders (id) ON DELETE SET NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations (id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_user_id text;
CREATE INDEX IF NOT EXISTS messages_user_idx ON messages (user_id, created_at);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  order_id uuid REFERENCES orders (id) ON DELETE SET NULL,
  name text NOT NULL,
  initials text NOT NULL,
  avatar_color text NOT NULL,
  rating integer NOT NULL,
  text text NOT NULL,
  photos jsonb NOT NULL DEFAULT '[]',
  verified boolean NOT NULL DEFAULT true,
  helpful integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reviews_created_idx ON reviews (created_at DESC);

CREATE TABLE IF NOT EXISTS review_marks (
  review_id uuid NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
  user_id text NOT NULL,
  PRIMARY KEY (review_id, user_id)
);

CREATE TABLE IF NOT EXISTS otp_codes (
  phone_digits text PRIMARY KEY,
  code text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL
);

CREATE SEQUENCE IF NOT EXISTS orders_ref_seq START 1048;
`

let schemaPromise: Promise<unknown> | null = null

export function ensureSchema() {
  // Check the newest schema addition so existing deployments receive upgrades.
  // The serverless driver runs one statement per query, so split the DDL.
  schemaPromise ??= sqlDirect`
    SELECT to_regclass('public.conversations') IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'conversation_id'
       ) AS ready`
    .then(([row]) =>
      row?.ready
        ? true
        : SCHEMA.split(';')
            .map((s) => s.trim())
            .filter(Boolean)
            .reduce(
              (p, statement) => p.then(() => sqlDirect.query(statement)),
              Promise.resolve<unknown>(null),
            )
            .then(() => true),
    )
    .catch((err) => {
      schemaPromise = null
      throw err
    })
  return schemaPromise
}
