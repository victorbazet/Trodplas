import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { getBookingById } from "@/lib/data/bookings";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { BookingActions } from "@/components/booking-actions";
import { MessageThread } from "@/components/message-thread";
import { ReviewForm } from "@/components/review-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents, formatDateRange } from "@/lib/utils";
import type { Message } from "@/types";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/dashboard/bookings/${id}`);

  const booking = await getBookingById(id);
  if (!booking) notFound();

  const supabase = await createClient();
  const [{ data: messages }, { data: myReview }] = await Promise.all([
    supabase.from("messages").select("*").eq("booking_id", id).order("created_at"),
    supabase.from("reviews").select("id").eq("booking_id", id).eq("reviewer_id", user.id).maybeSingle(),
  ]);

  const isOwner = booking.listing.owner.id === user.id;
  const isRenter = booking.renter.id === user.id;
  const lenderAmount = booking.total_amount - booking.platform_fee;
  const otherParty = isOwner ? booking.renter : booking.listing.owner;

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {booking.listing.images?.[0]?.url && (
            <Image src={booking.listing.images[0].url} alt="" fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div className="flex-1">
          <Link href={`/listings/${booking.listing.id}`} className="text-xl font-bold hover:underline">
            {booking.listing.title}
          </Link>
          <p className="text-muted-foreground">{formatDateRange(booking.start_date, booking.end_date)}</p>
          <p className="text-sm text-muted-foreground">
            {isOwner ? "Rented by" : "Owned by"} {otherParty.full_name ?? "User"}
          </p>
        </div>
        <BookingStatusBadge booking={booking} />
      </div>

      {/* Price breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Payment summary</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Row label="Rental total" value={formatCents(booking.total_amount)} />
          <Row label="Platform fee (20%)" value={`− ${formatCents(booking.platform_fee)}`} muted />
          <Row label={isOwner ? "You receive" : "Owner receives"} value={formatCents(lenderAmount)} muted />
          <Row
            label="Security deposit (held, refundable)"
            value={booking.deposit_amount > 0 ? formatCents(booking.deposit_amount) : "—"}
            muted
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <BookingActions
        bookingId={booking.id}
        status={booking.status}
        isOwner={isOwner}
        isRenter={isRenter}
        hasPaymentIntent={Boolean(booking.stripe_payment_intent_id)}
      />

      {/* Messages */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Messages</h2>
        <MessageThread
          bookingId={booking.id}
          messages={(messages ?? []) as Message[]}
          currentUserId={user.id}
        />
      </section>

      {/* Review (after completion) */}
      {booking.status === "completed" && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Leave a review</h2>
          {myReview ? (
            <p className="text-sm text-muted-foreground">You&apos;ve already reviewed this booking.</p>
          ) : (
            <ReviewForm bookingId={booking.id} revieweeName={otherParty.full_name ?? "the other party"} />
          )}
        </section>
      )}
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : "font-medium"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
