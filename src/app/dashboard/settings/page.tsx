import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/settings");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, stripe_onboarded")
    .eq("id", user.id)
    .single();

  return (
    <div className="container max-w-xl space-y-6 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SettingsForm
        defaultFullName={profile?.full_name ?? ""}
        defaultBio={profile?.bio ?? ""}
        email={user.email ?? ""}
      />
      <div className="rounded-xl border p-4">
        <p className="font-medium">Payouts</p>
        <p className="mb-3 text-sm text-muted-foreground">
          {profile?.stripe_onboarded
            ? "Stripe payouts are connected."
            : "Connect Stripe to receive payouts as a lender."}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/onboarding">Manage payouts</Link>
        </Button>
      </div>
    </div>
  );
}
