# Blackbird Comics & Coffeehouse Website

Custom website for Blackbird Comics & Coffeehouse in Troy, Michigan.

## Features

- Online ordering (coffee, food, comics)
- Real-time menu from database
- Stripe checkout with automatic fee processing
- Order management for staff

## Tech Stack

- **Framework**: Next.js 14
- **Database**: Supabase
- **Payments**: Stripe Connect
- **Styling**: Tailwind CSS

## Setup

### 1. Clone & Install

```bash
git clone <repo>
cd blackbird-site
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/seed.sql` to load menu data
4. Copy your API keys

### 3. Stripe

1. Create account at [stripe.com](https://stripe.com)
2. Enable Connect
3. Create a connected account for Blackbird (they complete onboarding)
4. Copy API keys and connected account ID

### 4. Environment

```bash
cp .env.example .env.local
```

Fill in:
- Supabase URL and keys
- Stripe keys
- Blackbird's connected account ID

### 5. Run

```bash
npm run dev
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx         # Homepage
│   ├── menu/            # Menu & ordering
│   ├── comics/          # Comic shop
│   ├── cart/            # Shopping cart
│   ├── checkout/        # Payment flow
│   └── admin/           # Staff dashboard
├── components/          # UI components
├── lib/                 # Utilities, Stripe, Supabase
└── types/               # TypeScript types
```

## Payment Flow

When a customer orders:

1. Cart → Checkout with customer info
2. Stripe PaymentIntent created with:
   - 2.5% application fee (developer's cut)
   - Rest goes to Blackbird's connected account
3. Payment confirmed → Order marked as "paid"
4. Staff sees order in admin dashboard
5. Blackbird receives payout (2 business days)

## Admin Dashboard

Blackbird staff can:
- View incoming orders
- Update order status (Preparing → Ready → Complete)
- Manage menu items
- View sales reports

Access at `/admin` (requires authentication)
