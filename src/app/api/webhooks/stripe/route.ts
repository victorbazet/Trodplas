import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAccountFullyOnboarded } from "@/lib/stripe/connect";
import { sendBookingConfirmedEmail } from "@/lib/email/send";

/**
 * Stripe webhook endpoint.
 *
 * Local dev:
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 *   (copy the printed whsec_... into STRIPE_WEBHOOK_SECRET)
 *
 * We must read the RAW request body to verify the signature — never parse JSON
 * before verifying. This route uses the admin (service_role) Supabase client
 * because webhooks have no user session.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, serverEnv.stripeWebhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.amount_capturable_updated":
        // The deposit hold was authorized (manual capture). Nothing to do yet —
        // we capture or release it at return time.
        console.log("[webhook] deposit authorized:", event.data.object.id);
        break;
      case "payment_intent.payment_failed":
        console.warn("[webhook] payment failed:", event.data.object.id);
        // TODO: notify the renter / keep the booking pending for retry.
        break;
      default:
        // Unhandled event types are fine to ignore.
        break;
    }
  } catch (err) {
    console.error(`[webhook] handler error for ${event.type}:`, err);
    // Returning 500 makes Stripe retry — good for transient failures.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Sync a connected account's onboarding state onto the profile. */
async function handleAccountUpdated(account: Stripe.Account) {
  const admin = createAdminClient();
  const onboarded = isAccountFullyOnboarded(account);
  await admin
    .from("profiles")
    .update({ stripe_onboarded: onboarded })
    .eq("stripe_account_id", account.id);
}

/** When the RENTAL payment succeeds, confirm the booking and block the dates. */
async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  // Only the rental PI confirms a booking; the deposit PI uses manual capture
  // and never reaches 'succeeded' until we capture it.
  if (pi.metadata?.kind !== "rental") return;
  const bookingId = pi.metadata?.booking_id;
  if (!bookingId) return;

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select(
      "id, status, start_date, end_date, listing_id, renter_id, listing:listings!bookings_listing_id_fkey(title, owner_id)",
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.status === "confirmed") return;

  await admin.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);

  // Block the booked window so the item can't be double-booked.
  await admin.from("availability").insert({
    listing_id: booking.listing_id,
    start_date: booking.start_date,
    end_date: booking.end_date,
    is_blocked: true,
  });

  // Notify both parties (best-effort).
  // @ts-expect-error nested relation typing
  const title: string = booking.listing.title;
  // @ts-expect-error nested relation typing
  const ownerId: string = booking.listing.owner_id;
  const [{ data: renter }, { data: owner }] = await Promise.all([
    admin.auth.admin.getUserById(booking.renter_id),
    admin.auth.admin.getUserById(ownerId),
  ]);
  if (renter.user?.email) void sendBookingConfirmedEmail(renter.user.email, title, bookingId);
  if (owner.user?.email) void sendBookingConfirmedEmail(owner.user.email, title, bookingId);
}
