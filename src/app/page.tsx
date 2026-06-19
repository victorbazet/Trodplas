import Link from "next/link";
import { Search, MapPin, Calendar, ShieldCheck, Lock, Star, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getListings } from "@/lib/data/listings";
import { ListingCard } from "@/components/listing-card";

export default async function LandingPage() {
  const [t, featuredListings] = await Promise.all([
    getTranslations("home"),
    getListings({ segment: "pro" }).then((l) => l.slice(0, 4)).catch(() => []),
  ]);

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white" style={{ background: "hsl(222,47%,11%)" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 400px at 78% -10%, hsl(158 64% 32% / 0.55), transparent 60%), radial-gradient(700px 500px at 10% 120%, hsl(160 66% 20% / 0.5), transparent 55%)",
          }}
        />

        <div
          className="relative flex flex-col items-center px-6 text-center"
          style={{ maxWidth: 1280, margin: "0 auto", paddingTop: 84, paddingBottom: 96, gap: 24 }}
        >
          {/* Badge */}
          <span
            className="inline-flex items-center gap-2 text-white"
            style={{
              padding: "6px 14px",
              borderRadius: 9999,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ShieldCheck className="h-[15px] w-[15px] shrink-0" />
            {t("badge")}
          </span>

          {/* Headline */}
          <h1
            className="m-0 text-white"
            style={{ fontWeight: 800, fontSize: "clamp(2.5rem, 6vw, 3.75rem)", lineHeight: 1.05, letterSpacing: "-0.03em", maxWidth: 880 }}
          >
            {t("headline").split("\n").map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="m-0" style={{ color: "hsl(213,27%,84%)", fontSize: 19, lineHeight: 1.6, maxWidth: 620 }}>
            {t("subhead")}
          </p>

          {/* Segment switcher */}
          <div style={{ marginTop: 6 }}>
            <div
              className="inline-flex gap-1"
              style={{ padding: 4, borderRadius: 9999, background: "hsl(210 40% 96%)", border: "1px solid hsl(214 32% 91%)" }}
            >
              <Link
                href="/browse?segment=consumer"
                className="font-semibold text-muted-foreground no-underline transition-all hover:bg-white hover:text-foreground hover:shadow-sm"
                style={{ padding: "0.5rem 1.1rem", borderRadius: 9999, fontSize: "var(--text-sm, 0.875rem)" }}
              >
                {t("segmentEveryday")}
              </Link>
              <Link
                href="/browse?segment=pro"
                className="font-semibold text-foreground no-underline"
                style={{ padding: "0.5rem 1.1rem", borderRadius: 9999, background: "#fff", boxShadow: "0 1px 3px 0 hsl(222 47% 11% / 0.07), 0 1px 2px -1px hsl(222 47% 11% / 0.06)", fontSize: "var(--text-sm, 0.875rem)" }}
              >
                {t("segmentPro")}
              </Link>
            </div>
          </div>

          {/* Search bar */}
          <div
            className="flex w-full items-center gap-1"
            style={{ maxWidth: 720, marginTop: 4, background: "#fff", border: "1px solid hsl(214 32% 91%)", borderRadius: 9999, boxShadow: "0 4px 12px -2px hsl(222 47% 11% / 0.08), 0 2px 6px -2px hsl(222 47% 11% / 0.06)", padding: 6 }}
          >
            <div className="flex flex-1 items-center gap-2.5 px-4 py-2.5 min-w-0">
              <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
              <div className="flex flex-col min-w-0">
                <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t("searchWhat")}</span>
                <span className="truncate text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>{t("searchWhatPlaceholder")}</span>
              </div>
            </div>
            <div style={{ width: 1, height: 34, background: "hsl(214 32% 91%)" }} />
            <div className="flex shrink-0 items-center gap-2.5 px-4 py-2.5">
              <MapPin className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t("searchWhere")}</span>
                <span className="text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>{t("searchWherePlaceholder")}</span>
              </div>
            </div>
            <div style={{ width: 1, height: 34, background: "hsl(214 32% 91%)" }} />
            <div className="flex shrink-0 items-center gap-2.5 px-4 py-2.5">
              <Calendar className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t("searchWhen")}</span>
                <span className="text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>{t("searchWhenAny")}</span>
              </div>
            </div>
            <Link
              href="/browse"
              className="flex shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
              style={{ height: 52, width: 52 }}
            >
              <Search className="h-5 w-5" />
            </Link>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3" style={{ marginTop: 8 }}>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-90 no-underline"
              style={{ height: "2.875rem", padding: "0 1.5rem", borderRadius: "0.45rem", background: "hsl(38,92%,50%)", color: "hsl(222,47%,11%)", fontSize: "1rem" }}
            >
              {t("ctaFind")} <ArrowRight className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href="/listings/new"
              className="inline-flex items-center font-semibold text-white transition-colors hover:bg-white/15 no-underline"
              style={{ height: "2.875rem", padding: "0 1.5rem", borderRadius: "0.45rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", fontSize: "1rem" }}
            >
              {t("ctaList")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white px-6" style={{ paddingTop: 72, paddingBottom: 72 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="mb-12 text-center">
            <h2 className="m-0" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em" }}>
              {t("howItWorksTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground" style={{ fontSize: 16 }}>
              {t("howItWorksSubtitle")}
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {(
              [
                { n: t("step1n"), title: t("step1Title"), text: t("step1Desc") },
                { n: t("step2n"), title: t("step2Title"), text: t("step2Desc") },
                { n: t("step3n"), title: t("step3Title"), text: t("step3Desc") },
              ] as const
            ).map((step) => (
              <div key={step.n} className="flex flex-col gap-3">
                <span className="font-mono text-sm font-semibold text-primary">{step.n}</span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular pro & creative gear ─────────────────────────────────── */}
      {featuredListings.length > 0 && (
        <section
          className="px-6"
          style={{
            background: "hsl(210 40% 98%)",
            borderTop: "1px solid hsl(214 32% 91%)",
            borderBottom: "1px solid hsl(214 32% 91%)",
            paddingTop: 72,
            paddingBottom: 72,
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div className="mb-7 flex items-end justify-between">
              <div>
                <h2 className="m-0" style={{ fontWeight: 700, fontSize: 30, letterSpacing: "-0.02em" }}>
                  {t("popularTitle")}
                </h2>
                <p className="m-0 mt-1.5 text-muted-foreground" style={{ fontSize: 16 }}>
                  {t("popularSubtitle")}
                </p>
              </div>
              <Link
                href="/browse?segment=pro"
                className="flex items-center gap-1.5 font-semibold text-primary no-underline hover:opacity-80 transition-opacity"
                style={{ fontSize: 15 }}
              >
                {t("popularSeeAll")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust signals ──────────────────────────────────────────────── */}
      <section className="bg-white px-6" style={{ paddingTop: 72, paddingBottom: 72 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: t("trust1Title"), text: t("trust1Desc") },
              { icon: Lock, title: t("trust2Title"), text: t("trust2Desc") },
              { icon: Star, title: t("trust3Title"), text: t("trust3Desc") },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────── */}
      <section className="px-6 text-white" style={{ background: "hsl(222,47%,11%)", paddingTop: 64, paddingBottom: 64 }}>
        <div
          className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between"
          style={{ maxWidth: 1280, margin: "0 auto" }}
        >
          <div>
            <h2 className="m-0" style={{ fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 1.875rem)", letterSpacing: "-0.02em" }}>
              {t("ctaBannerTitle")}
            </h2>
            <p className="mt-2" style={{ color: "hsl(213,27%,84%)", maxWidth: 480 }}>
              {t("ctaBannerDesc")}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/listings/new"
              className="inline-flex items-center font-semibold text-white no-underline transition-opacity hover:opacity-90"
              style={{ height: "2.875rem", padding: "0 1.5rem", borderRadius: "0.45rem", background: "hsl(158 64% 32%)", fontSize: "1rem" }}
            >
              {t("ctaBannerCta")}
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center font-semibold text-white no-underline transition-colors hover:bg-white/15"
              style={{ height: "2.875rem", padding: "0 1.5rem", borderRadius: "0.45rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", fontSize: "1rem" }}
            >
              {t("ctaBannerSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
