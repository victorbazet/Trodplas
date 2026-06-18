"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/utils";

interface CheckoutFormProps {
  bookingId: string;
  rentalClientSecret: string;
  depositClientSecret: string | null;
  totalAmount: number;
  depositAmount: number;
}

/**
 * Two-step checkout:
 *   Step 1 — pay the rental (destination charge → lender, immediate capture).
 *   Step 2 — authorize the deposit hold (manual capture; not charged).
 * Once both succeed we send the renter back to the booking; the rental
 * payment_intent.succeeded webhook flips the booking to 'confirmed'.
 */
export function CheckoutForm(props: CheckoutFormProps) {
  const [step, setStep] = useState<"rental" | "deposit" | "done">("rental");
  const stripePromise = getStripe();

  if (step === "done") return null;

  const hasDeposit = props.depositAmount > 0 && props.depositClientSecret;

  return (
    <div className="space-y-4">
      <ol className="flex gap-2 text-sm">
        <Step active={step === "rental"} done={step !== "rental"}>1. Pay rental</Step>
        {hasDeposit && <Step active={step === "deposit"}>2. Authorize deposit</Step>}
      </ol>

      {step === "rental" && (
        <Elements stripe={stripePromise} options={{ clientSecret: props.rentalClientSecret }}>
          <PaymentStep
            title={`Pay ${formatCents(props.totalAmount)} rental`}
            mode="payment"
            cta="Pay now"
            onSuccess={() => {
              if (hasDeposit) setStep("deposit");
              else finish(props.bookingId);
            }}
          />
        </Elements>
      )}

      {step === "deposit" && hasDeposit && (
        <Elements stripe={stripePromise} options={{ clientSecret: props.depositClientSecret! }}>
          <PaymentStep
            title={`Authorize ${formatCents(props.depositAmount)} refundable deposit`}
            description="This places a temporary hold on your card. It is not charged and is released after a successful return."
            mode="hold"
            cta="Authorize deposit"
            onSuccess={() => finish(props.bookingId)}
          />
        </Elements>
      )}
    </div>
  );
}

function finish(bookingId: string) {
  // Full navigation so server components re-read the (webhook-updated) status.
  window.location.href = `/dashboard/bookings/${bookingId}?paid=1`;
}

function PaymentStep({
  title,
  description,
  mode,
  cta,
  onSuccess,
}: {
  title: string;
  description?: string;
  mode: "payment" | "hold";
  cta: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handle() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    setSubmitting(false);
    if (error) {
      setError(error.message ?? "Payment failed.");
      return;
    }
    // 'succeeded' for the rental; 'requires_capture' for the manual-capture hold.
    const ok =
      paymentIntent?.status === "succeeded" ||
      paymentIntent?.status === "requires_capture";
    if (ok) onSuccess();
    else setError(`Unexpected status: ${paymentIntent?.status}`);
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <PaymentElement />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handle} disabled={!stripe || submitting} className="w-full">
          {submitting ? "Processing…" : cta}
        </Button>
      </CardContent>
    </Card>
  );
}

function Step({
  children,
  active,
  done,
}: {
  children: React.ReactNode;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <li
      className={`rounded-md border px-3 py-1.5 ${
        active ? "border-primary text-primary" : done ? "text-muted-foreground line-through" : "text-muted-foreground"
      }`}
    >
      {children}
    </li>
  );
}
