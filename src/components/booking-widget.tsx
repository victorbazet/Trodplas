"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { requestBooking } from "@/app/actions/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatCents, countDays } from "@/lib/utils";

interface BookingWidgetProps {
  listingId: string;
  pricePerDay: number;
  depositAmount: number;
  feeBps: number;
  isOwner: boolean;
  isLoggedIn: boolean;
}

/**
 * "Request to book" panel on the listing page. Shows a live price estimate and
 * submits a pending booking via the requestBooking server action.
 */
export function BookingWidget({
  listingId,
  pricePerDay,
  depositAmount,
  feeBps,
  isOwner,
  isLoggedIn,
}: BookingWidgetProps) {
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const quote = useMemo(() => {
    if (!start || !end || end < start) return null;
    const days = countDays(start, end);
    const total = pricePerDay * days;
    const fee = Math.round((total * feeBps) / 10_000);
    return { days, total, fee, deposit: depositAmount };
  }, [start, end, pricePerDay, depositAmount, feeBps]);

  async function onSubmit(formData: FormData) {
    setError(null);
    if (!isLoggedIn) {
      router.push(`/login?redirect=/listings/${listingId}`);
      return;
    }
    setSubmitting(true);
    const res = await requestBooking(formData);
    setSubmitting(false);
    if (res?.error) setError(res.error);
    // On success the action redirects to the booking page.
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <p className="text-2xl font-bold">
          {formatCents(pricePerDay)}
          <span className="text-base font-normal text-muted-foreground"> / day</span>
        </p>

        {isOwner ? (
          <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            This is your listing. Manage it from your dashboard.
          </p>
        ) : (
          <form action={onSubmit} className="space-y-3">
            <input type="hidden" name="listingId" value={listingId} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">From</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">To</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  value={end}
                  min={start || undefined}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>

            {quote && (
              <div className="space-y-1 rounded-md border p-3 text-sm">
                <Row label={`${formatCents(pricePerDay)} × ${quote.days} day(s)`} value={formatCents(quote.total)} />
                <Row label="Service fee" value={`included`} muted />
                <Row
                  label="Refundable deposit (hold)"
                  value={quote.deposit > 0 ? formatCents(quote.deposit) : "—"}
                  muted
                />
                <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                  <span>Due now</span>
                  <span>{formatCents(quote.total)}</span>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting || !quote}>
              {submitting ? "Sending request…" : isLoggedIn ? "Request to book" : "Log in to book"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              You won&apos;t be charged until the owner accepts.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
