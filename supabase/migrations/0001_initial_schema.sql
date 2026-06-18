-- =============================================================================
-- Trodplas — initial schema
-- Peer-to-peer rental marketplace ("Airbnb for objects").
--
-- Conventions:
--   * Every user is BOTH a renter and a lender — no role separation.
--   * All money is stored in CENTS (integer) to avoid floating-point errors.
--   * Soft-delete listings via status = 'deleted' (we never hard-delete history).
--   * Row Level Security (RLS) is enabled on EVERY table. The service_role key
--     (used by trusted server code / webhooks) bypasses RLS.
-- =============================================================================

-- Needed for gen_random_uuid().
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type listing_category as enum (
  'tools', 'garden', 'camping', 'photo', 'video', 'audio', 'instruments', 'other'
);

create type listing_segment as enum ('consumer', 'pro');

create type listing_status as enum ('active', 'paused', 'deleted');

create type booking_status as enum (
  'pending',    -- renter requested, awaiting lender decision
  'confirmed',  -- lender accepted AND payment + deposit hold succeeded
  'active',     -- rental period in progress (item handed over)
  'completed',  -- returned; deposit released; eligible for reviews
  'cancelled',  -- cancelled by either party before it became active
  'declined'    -- lender refused the request
);

-- -----------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  avatar_url        text,
  bio               text,
  is_verified       boolean not null default false,
  -- Stripe Connect Express account id (acct_...). Null until the lender starts onboarding.
  stripe_account_id text unique,
  -- Set true by the account.updated webhook once charges_enabled && payouts_enabled.
  stripe_onboarded  boolean not null default false,
  created_at        timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- listings
-- -----------------------------------------------------------------------------
create table public.listings (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  title          text not null,
  description    text not null default '',
  category       listing_category not null,
  segment        listing_segment not null default 'consumer',
  price_per_day  integer not null check (price_per_day >= 0),   -- cents
  deposit_amount integer not null default 0 check (deposit_amount >= 0), -- cents
  city           text,
  latitude       double precision,
  longitude      double precision,
  status         listing_status not null default 'active',
  created_at     timestamptz not null default now()
);

create index listings_owner_id_idx on public.listings (owner_id);
create index listings_category_idx on public.listings (category);
create index listings_segment_idx  on public.listings (segment);
create index listings_status_idx   on public.listings (status);
create index listings_city_idx     on public.listings (lower(city));

-- -----------------------------------------------------------------------------
-- listing_images
-- -----------------------------------------------------------------------------
create table public.listing_images (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  url        text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index listing_images_listing_id_idx on public.listing_images (listing_id, sort_order);

-- -----------------------------------------------------------------------------
-- availability  (blocked or available windows per listing)
--   is_blocked = true  → owner manually blocked this window OR it is booked.
-- -----------------------------------------------------------------------------
create table public.availability (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  start_date date not null,
  end_date   date not null,
  is_blocked boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create index availability_listing_id_idx on public.availability (listing_id, start_date, end_date);

-- -----------------------------------------------------------------------------
-- bookings
-- -----------------------------------------------------------------------------
create table public.bookings (
  id                       uuid primary key default gen_random_uuid(),
  listing_id               uuid not null references public.listings (id) on delete restrict,
  renter_id                uuid not null references public.profiles (id) on delete cascade,
  start_date               date not null,
  end_date                 date not null,
  total_amount             integer not null check (total_amount >= 0),   -- cents, rental total
  platform_fee             integer not null default 0 check (platform_fee >= 0), -- cents
  deposit_amount           integer not null default 0 check (deposit_amount >= 0), -- cents
  status                   booking_status not null default 'pending',
  -- The rental-payment PaymentIntent (destination charge → lender, 80%).
  stripe_payment_intent_id text,
  -- The SEPARATE deposit/caution PaymentIntent (manual capture authorization hold).
  stripe_deposit_intent_id text,
  created_at               timestamptz not null default now(),
  check (end_date >= start_date)
);

create index bookings_listing_id_idx on public.bookings (listing_id);
create index bookings_renter_id_idx  on public.bookings (renter_id);
create index bookings_status_idx     on public.bookings (status);

-- -----------------------------------------------------------------------------
-- messages  (simple per-booking thread)
-- -----------------------------------------------------------------------------
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  content    text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index messages_booking_id_idx on public.messages (booking_id, created_at);

-- -----------------------------------------------------------------------------
-- reviews  (one party reviews the other after a completed booking)
-- -----------------------------------------------------------------------------
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  -- A reviewer may leave at most one review per booking.
  unique (booking_id, reviewer_id)
);

create index reviews_reviewee_id_idx on public.reviews (reviewee_id);
create index reviews_booking_id_idx  on public.reviews (booking_id);

-- =============================================================================
-- Trigger: auto-create a profile row whenever a new auth user signs up.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Helper functions (SECURITY DEFINER) — used inside RLS policies to look up
-- ownership/participation WITHOUT triggering recursive RLS checks.
-- =============================================================================
create or replace function public.is_listing_owner(p_listing_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.listings
    where id = p_listing_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_booking_participant(p_booking_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.bookings b
    join public.listings l on l.id = b.listing_id
    where b.id = p_booking_id
      and (b.renter_id = auth.uid() or l.owner_id = auth.uid())
  );
$$;

-- A listing is publicly visible if active, or if the caller owns it.
create or replace function public.can_view_listing(p_listing_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.listings
    where id = p_listing_id
      and (status = 'active' or owner_id = auth.uid())
  );
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles       enable row level security;
alter table public.listings        enable row level security;
alter table public.listing_images  enable row level security;
alter table public.availability    enable row level security;
alter table public.bookings        enable row level security;
alter table public.messages        enable row level security;
alter table public.reviews         enable row level security;

-- ---- profiles ----------------------------------------------------------------
-- Profiles are public (we display lender/renter names + avatars across the app).
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- listings ----------------------------------------------------------------
create policy "Active listings are public; owners see their own"
  on public.listings for select
  using (status = 'active' or owner_id = auth.uid());

create policy "Users can create listings they own"
  on public.listings for insert
  with check (owner_id = auth.uid());

create policy "Owners can update their listings"
  on public.listings for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners can delete their listings"
  on public.listings for delete
  using (owner_id = auth.uid());

-- ---- listing_images ----------------------------------------------------------
create policy "Listing images follow listing visibility"
  on public.listing_images for select
  using (public.can_view_listing(listing_id));

create policy "Owners manage their listing images (insert)"
  on public.listing_images for insert
  with check (public.is_listing_owner(listing_id));

create policy "Owners manage their listing images (update)"
  on public.listing_images for update
  using (public.is_listing_owner(listing_id))
  with check (public.is_listing_owner(listing_id));

create policy "Owners manage their listing images (delete)"
  on public.listing_images for delete
  using (public.is_listing_owner(listing_id));

-- ---- availability ------------------------------------------------------------
create policy "Availability follows listing visibility"
  on public.availability for select
  using (public.can_view_listing(listing_id));

create policy "Owners manage availability (insert)"
  on public.availability for insert
  with check (public.is_listing_owner(listing_id));

create policy "Owners manage availability (update)"
  on public.availability for update
  using (public.is_listing_owner(listing_id))
  with check (public.is_listing_owner(listing_id));

create policy "Owners manage availability (delete)"
  on public.availability for delete
  using (public.is_listing_owner(listing_id));

-- ---- bookings ----------------------------------------------------------------
create policy "Booking participants can view bookings"
  on public.bookings for select
  using (renter_id = auth.uid() or public.is_listing_owner(listing_id));

-- A renter creates a pending booking for themselves. They must not be the owner.
create policy "Renters can request bookings"
  on public.bookings for insert
  with check (
    renter_id = auth.uid()
    and status = 'pending'
    and not public.is_listing_owner(listing_id)
  );

-- Both participants can update (status transitions, attaching Stripe ids).
-- Sensitive transitions are still funneled through trusted server actions/webhooks.
create policy "Booking participants can update bookings"
  on public.bookings for update
  using (renter_id = auth.uid() or public.is_listing_owner(listing_id))
  with check (renter_id = auth.uid() or public.is_listing_owner(listing_id));

-- ---- messages ----------------------------------------------------------------
create policy "Booking participants can read messages"
  on public.messages for select
  using (public.is_booking_participant(booking_id));

create policy "Participants can send messages as themselves"
  on public.messages for insert
  with check (sender_id = auth.uid() and public.is_booking_participant(booking_id));

-- ---- reviews -----------------------------------------------------------------
create policy "Reviews are public"
  on public.reviews for select
  using (true);

-- Reviewer must be a participant of the (completed) booking and reviewing as self.
create policy "Participants can leave reviews"
  on public.reviews for insert
  with check (
    reviewer_id = auth.uid()
    and public.is_booking_participant(booking_id)
    and exists (
      select 1 from public.bookings
      where id = booking_id and status = 'completed'
    )
  );

create policy "Reviewers can edit their own review"
  on public.reviews for update
  using (reviewer_id = auth.uid())
  with check (reviewer_id = auth.uid());
