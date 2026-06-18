// =============================================================================
// Database types.
//
// This mirrors the SQL in supabase/migrations/. In a real project you'd
// generate it with:  `supabase gen types typescript --linked > src/types/database.ts`
// We hand-write it here so the skeleton type-checks without a live Supabase
// connection. Keep it in sync with the migrations.
// =============================================================================

export type ListingCategory =
  | "tools"
  | "garden"
  | "camping"
  | "photo"
  | "video"
  | "audio"
  | "instruments"
  | "other";

export type ListingSegment = "consumer" | "pro";

export type ListingStatus = "active" | "paused" | "deleted";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled"
  | "declined";

// A small helper for table shapes. supabase-js v2 requires Row/Insert/Update
// AND a Relationships key, otherwise query results infer to `never`.
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        bio: string | null;
        is_verified: boolean;
        stripe_account_id: string | null;
        stripe_onboarded: boolean;
        created_at: string;
      }>;
      listings: Table<{
        id: string;
        owner_id: string;
        title: string;
        description: string;
        category: ListingCategory;
        segment: ListingSegment;
        price_per_day: number;
        deposit_amount: number;
        city: string | null;
        latitude: number | null;
        longitude: number | null;
        status: ListingStatus;
        created_at: string;
      }>;
      listing_images: Table<{
        id: string;
        listing_id: string;
        url: string;
        sort_order: number;
        created_at: string;
      }>;
      availability: Table<{
        id: string;
        listing_id: string;
        start_date: string;
        end_date: string;
        is_blocked: boolean;
        created_at: string;
      }>;
      bookings: Table<{
        id: string;
        listing_id: string;
        renter_id: string;
        start_date: string;
        end_date: string;
        total_amount: number;
        platform_fee: number;
        deposit_amount: number;
        status: BookingStatus;
        stripe_payment_intent_id: string | null;
        stripe_deposit_intent_id: string | null;
        created_at: string;
      }>;
      messages: Table<{
        id: string;
        booking_id: string;
        sender_id: string;
        content: string;
        created_at: string;
      }>;
      reviews: Table<{
        id: string;
        booking_id: string;
        reviewer_id: string;
        reviewee_id: string;
        rating: number;
        comment: string | null;
        created_at: string;
      }>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      listing_category: ListingCategory;
      listing_segment: ListingSegment;
      listing_status: ListingStatus;
      booking_status: BookingStatus;
    };
    CompositeTypes: Record<never, never>;
  };
}

// Convenience row aliases.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type ListingImage = Database["public"]["Tables"]["listing_images"]["Row"];
export type Availability = Database["public"]["Tables"]["availability"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
