import Link from "next/link";
import Image from "next/image";
import { Plus, CreditCard, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import {
  getMyListings,
  getBookingsAsRenter,
  getBookingsAsLender,
} from "@/lib/data/bookings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatCents, formatDateRange } from "@/lib/utils";
import type { BookingWithRelations } from "@/types";
import type { ListingCategory } from "@/types/database";

export const metadata = { title: "Tableau de bord" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const supabase = await createClient();
  const [{ data: profile }, listings, asRenter, asLender, t, tc] = await Promise.all([
    supabase.from("profiles").select("stripe_onboarded, stripe_account_id").eq("id", user.id).single(),
    getMyListings(user.id),
    getBookingsAsRenter(user.id),
    getBookingsAsLender(user.id),
    getTranslations("dashboard"),
    getTranslations("categories"),
  ]);

  const needsStripe = !profile?.stripe_onboarded;

  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <Button asChild>
          <Link href="/listings/new">
            <Plus className="h-4 w-4" /> {t("newListing")}
          </Link>
        </Button>
      </div>

      {needsStripe && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3 text-amber-800">
            <CreditCard className="h-5 w-5" />
            <p className="text-sm">{t("stripeWarning")}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/onboarding">{t("stripeConnect")}</Link>
          </Button>
        </div>
      )}

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">{t("myListings", { count: listings.length })}</TabsTrigger>
          <TabsTrigger value="renting">{t("renting", { count: asRenter.length })}</TabsTrigger>
          <TabsTrigger value="lending">{t("lending", { count: asLender.length })}</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          {listings.length === 0 ? (
            <Empty text={t("emptyListings")} cta={{ href: "/listings/new", label: t("createListing") }} />
          ) : (
            <div className="divide-y rounded-xl border">
              {listings.map((l) => (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-accent"
                >
                  <Thumb url={l.images?.[0]?.url} />
                  <div className="flex-1">
                    <p className="font-medium">{l.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {tc(l.category as ListingCategory)} · {formatCents(l.price_per_day)}{t("perDay")}
                    </p>
                  </div>
                  <Badge variant={l.status === "active" ? "success" : "outline"}>{l.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="renting">
          <BookingList bookings={asRenter} emptyText={t("emptyRenting")} perspective="renter" />
        </TabsContent>

        <TabsContent value="lending">
          <BookingList bookings={asLender} emptyText={t("emptyLending")} perspective="lender" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingList({
  bookings,
  emptyText,
  perspective,
}: {
  bookings: BookingWithRelations[];
  emptyText: string;
  perspective: "renter" | "lender";
}) {
  if (bookings.length === 0) return <Empty text={emptyText} />;
  return (
    <div className="divide-y rounded-xl border">
      {bookings.map((b) => (
        <Link
          key={b.id}
          href={`/dashboard/bookings/${b.id}`}
          className="flex items-center gap-4 p-4 hover:bg-accent"
        >
          <Thumb url={b.listing.images?.[0]?.url} />
          <div className="flex-1">
            <p className="font-medium">{b.listing.title}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(b.start_date, b.end_date)} · {formatCents(b.total_amount)}
              {perspective === "lender" && b.renter.full_name ? ` · ${b.renter.full_name}` : ""}
            </p>
          </div>
          {perspective === "lender" && b.status === "pending" && !b.stripe_payment_intent_id && (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <BookingStatusBadge booking={b} />
        </Link>
      ))}
    </div>
  );
}

function Thumb({ url }: { url?: string }) {
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
      {url ? <Image src={url} alt="" fill sizes="56px" className="object-cover" /> : null}
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <p className="text-muted-foreground">{text}</p>
      {cta && (
        <Button asChild className="mt-4" variant="outline">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
