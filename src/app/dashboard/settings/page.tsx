import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/settings");

  const supabase = await createClient();
  const [{ data: profile }, t] = await Promise.all([
    supabase.from("profiles").select("full_name, bio, stripe_onboarded").eq("id", user.id).single(),
    getTranslations("settings"),
  ]);

  return (
    <div className="container max-w-xl space-y-6 py-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <SettingsForm
        defaultFullName={profile?.full_name ?? ""}
        defaultBio={profile?.bio ?? ""}
        email={user.email ?? ""}
      />
      <div className="rounded-xl border p-4">
        <p className="font-medium">{t("payouts")}</p>
        <p className="mb-3 text-sm text-muted-foreground">
          {profile?.stripe_onboarded ? t("payoutsConnected") : t("payoutsNotConnected")}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/onboarding">{t("managePayouts")}</Link>
        </Button>
      </div>
    </div>
  );
}
