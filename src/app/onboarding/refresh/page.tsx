import { startStripeOnboarding } from "@/app/actions/stripe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";

export const metadata = { title: "Resume onboarding" };

/**
 * Stripe sends the user here if the onboarding link expired or was interrupted.
 * We immediately generate a fresh link.
 */
export default function OnboardingRefreshPage() {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>Resume Stripe onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Your previous onboarding link expired. Click below to continue.
          </p>
          <form action={startStripeOnboarding}>
            <SubmitButton className="w-full" pendingText="Redirecting…">
              Continue
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
