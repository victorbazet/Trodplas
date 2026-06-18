"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingRequestSchema } from "@/lib/validations";
import { quoteBooking } from "@/lib/stripe/fees";
import { createBookingPayments, releaseDeposit } from "@/lib/stripe/payments";
import {
  sendBookingConfirmedEmail,
  sendBookingDeclinedEmail,
  sendBookingRequestedEmail,
} from "@/lib/email/send";

type Result = { error?: string; bookingId?: string };

/**
 * RENTER → creates a pending booking request.
 * Pricing is computed server-side from the listing so the client can't tamper.
 */
export async function requestBooking(formData: FormData): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be logged in." };

  const parsed = bookingRequestSchema.safeParse({
    listingId: formData.get("listingId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid dates" };

  const supabase = await createClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("id, owner_id, title, price_per_day, deposit_amount, status")
    .eq("id", parsed.data.listingId)
    .maybeSingle();

  if (!listing || listing.status !== "active") return { error: "Listing unavailable." };
  if (listing.owner_id === user.id) return { error: "You can't book your own listing." };

  const quote = quoteBooking({
    pricePerDay: listing.price_per_day,
    depositAmount: listing.deposit_amount,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  });

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      listing_id: listing.id,
      renter_id: user.id,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
      total_amount: quote.totalAmount,
      platform_fee: quote.platformFee,
      deposit_amount: quote.depositAmount,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !booking) return { error: error?.message ?? "Could not create booking." };

  // Notify the lender (best-effort).
  const { data: ownerEmail } = await getUserEmail(listing.owner_id);
  if (ownerEmail) void sendBookingRequestedEmail(ownerEmail, listing.title, booking.id);

  redirect(`/dashboard/bookings/${booking.id}`);
}

/**
 * LENDER → accepts the request. Creates the rental + deposit PaymentIntents and
 * stores their ids on the booking. Status stays 'pending' until the renter pays
 * (the payment_intent.succeeded webhook flips it to 'confirmed').
 */
export async function acceptBooking(bookingId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, listing:listings!bookings_listing_id_fkey(owner_id, title)")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return { error: "Booking not found." };
  // @ts-expect-error nested relation typing
  if (booking.listing.owner_id !== user.id) return { error: "Only the owner can accept." };
  if (booking.status !== "pending") return { error: "Booking is no longer pending." };

  // The lender must have a fully-onboarded Stripe account to receive funds.
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_onboarded")
    .eq("id", user.id)
    .single();

  if (!ownerProfile?.stripe_account_id || !ownerProfile.stripe_onboarded) {
    return { error: "Connect your Stripe payouts before accepting bookings." };
  }

  const quote = quoteBooking({
    pricePerDay: Math.round(booking.total_amount / Math.max(1, daysBetween(booking))),
    depositAmount: booking.deposit_amount,
    startDate: booking.start_date,
    endDate: booking.end_date,
  });
  // Use stored totals directly (authoritative), not the re-derived per-day.
  quote.totalAmount = booking.total_amount;
  quote.platformFee = booking.platform_fee;

  const intents = await createBookingPayments({
    quote,
    lenderAccountId: ownerProfile.stripe_account_id,
    bookingId: booking.id,
  });

  await supabase
    .from("bookings")
    .update({
      stripe_payment_intent_id: intents.rentalIntentId,
      stripe_deposit_intent_id: intents.depositIntentId,
    })
    .eq("id", booking.id);

  revalidatePath(`/dashboard/bookings/${booking.id}`);
  return { bookingId: booking.id };
}

/** LENDER → declines the request. */
export async function declineBooking(bookingId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, renter_id, listing:listings!bookings_listing_id_fkey(owner_id, title)")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return { error: "Booking not found." };
  // @ts-expect-error nested relation typing
  if (booking.listing.owner_id !== user.id) return { error: "Only the owner can decline." };

  await supabase.from("bookings").update({ status: "declined" }).eq("id", bookingId);

  const { data: renterEmail } = await getUserEmail(booking.renter_id);
  // @ts-expect-error nested relation typing
  if (renterEmail) void sendBookingDeclinedEmail(renterEmail, booking.listing.title);

  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { bookingId };
}

/**
 * Either party → cancel a booking that isn't active/completed yet.
 * Releases the deposit hold if one exists.
 * TODO: refund the rental payment if it was already captured (see refundRental()).
 */
export async function cancelBooking(bookingId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, stripe_deposit_intent_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { error: "Booking not found." };
  if (["active", "completed"].includes(booking.status)) {
    return { error: "Active or completed bookings can't be cancelled here." };
  }

  if (booking.stripe_deposit_intent_id) {
    try {
      await releaseDeposit(booking.stripe_deposit_intent_id);
    } catch (e) {
      console.error("[cancelBooking] deposit release failed", e);
    }
  }

  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { bookingId };
}

/** LENDER → mark the item handed over (rental in progress). */
export async function markActive(bookingId: string): Promise<Result> {
  return transition(bookingId, "confirmed", "active");
}

/**
 * LENDER → mark returned. Releases the deposit hold (no dispute) and completes
 * the booking, unlocking reviews.
 */
export async function markCompleted(bookingId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, stripe_deposit_intent_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { error: "Booking not found." };

  if (booking.stripe_deposit_intent_id) {
    try {
      await releaseDeposit(booking.stripe_deposit_intent_id);
    } catch (e) {
      console.error("[markCompleted] deposit release failed", e);
    }
  }
  await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId);
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { bookingId };
}

// ---- helpers -----------------------------------------------------------------

async function transition(
  bookingId: string,
  from: string,
  to: "active" | "completed",
): Promise<Result> {
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return { error: "Booking not found." };
  if (booking.status !== from) return { error: `Booking must be '${from}'.` };
  await supabase.from("bookings").update({ status: to }).eq("id", bookingId);
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return { bookingId };
}

function daysBetween(b: { start_date: string; end_date: string }) {
  const ms = new Date(b.end_date).getTime() - new Date(b.start_date).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/**
 * Look up a user's email. We use the admin client because auth.users isn't
 * exposed via RLS. Returns { data: email | null }.
 */
async function getUserEmail(userId: string): Promise<{ data: string | null }> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(userId);
    return { data: data.user?.email ?? null };
  } catch {
    return { data: null };
  }
}

// Re-exported so the webhook can send the confirmation email after payment.
export { sendBookingConfirmedEmail };
