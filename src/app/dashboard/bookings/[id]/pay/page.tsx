import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { getBookingById } from "@/lib/data/bookings";
import { getBookingPaymentSecrets } from "@/app/actions/stripe";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata = { title: "Checkout" };

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/dashboard/bookings/${id}/pay`);

  const booking = await getBookingById(id);
  if (!booking) notFound();

  const secrets = await getBookingPaymentSecrets(id);

  return (
    <div className="container max-w-lg space-y-6 py-8">
      <Link
        href={`/dashboard/bookings/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to booking
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Confirm &amp; pay</h1>
        <p className="text-muted-foreground">{booking.listing.title}</p>
      </div>

      {secrets.error || !secrets.rentalClientSecret ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {secrets.error ?? "Payment is not ready yet."}
        </div>
      ) : (
        <CheckoutForm
          bookingId={booking.id}
          rentalClientSecret={secrets.rentalClientSecret}
          depositClientSecret={secrets.depositClientSecret ?? null}
          totalAmount={booking.total_amount}
          depositAmount={booking.deposit_amount}
        />
      )}
    </div>
  );
}
