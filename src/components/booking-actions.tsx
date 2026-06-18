"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptBooking,
  declineBooking,
  cancelBooking,
  markActive,
  markCompleted,
} from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import type { BookingStatus } from "@/types";

interface BookingActionsProps {
  bookingId: string;
  status: BookingStatus;
  isOwner: boolean;
  isRenter: boolean;
  hasPaymentIntent: boolean;
}

/**
 * Renders the right action buttons depending on the booking state and whether
 * the viewer is the lender (owner) or the renter.
 */
export function BookingActions({
  bookingId,
  status,
  isOwner,
  isRenter,
  hasPaymentIntent,
}: BookingActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ error?: string }>, goPay = false) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setError(res.error);
      else if (goPay) router.push(`/dashboard/bookings/${bookingId}/pay`);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {/* Lender: pending request awaiting decision */}
        {isOwner && status === "pending" && !hasPaymentIntent && (
          <>
            <Button onClick={() => run(() => acceptBooking(bookingId))} disabled={pending}>
              Accept request
            </Button>
            <Button
              variant="outline"
              onClick={() => run(() => declineBooking(bookingId))}
              disabled={pending}
            >
              Decline
            </Button>
          </>
        )}

        {/* Renter: accepted, awaiting payment */}
        {isRenter && status === "pending" && hasPaymentIntent && (
          <Button onClick={() => router.push(`/dashboard/bookings/${bookingId}/pay`)}>
            Pay &amp; confirm
          </Button>
        )}

        {/* Lender: confirmed → hand over */}
        {isOwner && status === "confirmed" && (
          <Button onClick={() => run(() => markActive(bookingId))} disabled={pending}>
            Mark as handed over
          </Button>
        )}

        {/* Lender: active → returned */}
        {isOwner && status === "active" && (
          <Button onClick={() => run(() => markCompleted(bookingId))} disabled={pending}>
            Mark as returned (release deposit)
          </Button>
        )}

        {/* Either party: cancel while not active/completed */}
        {(isOwner || isRenter) &&
          ["pending", "confirmed"].includes(status) && (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => run(() => cancelBooking(bookingId))}
              disabled={pending}
            >
              Cancel booking
            </Button>
          )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
