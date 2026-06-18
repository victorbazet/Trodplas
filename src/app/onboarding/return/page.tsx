import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { syncOnboardingStatus } from "@/app/actions/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Onboarding complete" };

/**
 * Stripe returns the lender here after onboarding. We proactively re-check the
 * account status (the account.updated webhook also does this asynchronously).
 */
export default async function OnboardingReturnPage() {
  const { onboarded } = await syncOnboardingStatus();

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {onboarded ? <CheckCircle2 className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
          </div>
          <CardTitle>{onboarded ? "You're all set!" : "Almost there"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {onboarded
              ? "Your Stripe account is fully onboarded. You can now accept bookings and receive payouts."
              : "Stripe is still verifying your details. This can take a moment — we'll update your status automatically."}
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
