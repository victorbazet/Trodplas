"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { listingSchema } from "@/lib/validations";

type Result = { error?: string; listingId?: string };

/**
 * Create a listing. `imageUrls` are already-uploaded Supabase Storage public
 * URLs (the multi-step form uploads them client-side before calling this).
 * Prices arrive in EUROS from the form and are converted to cents here.
 */
export async function createListing(input: unknown): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      owner_id: user.id,
      title: d.title,
      description: d.description,
      category: d.category,
      segment: d.segment,
      price_per_day: Math.round(d.pricePerDay * 100),
      deposit_amount: Math.round(d.depositAmount * 100),
      city: d.city || null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !listing) return { error: error?.message ?? "Could not create listing." };

  if (d.imageUrls.length) {
    await supabase.from("listing_images").insert(
      d.imageUrls.map((url, i) => ({ listing_id: listing.id, url, sort_order: i })),
    );
  }

  revalidatePath("/browse");
  revalidatePath("/dashboard");
  redirect(`/listings/${listing.id}`);
}

export async function updateListing(listingId: string, input: unknown): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };
  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const supabase = await createClient();
  // RLS ensures only the owner can update.
  const { error } = await supabase
    .from("listings")
    .update({
      title: d.title,
      description: d.description,
      category: d.category,
      segment: d.segment,
      price_per_day: Math.round(d.pricePerDay * 100),
      deposit_amount: Math.round(d.depositAmount * 100),
      city: d.city || null,
    })
    .eq("id", listingId);
  if (error) return { error: error.message };

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard");
  return { listingId };
}

/** Soft-delete (status = 'deleted'). We never hard-delete to preserve history. */
export async function deleteListing(listingId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("listings")
    .update({ status: "deleted" })
    .eq("id", listingId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { listingId };
}

export async function setListingStatus(
  listingId: string,
  status: "active" | "paused",
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("listings").update({ status }).eq("id", listingId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { listingId };
}
