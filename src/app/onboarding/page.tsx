import { redirect } from "next/navigation";
import { CheckCircle2, CreditCard } from "lucide-react";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { startStripeOnboarding } from "@/app/actions/stripe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Payouts onboarding" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/onboarding");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_onboarded")
    .eq("id", user.id)
    .single();

  const onboarded = profile?.stripe_onboarded;

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <CardTitle>Receive payouts with Stripe</CardTitle>
          <CardDescription>
            To accept bookings and get paid, connect a Stripe Express account.
            Trodplas never sees your bank details — Stripe handles everything.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {onboarded ? (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm">Your payouts are set up. You can accept bookings.</p>
            </div>
          ) : (
            <form action={startStripeOnboarding}>
              <SubmitButton className="w-full" pendingText="Redirecting to Stripe…">
                {profile?.stripe_account_id ? "Continue onboarding" : "Connect with Stripe"}
              </SubmitButton>
            </form>
          )}
          <Button asChild variant="ghost" className="w-full">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
