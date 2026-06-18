"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import {
  createConnectAccount,
  createOnboardingLink,
  isAccountFullyOnboarded,
} from "@/lib/stripe/connect";

/**
 * Start (or resume) Stripe Connect onboarding for the current user as a lender.
 * Creates an Express account if they don't have one, then redirects to the
 * hosted onboarding flow.
 */
// Used directly as a <form action> → returns void; redirects on completion.
export async function startStripeOnboarding(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/onboarding");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  let accountId = profile?.stripe_account_id ?? null;
  if (!accountId) {
    const account = await createConnectAccount(user.email);
    accountId = account.id;
    await supabase.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
  }

  const link = await createOnboardingLink(accountId);
  redirect(link.url);
}

/**
 * Re-check the connected account with Stripe and sync stripe_onboarded.
 * Called on the onboarding return page (a fast complement to the webhook).
 */
export async function syncOnboardingStatus(): Promise<{ onboarded: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { onboarded: false };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_onboarded")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_account_id) return { onboarded: false };

  const account = await stripe.accounts.retrieve(profile.stripe_account_id);
  const onboarded = isAccountFullyOnboarded(account);
  if (onboarded !== profile.stripe_onboarded) {
    await supabase.from("profiles").update({ stripe_onboarded: onboarded }).eq("id", user.id);
    revalidatePath("/dashboard");
  }
  return { onboarded };
}

/**
 * Retrieve the client secrets for a booking's rental + deposit PaymentIntents.
 * Only the renter of a pending, accepted booking may fetch them.
 */
export async function getBookingPaymentSecrets(bookingId: string): Promise<{
  error?: string;
  rentalClientSecret?: string;
  depositClientSecret?: string | null;
}> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("renter_id, status, stripe_payment_intent_id, stripe_deposit_intent_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return { error: "Booking not found." };
  if (booking.renter_id !== user.id) return { error: "Only the renter can pay." };
  if (!booking.stripe_payment_intent_id) {
    return { error: "The owner hasn't accepted this booking yet." };
  }
  if (booking.status !== "pending") return { error: "This booking is already paid or closed." };

  const rental = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
  const deposit = booking.stripe_deposit_intent_id
    ? await stripe.paymentIntents.retrieve(booking.stripe_deposit_intent_id)
    : null;

  return {
    rentalClientSecret: rental.client_secret ?? undefined,
    depositClientSecret: deposit?.client_secret ?? null,
  };
}
