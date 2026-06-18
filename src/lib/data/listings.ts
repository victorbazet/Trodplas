import { createClient } from "@/lib/supabase/server";
import type {
  ListingCategory,
  ListingSegment,
  ListingWithRelations,
} from "@/types";

export interface BrowseFilters {
  category?: ListingCategory;
  segment?: ListingSegment;
  city?: string;
  minPrice?: number; // cents
  maxPrice?: number; // cents
  // Availability window the renter wants (ISO dates). Listings with a blocked
  // overlap are filtered out.
  startDate?: string;
  endDate?: string;
}

// The select string used everywhere we need a listing + its images + owner.
const LISTING_SELECT = `
  *,
  images:listing_images(*),
  owner:profiles!listings_owner_id_fkey(id, full_name, avatar_url, is_verified)
`;

/** Browse/search active listings. RLS already restricts to active + owned. */
export async function getListings(filters: BrowseFilters = {}): Promise<ListingWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.segment) query = query.eq("segment", filters.segment);
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (typeof filters.minPrice === "number") query = query.gte("price_per_day", filters.minPrice);
  if (typeof filters.maxPrice === "number") query = query.lte("price_per_day", filters.maxPrice);

  const { data, error } = await query;
  if (error) throw error;

  let listings = (data ?? []) as unknown as ListingWithRelations[];

  // Date-availability filter is done in app code: drop listings whose blocked
  // windows overlap the requested range.
  // TODO: push this into SQL (an RPC or a NOT EXISTS subquery) for scale.
  if (filters.startDate && filters.endDate) {
    const blocked = await getBlockedListingIds(filters.startDate, filters.endDate);
    listings = listings.filter((l) => !blocked.has(l.id));
  }

  // Keep image order stable.
  for (const l of listings) {
    l.images?.sort((a, b) => a.sort_order - b.sort_order);
  }
  return listings;
}

async function getBlockedListingIds(startDate: string, endDate: string): Promise<Set<string>> {
  const supabase = await createClient();
  // Overlap test: existing.start <= requested.end AND existing.end >= requested.start
  const { data } = await supabase
    .from("availability")
    .select("listing_id")
    .eq("is_blocked", true)
    .lte("start_date", endDate)
    .gte("end_date", startDate);
  return new Set((data ?? []).map((r) => r.listing_id));
}

/** Single listing with images + owner. Returns null if not visible. */
export async function getListingById(id: string): Promise<ListingWithRelations | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const listing = data as unknown as ListingWithRelations;
  listing.images?.sort((a, b) => a.sort_order - b.sort_order);
  return listing;
}

/** Blocked date ranges for a listing (used to render the availability calendar). */
export async function getListingBlockedRanges(listingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability")
    .select("start_date, end_date, is_blocked")
    .eq("listing_id", listingId)
    .eq("is_blocked", true);
  return data ?? [];
}
