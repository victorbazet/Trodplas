import { createClient } from "@/lib/supabase/server";
import type { ReviewWithReviewer } from "@/types";

/** All reviews written about a given user (their reputation as a lender/renter). */
export async function getReviewsForUser(userId: string): Promise<ReviewWithReviewer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      "*, reviewer:profiles!reviews_reviewer_id_fkey(id, full_name, avatar_url)",
    )
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as ReviewWithReviewer[];
}

export function averageRating(reviews: { rating: number }[]): number | null {
  if (!reviews.length) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}
