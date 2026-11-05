CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopper_id text NOT NULL,
  merchant_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shopper_id, merchant_id)
);

CREATE INDEX IF NOT EXISTS conversations_shopper_idx
  ON conversations (shopper_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS conversations_merchant_idx
  ON conversations (merchant_id, updated_at DESC);

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations (id) ON DELETE CASCADE;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sender_user_id text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES conversations (id) ON DELETE SET NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shopper_id text;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS merchant_id text;
