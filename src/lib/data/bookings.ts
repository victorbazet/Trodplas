import { createClient } from "@/lib/supabase/server";
import type { BookingWithRelations, ListingWithRelations } from "@/types";

const BOOKING_SELECT = `
  *,
  listing:listings!bookings_listing_id_fkey(
    *,
    images:listing_images(*),
    owner:profiles!listings_owner_id_fkey(id, full_name, avatar_url)
  ),
  renter:profiles!bookings_renter_id_fkey(id, full_name, avatar_url)
`;

/** Listings owned by the current user (any status except deleted). */
export async function getMyListings(userId: string): Promise<ListingWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("*, images:listing_images(*), owner:profiles!listings_owner_id_fkey(id, full_name, avatar_url, is_verified)")
    .eq("owner_id", userId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ListingWithRelations[];
}

/** Bookings where the user is the renter. */
export async function getBookingsAsRenter(userId: string): Promise<BookingWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("renter_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as BookingWithRelations[];
}

/** Bookings on listings the user owns (incoming requests as a lender). */
export async function getBookingsAsLender(userId: string): Promise<BookingWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      `*,
       listing:listings!inner(
         *,
         images:listing_images(*),
         owner:profiles!listings_owner_id_fkey(id, full_name, avatar_url)
       ),
       renter:profiles!bookings_renter_id_fkey(id, full_name, avatar_url)`,
    )
    .eq("listing.owner_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as BookingWithRelations[];
}

/** A single booking with all relations. RLS limits this to participants. */
export async function getBookingById(id: string): Promise<BookingWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as BookingWithRelations) ?? null;
}
