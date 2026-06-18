# SETUP — step-by-step checklist

Follow top to bottom. Boxes are things to actually do. Estimated time: ~30–40 min the first time.

---

## 0. Prerequisites
- [ ] Node.js 18.18+ (tested on Node 24) and npm installed — `node -v`
- [ ] A [Supabase](https://supabase.com) account
- [ ] A [Stripe](https://stripe.com) account (stay in **Test mode** the whole time)
- [ ] A [Resend](https://resend.com) account
- [ ] The [Stripe CLI](https://docs.stripe.com/stripe-cli) installed — `stripe --version`

---

## 1. Install dependencies
```bash
cd Trodplas
npm install
```

---

## 2. Create the Supabase project
- [ ] Create a new project at https://supabase.com (pick a region near you; save the DB password).
- [ ] Go to **Project Settings → API** and copy:
  - [ ] Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### 2a. Enable auth providers
- [ ] **Authentication → Providers → Email**: enable. For the smoothest local dev, you can turn **"Confirm email" OFF** (otherwise you must click the email link before logging in).
- [ ] (Optional) **Google**: enable and paste your Google OAuth client ID/secret.
- [ ] **Authentication → URL Configuration**: set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to **Redirect URLs**.

---

## 3. Apply the database schema
Two migrations live in `supabase/migrations/`. Apply them **in order**.

**Option A — SQL editor (quickest):**
- [ ] Open **SQL Editor** in the Supabase dashboard.
- [ ] Paste the entire contents of `supabase/migrations/0001_initial_schema.sql`, run it.
- [ ] Paste `supabase/migrations/0002_storage.sql`, run it.

**Option B — Supabase CLI:**
```bash
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

- [ ] Verify: **Table Editor** shows `profiles, listings, listing_images, availability, bookings, messages, reviews`.
- [ ] Verify: **Storage** shows a public `listing-images` bucket.

---

## 4. Set up Stripe
- [ ] In the Stripe Dashboard (Test mode), go to **Developers → API keys** and copy:
  - [ ] Publishable key (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - [ ] Secret key (`sk_test_...`) → `STRIPE_SECRET_KEY`
- [ ] Enable **Connect**: **Settings → Connect → Get started** (Platform/Marketplace). This lets you create Express accounts.
- [ ] (Webhook secret comes in step 7.)

---

## 5. Set up Resend
- [ ] Create an API key at https://resend.com/api-keys → `RESEND_API_KEY`.
- [ ] For dev, set `RESEND_FROM_EMAIL="Trodplas <onboarding@resend.dev>"` (no domain verification needed).

---

## 6. Create `.env.local`
```bash
cp .env.example .env.local
```
- [ ] Fill in every value from steps 2–5.
- [ ] Leave `STRIPE_WEBHOOK_SECRET` blank for now (next step).
- [ ] Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000` and `PLATFORM_FEE_BPS=2000`.

---

## 7. Wire Stripe webhooks (local)
In a dedicated terminal:
```bash
stripe login
npm run stripe:listen
```
- [ ] Copy the `whsec_...` it prints → paste into `STRIPE_WEBHOOK_SECRET` in `.env.local`.
- [ ] Keep this terminal running whenever you test bookings/onboarding.

---

## 8. Seed demo data (optional, recommended)
```bash
npm run seed
```
- [ ] You should see ~15 listings created across 3 demo users.
- [ ] Demo login: `alex@trodplas.dev` / `password123`.

> The seed marks demo lenders as Stripe-onboarded with a **fake** `acct_...` so the app is explorable. Real charges require real Connect onboarding (step 10).

---

## 9. Run the app
```bash
npm run dev
```
- [ ] Open http://localhost:3000 — the landing page loads.
- [ ] **Browse** shows the seeded listings.
- [ ] Sign up / log in (use a demo account if you seeded).

---

## 10. Smoke-test the core flow
- [ ] **As a lender:** go to **Payouts (Stripe)** → Connect with Stripe → complete the test onboarding (use Stripe's test data; e.g. SSN `000-00-0000`, any test values). Confirm your dashboard shows payouts connected (the `account.updated` webhook fires in your `stripe listen` terminal).
- [ ] **Create a listing** via *List an item* (upload a photo — it lands in Supabase Storage).
- [ ] **As a different user (renter):** open the listing → pick dates → **Request to book**.
- [ ] **As the lender:** open the booking in *Dashboard → Lending* → **Accept request** (creates the PaymentIntents).
- [ ] **As the renter:** **Pay & confirm** → use Stripe test card **`4242 4242 4242 4242`**, any future expiry/CVC. Then authorize the deposit hold (same card).
- [ ] Watch `stripe listen`: `payment_intent.succeeded` fires → booking flips to **confirmed** and the dates get blocked.
- [ ] **As the lender:** Mark handed over → Mark returned (releases the deposit hold).
- [ ] **Both parties:** leave a review on the completed booking.

Useful test cards: success `4242 4242 4242 4242`; requires-auth `4000 0025 0000 3155`; declined `4000 0000 0000 9995`.

---

## 11. Sanity checks (anytime)
```bash
npm run typecheck   # tsc --noEmit — should be clean
npm run lint        # eslint — should be clean
npm run build       # production build — should succeed
```

---

## Troubleshooting
- **"Missing required environment variable…"** — a server secret isn't set in `.env.local`; restart `npm run dev` after editing env.
- **Webhook signature errors** — `STRIPE_WEBHOOK_SECRET` doesn't match the running `stripe listen` session; recopy and restart dev.
- **Login does nothing / "check email"** — email confirmation is ON in Supabase; either confirm via the email link or disable it (step 2a).
- **Lender can't accept a booking** — they aren't Stripe-onboarded; finish step 10's onboarding (or rely on the seeded fake-onboarded demo users for UI only — they can't take *real* test charges).
- **Images don't render** — confirm the host is allowed in `next.config.ts` `images.remotePatterns` (Supabase, Unsplash, Picsum are pre-allowed).
```
