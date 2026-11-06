# Tokio

Tokio is a bilingual social-commerce chat and order-management app for buyers and small businesses. It addresses three common problems: communication barriers between English and Bengali speakers, limited trust between buyers and sellers, and orders becoming disorganized across chat messages.

Tokio keeps the conversation, translated messages, product sharing, AI-assisted order summary, order confirmation, delivery tracking, verification, and reviews in one place. Buyers and merchants receive role-specific chat, order, review, and settings screens.

## Run locally

Requirements: Node.js 20 or newer, npm, and access to a Neon project configured for Postgres, Auth, Realtime, Functions, and Object Storage.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and add the required Neon, storage, AI, and optional Twilio credentials.

3. Apply the SQL migrations in `migrations/` to the Neon database. The repository also includes `scripts/apply-migration.mjs`:

   ```bash
   node scripts/apply-migration.mjs migrations/2026-11-05-conversations.sql
   ```

   Repeat for the remaining migrations in date order.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open the local URL printed in the terminal.

The `.next` directory is generated cache and build output. It is gitignored and can be deleted safely if the dev server reports a stale or slow-cache warning; the next run recreates it.

## Test the buyer and merchant flow

Use two browsers, or one normal window and one private window, so both roles can stay signed in:

1. Sign in as the included Golden Threads merchant in one browser.
2. Create a shopper account in the other browser.
3. As the shopper, search for Golden Threads and start a conversation.
4. Exchange English and Bengali messages, share a product, and test translation.
5. As the merchant, use the AI order assistant, review the buyer address, and confirm the order.
6. Check the order, tracking, and review flows from both accounts.

Golden Threads test merchant:

- Email: `golden.threads@tokio.test`
- Password: `GoldenThreads#2026!`
- Role: Merchant

You can also create your own merchant account and use a separate shopper account to test a clean business-to-customer flow.

## Project locations

- `app/api/`: authenticated API routes
- `components/`: role-specific interface and shared UI
- `lib/db.ts`: core database schema bootstrap
- `lib/store.tsx`: client state and realtime synchronization
- `migrations/`: tracked database migrations
- `neon.ts`: Neon services and courier function configuration
