import Link from "next/link";
import { Package } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { APP_NAME } from "@/lib/constants";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer
      className="border-t border-border"
      style={{ background: "hsl(210 40% 98%)", marginTop: 64 }}
    >
      <div
        className="px-6 py-12"
        style={{ maxWidth: "var(--container-max, 1280px)", margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32 }}
      >
        {/* Brand */}
        <div>
          <div className="flex items-center gap-[9px] mb-3">
            <Package className="h-[22px] w-[22px] text-primary shrink-0" />
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>{APP_NAME}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed" style={{ maxWidth: 260, margin: 0 }}>
            {t("tagline")}
          </p>
        </div>

        {/* Rent */}
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-bold text-foreground">{t("rent")}</span>
          <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("browseGear")}</Link>
          <Link href="/browse?segment=pro" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("proCreative")}</Link>
          <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("cities")}</Link>
          <Link href="/#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("howItWorks")}</Link>
        </div>

        {/* Earn */}
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-bold text-foreground">{t("earn")}</span>
          <Link href="/listings/new" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("listGear")}</Link>
          <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("pricing")}</Link>
          <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("protection")}</Link>
          <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("payouts")}</Link>
        </div>

        {/* Company */}
        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-bold text-foreground">{t("company")}</span>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("about")}</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("trustSafety")}</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("helpCenter")}</Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">{t("contact")}</Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="px-6 pb-8 text-xs text-muted-foreground"
        style={{ maxWidth: "var(--container-max, 1280px)", margin: "0 auto" }}
      >
        {t("copyright", { appName: APP_NAME })}
      </div>
    </footer>
  );
}
