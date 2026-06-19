import Link from "next/link";
import { Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { APP_NAME } from "@/lib/constants";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null; avatar_url: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const t = await getTranslations("nav");

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border"
      style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)" }}
    >
      <div
        className="flex h-16 items-center justify-between px-6"
        style={{ maxWidth: "var(--container-max, 1280px)", margin: "0 auto" }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-[9px] text-foreground no-underline"
          style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em" }}
        >
          <Package className="h-6 w-6 text-primary shrink-0" />
          {APP_NAME}
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-7">
          <Link href="/browse" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors no-underline">
            {t("browse")}
          </Link>
          <Link href="/browse?segment=pro" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors no-underline">
            {t("proGear")}
          </Link>
          <Link href="/#how-it-works" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors no-underline">
            {t("howItWorks")}
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex font-semibold">
                <Link href="/listings/new">{t("listItem")}</Link>
              </Button>
              <UserMenu
                email={user.email ?? ""}
                fullName={profile?.full_name ?? null}
                avatarUrl={profile?.avatar_url ?? null}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden font-semibold text-muted-foreground hover:text-foreground sm:inline-flex">
                <Link href="/listings/new">{t("listItem")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="font-semibold text-muted-foreground hover:text-foreground">
                <Link href="/login">{t("login")}</Link>
              </Button>
              <Button asChild size="sm" className="bg-primary text-white hover:bg-primary/90 font-semibold">
                <Link href="/signup">{t("signup")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
