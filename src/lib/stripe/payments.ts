import { stripe } from "@/lib/stripe/server";
import type { BookingQuote } from "@/lib/stripe/fees";

/**
 * Trodplas payment model
 * =======================
 *
 * Each confirmed booking creates TWO PaymentIntents:
 *
 *  1. RENTAL PAYMENT — a *destination charge* (charge on the platform account,
 *     funds routed to the lender's connected account):
 *       - application_fee_amount = platform commission (20%)
 *       - transfer_data.destination = lender's acct_...
 *     The lender receives 80%; the platform keeps the application fee.
 *
 *  2. SECURITY DEPOSIT — a SEPARATE PaymentIntent with capture_method:'manual'.
 *     This authorizes (holds) funds on the renter's card WITHOUT capturing.
 *       - On normal return  → cancel the PI to release the hold.
 *       - On a dispute       → capture (full or partial) the held amount.
 *     The deposit stays on the PLATFORM account (no transfer_data) so the
 *     platform arbitrates disputes. Card authorizations are valid ~7 days by
 *     default (see TODO on extended authorization for longer rentals).
 *
 * Both PaymentIntents are confirmed client-side with Stripe.js using their
 * client_secret. We return both client secrets to the booking checkout page.
 */

interface CreateBookingPaymentsParams {
  quote: BookingQuote;
  /** The lender's connected account id (acct_...). */
  lenderAccountId: string;
  /** Our internal booking id, attached as metadata for webhook reconciliation. */
  bookingId: string;
  currency?: string;
}

export interface BookingPaymentIntents {
  rentalIntentId: string;
  rentalClientSecret: string | null;
  depositIntentId: string | null;
  depositClientSecret: string | null;
}

export async function createBookingPayments({
  quote,
  lenderAccountId,
  bookingId,
  currency = "eur",
}: CreateBookingPaymentsParams): Promise<BookingPaymentIntents> {
  // 1) Rental payment — destination charge with application fee.
  const rentalIntent = await stripe.paymentIntents.create({
    amount: quote.totalAmount,
    currency,
    capture_method: "automatic",
    application_fee_amount: quote.platformFee,
    transfer_data: { destination: lenderAccountId },
    automatic_payment_methods: { enabled: true },
    metadata: { booking_id: bookingId, kind: "rental" },
  });

  // 2) Security deposit — separate manual-capture authorization hold.
  let depositIntent = null as Awaited<
    ReturnType<typeof stripe.paymentIntents.create>
  > | null;

  if (quote.depositAmount > 0) {
    depositIntent = await stripe.paymentIntents.create({
      amount: quote.depositAmount,
      currency,
      capture_method: "manual", // authorize only — do NOT capture
      automatic_payment_methods: { enabled: true },
      // TODO: for rentals longer than ~7 days, request an extended authorization
      // (payment_method_options.card.request_extended_authorization) at confirm
      // time, or re-authorize a fresh hold near expiry. See README.
      metadata: { booking_id: bookingId, kind: "deposit" },
    });
  }

  return {
    rentalIntentId: rentalIntent.id,
    rentalClientSecret: rentalIntent.client_secret,
    depositIntentId: depositIntent?.id ?? null,
    depositClientSecret: depositIntent?.client_secret ?? null,
  };
}

/**
 * Release the deposit hold (normal, no-dispute return).
 * Cancelling an uncaptured PaymentIntent voids the authorization.
 */
export async function releaseDeposit(depositIntentId: string) {
  return stripe.paymentIntents.cancel(depositIntentId);
}

/**
 * Capture the deposit (fully or partially) when there's damage/dispute.
 * Pass amountToCapture in cents to capture less than the held amount;
 * the remainder is automatically released.
 */
export async function captureDeposit(
  depositIntentId: string,
  amountToCapture?: number,
) {
  return stripe.paymentIntents.capture(
    depositIntentId,
    amountToCapture ? { amount_to_capture: amountToCapture } : undefined,
  );
}

/** Refund a captured rental payment (e.g. lender-initiated cancellation). */
export async function refundRental(
  rentalIntentId: string,
  options?: { amount?: number; reverseTransfer?: boolean },
) {
  return stripe.refunds.create({
    payment_intent: rentalIntentId,
    amount: options?.amount,
    // Pull the funds back from the lender's connected account too.
    reverse_transfer: options?.reverseTransfer ?? true,
    refund_application_fee: true,
  });
}
