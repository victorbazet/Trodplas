# Trodplas

> _Trodplas_ — a play on the French **"trop de place"** ("takes up too much space"), for the objects that take up too much space.

A peer-to-peer rental marketplace — **"Airbnb for objects"**. People rent out tools, DIY/camping gear, and high-value pro/creative equipment (cameras, lenses, audio gear, instruments). One platform, two segments: everyday low-ticket items and pro/creative high-ticket items. Every user is **both a renter and a lender** — no role separation.

This repository is the **MVP skeleton**: a clean, extensible architecture with the full critical path wired (auth → listing → booking → Stripe Connect payment + deposit hold → messaging → reviews). Some surfaces are intentionally stubbed — see [What's done vs. stubbed](#whats-done-vs-stubbed).

---

## Stack

| Concern        | Choice |
| -------------- | ------ |
| Framework      | **Next.js 15** (App Router, TypeScript, Server Components + Server Actions) |
| Database/Auth/Storage | **Supabase** (Postgres + Auth + Storage), with **Row Level Security on every table** |
| Payments       | **Stripe Connect** (Express accounts), destination charges + separate manual-capture deposit hold |
| UI             | **Tailwind CSS** + **shadcn/ui** (Radix primitives) |
| Email          | **Resend** (transactional) |
| Validation/Forms | **Zod** + **React Hook Form** |

---

## Quick start

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env.local        # then fill in real values (see below)

# 3. Apply the database schema
#    Paste supabase/migrations/*.sql into the Supabase SQL editor in order,
#    OR use the Supabase CLI (see SETUP.md).

# 4. Seed demo data (optional but recommended)
npm run seed

# 5. Run
npm run dev                       # http://localhost:3000

# 6. In a second terminal, forward Stripe webhooks
npm run stripe:listen             # copy the printed whsec_... into .env.local
```

A full, ordered, do-this-tomorrow-morning checklist lives in **[SETUP.md](./SETUP.md)**.

---

## Environment variables

Every variable, what it's for, and where to get it. Copy `.env.example` → `.env.local`.

| Variable | Public? | Where to get it | Purpose |
| -------- | ------- | --------------- | ------- |
| `NEXT_PUBLIC_APP_URL` | ✅ browser | You choose | Canonical app URL. Used for Stripe return URLs & email links. `http://localhost:3000` in dev. |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ browser | Supabase → Project Settings → API | Your project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ browser | Supabase → Project Settings → API | Anon public key. Safe to expose — RLS protects data. |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 server | Supabase → Project Settings → API | **Admin key, bypasses RLS.** Used only by the seed script and webhooks. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ browser | Stripe → Developers → API keys | `pk_test_...` Used by Stripe.js in the browser. |
| `STRIPE_SECRET_KEY` | 🔒 server | Stripe → Developers → API keys | `sk_test_...` Server-side Stripe API calls. |
| `STRIPE_WEBHOOK_SECRET` | 🔒 server | `stripe listen` (dev) / Dashboard webhook (prod) | `whsec_...` Verifies webhook signatures. |
| `PLATFORM_FEE_BPS` | 🔒 server | You choose | Platform commission in basis points. `2000` = 20%. |
| `RESEND_API_KEY` | 🔒 server | resend.com → API Keys | `re_...` Sends transactional email. |
| `RESEND_FROM_EMAIL` | 🔒 server | You choose | Verified sender. `onboarding@resend.dev` works in dev without a domain. |

> **Secret hygiene:** only `NEXT_PUBLIC_*` values ever reach the browser. Secrets are read through `src/lib/env.ts` and are only imported from server code (server components, route handlers, server actions, the seed script). The service-role key and Stripe secret are never bundled client-side.

### Getting each set of keys

- **Supabase** — create a project at [supabase.com](https://supabase.com). Project Settings → API gives you the URL, anon key, and service-role key. Enable **Email** and (optionally) **Google** providers under Authentication → Providers. Add `http://localhost:3000/auth/callback` to the redirect allow-list.
- **Stripe** — create an account at [stripe.com](https://stripe.com), stay in **Test mode**. Developers → API keys for the publishable/secret keys. Enable **Connect** (Settings → Connect) to use Express accounts. The webhook secret comes from the Stripe CLI in dev (below) or from a Dashboard webhook endpoint in prod.
- **Resend** — sign up at [resend.com](https://resend.com), create an API key. For real email you verify a domain; for dev, send from `onboarding@resend.dev`.

---

## Running Stripe webhooks locally

Webhooks drive booking confirmation and Connect onboarding state, so you need them running.

```bash
# Install the Stripe CLI once: https://docs.stripe.com/stripe-cli
stripe login

# Forward events to the local webhook route:
npm run stripe:listen
# (alias for: stripe listen --forward-to localhost:3000/api/webhooks/stripe)
```

The CLI prints a `whsec_...` secret on start — **paste it into `STRIPE_WEBHOOK_SECRET`** in `.env.local` and restart `npm run dev`.

Trigger test events:

```bash
stripe trigger payment_intent.succeeded
stripe trigger account.updated
```

Handled events (`src/app/api/webhooks/stripe/route.ts`):

| Event | Effect |
| ----- | ------ |
| `payment_intent.succeeded` (rental) | Booking → `confirmed`; books the dates; emails both parties. |
| `payment_intent.amount_capturable_updated` | Logs that the deposit hold was authorized. |
| `account.updated` | Syncs `profiles.stripe_onboarded` when the connected account is fully enabled. |
| `payment_intent.payment_failed` | Logged (stub for retry/notify). |

---

## The Stripe Connect payment model (the core)

This is implemented carefully in `src/lib/stripe/` and `src/app/actions/bookings.ts`.

### Onboarding (lenders)
1. Lender clicks **Connect payouts** → `startStripeOnboarding()` creates a Stripe **Express** account and stores `acct_...` on `profiles.stripe_account_id`.
2. They're redirected to Stripe's hosted onboarding (account link).
3. The **`account.updated`** webhook flips `profiles.stripe_onboarded = true` once the account has `charges_enabled && payouts_enabled`. The return page also re-checks proactively (`syncOnboardingStatus()`).

A lender must be fully onboarded before they can **accept** a booking.

### Booking payment — two PaymentIntents
When a renter pays a confirmed-by-lender booking, **two** PaymentIntents are created (`createBookingPayments()`):

1. **Rental payment — a destination charge** (`src/lib/stripe/payments.ts`):
   - `application_fee_amount` = 20% platform commission (`PLATFORM_FEE_BPS`).
   - `transfer_data.destination` = the lender's connected account.
   - The lender receives **80%**; the platform keeps the fee. Captured immediately.

2. **Security deposit / caution — a SEPARATE manual-capture hold**:
   - `capture_method: 'manual'` → the funds are **authorized but not captured** (an authorization hold on the renter's card).
   - On a clean return → `releaseDeposit()` **cancels** the PaymentIntent, voiding the hold.
   - On damage/dispute → `captureDeposit(amount?)` **captures** all or part (the rest is auto-released).
   - The deposit stays on the **platform** account (no `transfer_data`) so the platform arbitrates.

This is the current recommended Stripe pattern: separate authorization & capture via a manual-capture PaymentIntent (`requires_capture` state → capture or cancel). See [Stripe: place a hold on a payment method](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method).

> **Authorization expiry:** card holds are valid ~7 days by default. For longer rentals you'd request an **extended authorization** (up to 30 days, network-dependent) or re-authorize near expiry. This is flagged with a `TODO` in `payments.ts`.

### Booking lifecycle / status machine

```
request (renter)            → pending   (no payment intents yet)
accept  (lender)            → pending   (rental + deposit PaymentIntents created)
pay     (renter)            → confirmed (via payment_intent.succeeded webhook; dates booked)
hand over (lender)          → active
return  (lender)            → completed (deposit hold released; reviews unlocked)
decline (lender)            → declined
cancel  (either, pre-active)→ cancelled (deposit hold released)
```

A `pending` booking that already has a `stripe_payment_intent_id` means **the lender accepted and we're awaiting payment** (surfaced in the UI as "Awaiting payment").

---

## Project structure

```
src/
├── app/
│   ├── (auth)/login, signup        # auth pages (email + Google)
│   ├── auth/callback/route.ts      # OAuth / email-confirm code exchange
│   ├── api/webhooks/stripe/route.ts# Stripe webhook handler (raw body, signature verified)
│   ├── actions/                    # 'use server' Server Actions
│   │   ├── auth.ts  bookings.ts  listings.ts  messages.ts  reviews.ts  profile.ts  stripe.ts
│   ├── browse/                     # search + filters
│   ├── listings/[id], listings/new # listing detail + multi-step create form
│   ├── dashboard/                  # my listings / renting / lending (tabbed) + booking detail + checkout
│   ├── onboarding/                 # Stripe Connect onboarding (+ return/refresh)
│   ├── page.tsx                    # landing
│   └── layout.tsx, globals.css
├── components/
│   ├── ui/                         # shadcn/ui primitives (button, card, select, tabs, …)
│   ├── layout/                     # site header/footer, user menu
│   └── *.tsx                       # listing-card, booking-widget, checkout-form, message-thread, …
├── lib/
│   ├── supabase/                   # client (browser), server (RSC/actions), admin (service-role), middleware
│   ├── stripe/                     # server client, client (Stripe.js), connect, payments, fees
│   ├── email/                      # resend client + transactional helpers
│   ├── data/                       # server-side data access (listings, bookings, reviews)
│   ├── env.ts  utils.ts  constants.ts  validations.ts (Zod)
├── middleware.ts                   # refreshes Supabase session; gates /dashboard, /listings/new, /onboarding
└── types/                          # Database type + domain composite types
supabase/migrations/                # 0001 schema + RLS, 0002 storage bucket + policies
scripts/seed.ts                     # ~15 demo listings + 3 demo users
```

---

## Database & RLS

Full SQL is in `supabase/migrations/` — tables, enums, indexes, a profile-creation trigger, helper functions, and **RLS policies on every table**. Highlights:

- `profiles` are auto-created from `auth.users` via the `on_auth_user_created` trigger.
- Listings are public when `active`; owners always see their own. Soft-deleted via `status = 'deleted'`.
- Bookings/messages are visible only to participants (renter or listing owner), enforced via `SECURITY DEFINER` helper functions (`is_listing_owner`, `is_booking_participant`, `can_view_listing`) to avoid recursive RLS.
- Reviews require a **completed** booking and that the reviewer was a participant.
- Storage: a public `listing-images` bucket; users may only write under their own `{uid}/...` prefix.

---

## What's done vs. stubbed

### ✅ Done (wired end-to-end)
- Auth: email/password + Google OAuth, session refresh middleware, route gating.
- Full SQL schema, enums, indexes, **RLS on all tables**, storage bucket + policies, profile trigger.
- Listings: browse + filters (category, segment, city, date availability), detail page with gallery, multi-step create form with **image upload to Supabase Storage**.
- Bookings: request → accept/decline → pay → confirm → active → complete, with server-computed pricing.
- **Stripe Connect**: Express onboarding + account-link flow, destination-charge rental payment with 20% application fee, **separate manual-capture deposit hold** with release/capture helpers, two-step checkout (Stripe Elements), webhooks.
- Per-booking messaging thread.
- Reviews after completed bookings (with one-review-per-booking constraint).
- Dashboard (my listings / renting / lending), settings, transactional emails (Resend).
- `npm run dev`, `npm run build`, `npm run typecheck` all pass.

### 🚧 Stubbed / simplified (marked with `TODO` in code)
- **Deposit capture UI** — `captureDeposit()` / `releaseDeposit()` exist and are called on cancel/complete, but there's no admin dispute UI to partially capture.
- **Extended authorization** for rentals longer than ~7 days (deposit hold expiry) — noted in `payments.ts`.
- **Date-availability filtering** runs in app code, not SQL — fine for a skeleton, needs an RPC/index for scale (`lib/data/listings.ts`).
- **Availability calendar** is rendered as a list of blocked ranges; an interactive calendar (react-day-picker) is a TODO on the listing page.
- **Refund on cancellation** of an already-paid booking — `refundRental()` exists but isn't auto-invoked; cancel currently only releases the deposit hold.
- **Real-time messaging** — messages refresh on send/navigation, not via Supabase Realtime subscriptions.
- **Email templates** are inline HTML strings, not React Email components.
- **Geo search** — `latitude/longitude` are stored and seeded but there's no map or radius search.
- **Image management on edit** — `updateListing` updates fields; image add/remove/reorder on existing listings is minimal.

---

## Decisions made (where the brief was open)

- **No `accepted` booking status** — kept the given enum. "Lender accepted, awaiting payment" is represented by a `pending` booking that has a `stripe_payment_intent_id`. Documented in code and surfaced in the UI.
- **Currency = EUR**, money stored in **cents** everywhere; users enter euros in forms.
- **Demo lenders are marked `stripe_onboarded = true`** with a fake `acct_...` in the seed so the UI is explorable without real Connect onboarding. Replace with real onboarding before taking live payments (you cannot actually charge to a fake account).
- **Picsum placeholder images** in the seed (deterministic, always render). Swap for real photos.
- **shadcn/ui components are vendored** under `components/ui/` (hand-authored to match the CLI output) so the repo is self-contained.

---

## Scripts

| Command | Does |
| ------- | ---- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Next.js ESLint |
| `npm run seed` | Insert demo users + ~15 listings (needs service-role key) |
| `npm run stripe:listen` | Forward Stripe webhooks to localhost |

Demo login after seeding: **`alex@trodplas.dev` / `password123`** (also `sam@…`, `lena@…`).
