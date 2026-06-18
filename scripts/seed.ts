/**
 * Seed script — inserts demo users and ~15 listings so the app isn't empty.
 *
 * Run with:  npm run seed
 *
 * Requires (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← admin key, bypasses RLS
 *
 * The script is idempotent-ish: it upserts demo users by email and clears any
 * previously-seeded listings (tagged via a marker in the title) before
 * re-inserting. Re-running won't pile up duplicates.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Deterministic placeholder image.
const img = (seed: string) => `https://picsum.photos/seed/trodplas-${seed}/800/600`;

interface DemoUser {
  email: string;
  password: string;
  fullName: string;
  verified: boolean;
}

const DEMO_USERS: DemoUser[] = [
  { email: "alex@trodplas.dev", password: "password123", fullName: "Alex Martin", verified: true },
  { email: "sam@trodplas.dev", password: "password123", fullName: "Sam Dubois", verified: true },
  { email: "lena@trodplas.dev", password: "password123", fullName: "Léna Costa", verified: false },
];

type Cat =
  | "tools" | "garden" | "camping" | "photo" | "video" | "audio" | "instruments" | "other";

interface DemoListing {
  title: string;
  description: string;
  category: Cat;
  segment: "consumer" | "pro";
  pricePerDay: number; // cents
  deposit: number; // cents
  city: string;
  lat: number;
  lng: number;
  images: string[];
}

const CITIES: Record<string, [number, number]> = {
  Paris: [48.8566, 2.3522],
  Lyon: [45.764, 4.8357],
  Marseille: [43.2965, 5.3698],
  Bordeaux: [44.8378, -0.5792],
  Nantes: [47.2184, -1.5536],
};

const LISTINGS: DemoListing[] = [
  // --- Consumer / everyday ---
  { title: "Bosch hammer drill (SDS+)", description: "Powerful corded hammer drill, perfect for concrete and masonry. Comes with a set of bits.", category: "tools", segment: "consumer", pricePerDay: 1200, deposit: 8000, city: "Paris", lat: CITIES.Paris[0], lng: CITIES.Paris[1], images: [img("drill-1"), img("drill-2")] },
  { title: "Electric pressure washer 2000W", description: "Karcher-style pressure washer. Great for patios, cars and facades.", category: "garden", segment: "consumer", pricePerDay: 1500, deposit: 6000, city: "Lyon", lat: CITIES.Lyon[0], lng: CITIES.Lyon[1], images: [img("washer-1")] },
  { title: "4-person dome tent", description: "Lightweight waterproof tent, easy 10-minute setup. Sleeps 4 comfortably.", category: "camping", segment: "consumer", pricePerDay: 900, deposit: 4000, city: "Bordeaux", lat: CITIES.Bordeaux[0], lng: CITIES.Bordeaux[1], images: [img("tent-1"), img("tent-2")] },
  { title: "Petrol lawn mower", description: "Self-propelled mower with grass collector. Cutting width 46cm.", category: "garden", segment: "consumer", pricePerDay: 1800, deposit: 10000, city: "Nantes", lat: CITIES.Nantes[0], lng: CITIES.Nantes[1], images: [img("mower-1")] },
  { title: "Tile cutter (manual, 600mm)", description: "Manual tile cutter for clean straight cuts up to 60cm. Ideal for DIY tiling.", category: "tools", segment: "consumer", pricePerDay: 800, deposit: 3000, city: "Paris", lat: CITIES.Paris[0], lng: CITIES.Paris[1], images: [img("tile-1")] },
  { title: "Camping stove + gas kit", description: "Two-burner camping stove with windshield and gas canister included.", category: "camping", segment: "consumer", pricePerDay: 600, deposit: 2000, city: "Marseille", lat: CITIES.Marseille[0], lng: CITIES.Marseille[1], images: [img("stove-1")] },
  { title: "Folding e-bike", description: "Foldable electric bike, 40km range, perfect for city trips and weekend rides.", category: "other", segment: "consumer", pricePerDay: 2500, deposit: 30000, city: "Lyon", lat: CITIES.Lyon[0], lng: CITIES.Lyon[1], images: [img("ebike-1"), img("ebike-2")] },
  { title: "Hedge trimmer (cordless)", description: "Battery-powered hedge trimmer, 2 batteries included. Lightweight and quiet.", category: "garden", segment: "consumer", pricePerDay: 1000, deposit: 4000, city: "Bordeaux", lat: CITIES.Bordeaux[0], lng: CITIES.Bordeaux[1], images: [img("hedge-1")] },

  // --- Pro / creative ---
  { title: "Sony A7 IV mirrorless body", description: "Full-frame 33MP hybrid camera. Body only — pair with one of my lenses.", category: "photo", segment: "pro", pricePerDay: 4500, deposit: 120000, city: "Paris", lat: CITIES.Paris[0], lng: CITIES.Paris[1], images: [img("a7-1"), img("a7-2")] },
  { title: "Canon RF 24-70mm f/2.8 lens", description: "Pro standard zoom, razor sharp. Weather-sealed. UV filter included.", category: "photo", segment: "pro", pricePerDay: 3800, deposit: 150000, city: "Paris", lat: CITIES.Paris[0], lng: CITIES.Paris[1], images: [img("lens-1")] },
  { title: "DJI Ronin gimbal stabilizer", description: "3-axis gimbal for mirrorless and DSLR. Buttery smooth footage every time.", category: "video", segment: "pro", pricePerDay: 3000, deposit: 80000, city: "Lyon", lat: CITIES.Lyon[0], lng: CITIES.Lyon[1], images: [img("gimbal-1")] },
  { title: "Aputure 600D LED light", description: "Powerful daylight-balanced COB light with Bowens mount. Includes softbox.", category: "video", segment: "pro", pricePerDay: 3500, deposit: 90000, city: "Marseille", lat: CITIES.Marseille[0], lng: CITIES.Marseille[1], images: [img("light-1"), img("light-2")] },
  { title: "Shure SM7B + cloudlifter", description: "Broadcast-grade dynamic mic with Cloudlifter. Perfect for podcasts & vocals.", category: "audio", segment: "pro", pricePerDay: 2000, deposit: 40000, city: "Nantes", lat: CITIES.Nantes[0], lng: CITIES.Nantes[1], images: [img("mic-1")] },
  { title: "Fender Stratocaster + amp", description: "American Strat with a 40W tube amp. Great for sessions and gigs.", category: "instruments", segment: "pro", pricePerDay: 2800, deposit: 70000, city: "Bordeaux", lat: CITIES.Bordeaux[0], lng: CITIES.Bordeaux[1], images: [img("guitar-1"), img("guitar-2")] },
  { title: "Pioneer DDJ DJ controller", description: "4-channel DJ controller with rekordbox. Ideal for events and practice.", category: "audio", segment: "pro", pricePerDay: 3200, deposit: 60000, city: "Lyon", lat: CITIES.Lyon[0], lng: CITIES.Lyon[1], images: [img("dj-1")] },
  { title: "RED Komodo 6K cinema camera", description: "Compact cinema camera body. For serious productions. Insurance recommended.", category: "video", segment: "pro", pricePerDay: 12000, deposit: 500000, city: "Paris", lat: CITIES.Paris[0], lng: CITIES.Paris[1], images: [img("red-1"), img("red-2")] },
];

async function ensureUser(u: DemoUser): Promise<string> {
  // Try to create; if it already exists, look it up.
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { full_name: u.fullName },
  });

  let userId = data.user?.id;
  if (error || !userId) {
    // Already exists — find via listUsers (small demo set).
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const found = list.users.find((x) => x.email === u.email);
    if (!found) throw new Error(`Could not create or find user ${u.email}: ${error?.message}`);
    userId = found.id;
  }

  // The handle_new_user() trigger creates the profile; update its fields.
  await admin
    .from("profiles")
    .update({
      full_name: u.fullName,
      is_verified: u.verified,
      // Fake an onboarded Stripe account so demo lenders can "accept" bookings.
      // TODO: replace with real Connect onboarding in a live environment.
      stripe_account_id: `acct_demo_${userId.slice(0, 8)}`,
      stripe_onboarded: true,
    })
    .eq("id", userId);

  return userId;
}

async function main() {
  console.log("🌱 Seeding Trodplas…");

  const userIds: string[] = [];
  for (const u of DEMO_USERS) {
    const id = await ensureUser(u);
    userIds.push(id);
    console.log(`  ✓ user ${u.email}`);
  }

  // Clear previously-seeded listings (owned by demo users) to stay idempotent.
  await admin.from("listings").delete().in("owner_id", userIds);

  let i = 0;
  for (const l of LISTINGS) {
    const ownerId = userIds[i % userIds.length];
    const { data: listing, error } = await admin
      .from("listings")
      .insert({
        owner_id: ownerId,
        title: l.title,
        description: l.description,
        category: l.category,
        segment: l.segment,
        price_per_day: l.pricePerDay,
        deposit_amount: l.deposit,
        city: l.city,
        latitude: l.lat,
        longitude: l.lng,
        status: "active",
      })
      .select("id")
      .single();

    if (error || !listing) {
      console.error(`  ✗ listing "${l.title}": ${error?.message}`);
      continue;
    }

    await admin.from("listing_images").insert(
      l.images.map((u, idx) => ({ listing_id: listing.id, url: u, sort_order: idx })),
    );
    console.log(`  ✓ listing ${l.title}`);
    i++;
  }

  console.log(`\n✅ Done. Seeded ${LISTINGS.length} listings across ${DEMO_USERS.length} users.`);
  console.log("   Demo login: alex@trodplas.dev / password123");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
