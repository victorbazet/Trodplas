"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validations";

type Result = { error?: string };

/**
 * Leave a review after a completed booking. The reviewee is the *other* party
 * (lender reviews renter and vice-versa). RLS enforces participation + that the
 * booking is completed; we compute the reviewee here.
 */
export async function leaveReview(formData: FormData): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const parsed = reviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid review" };

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, renter_id, listing:listings!bookings_listing_id_fkey(owner_id)")
    .eq("id", parsed.data.bookingId)
    .maybeSingle();

  if (!booking) return { error: "Booking not found." };
  if (booking.status !== "completed") return { error: "You can only review completed bookings." };

  // @ts-expect-error nested relation typing
  const ownerId: string = booking.listing.owner_id;
  const reviewee = user.id === booking.renter_id ? ownerId : booking.renter_id;
  if (reviewee === user.id) return { error: "You can't review yourself." };

  const { error } = await supabase.from("reviews").insert({
    booking_id: parsed.data.bookingId,
    reviewer_id: user.id,
    reviewee_id: reviewee,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
  });
  if (error) {
    // Unique (booking_id, reviewer_id) → already reviewed.
    if (error.code === "23505") return { error: "You already reviewed this booking." };
    return { error: error.message };
  }

  revalidatePath(`/dashboard/bookings/${parsed.data.bookingId}`);
  return {};
}
