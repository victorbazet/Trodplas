import { serverEnv } from "@/lib/env";
import { countDays } from "@/lib/utils";

export interface BookingQuote {
  /** Number of rental days (inclusive). */
  days: number;
  /** Rental subtotal in cents (price_per_day * days). This is the amount charged. */
  totalAmount: number;
  /** Platform commission in cents (taken from totalAmount via application_fee_amount). */
  platformFee: number;
  /** Amount the lender receives in cents (totalAmount - platformFee). */
  lenderAmount: number;
  /** Security deposit hold in cents (separate manual-capture PaymentIntent). */
  depositAmount: number;
}

/**
 * Compute the price breakdown for a booking. Pure function — used both when
 * quoting in the UI and when creating PaymentIntents server-side, so the
 * numbers always agree.
 */
export function quoteBooking(params: {
  pricePerDay: number;
  depositAmount: number;
  startDate: string;
  endDate: string;
  feeBps?: number;
}): BookingQuote {
  const feeBps = params.feeBps ?? serverEnv.platformFeeBps;
  const days = countDays(params.startDate, params.endDate);
  const totalAmount = params.pricePerDay * days;
  const platformFee = Math.round((totalAmount * feeBps) / 10_000);
  return {
    days,
    totalAmount,
    platformFee,
    lenderAmount: totalAmount - platformFee,
    depositAmount: params.depositAmount,
  };
}
