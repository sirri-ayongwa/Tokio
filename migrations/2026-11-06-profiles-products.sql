ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nid_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS passport_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trade_license_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id text NOT NULL,
  name text NOT NULL,
  price double precision NOT NULL,
  image_url text,
  stock_status text NOT NULL DEFAULT 'In stock',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_merchant_idx ON products (merchant_id, created_at DESC);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products (id) ON DELETE SET NULL;
