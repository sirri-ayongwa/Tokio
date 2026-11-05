ALTER TABLE conversations ADD COLUMN IF NOT EXISTS shopper_read_at timestamptz;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS merchant_read_at timestamptz;
