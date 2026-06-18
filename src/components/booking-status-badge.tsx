import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { Booking, BookingStatus } from "@/types";

const MAP: Record<BookingStatus, { label: string; variant: BadgeProps["variant"] }> = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  active: { label: "Active", variant: "default" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "outline" },
  declined: { label: "Declined", variant: "destructive" },
};

/**
 * Renders a booking status. A pending booking that already has a rental
 * PaymentIntent means the lender accepted and we're awaiting payment.
 */
export function BookingStatusBadge({ booking }: { booking: Pick<Booking, "status" | "stripe_payment_intent_id"> }) {
  if (booking.status === "pending" && booking.stripe_payment_intent_id) {
    return <Badge variant="warning">Awaiting payment</Badge>;
  }
  const m = MAP[booking.status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
