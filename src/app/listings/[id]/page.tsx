import { notFound } from "next/navigation";
import { MapPin, Star, BadgeCheck, ShieldCheck } from "lucide-react";
import { getListingById, getListingBlockedRanges } from "@/lib/data/listings";
import { getReviewsForUser, averageRating } from "@/lib/data/reviews";
import { getCurrentUser } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";
import { ImageGallery } from "@/components/image-gallery";
import { BookingWidget } from "@/components/booking-widget";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCents, formatDateRange } from "@/lib/utils";
import { categoryLabel } from "@/lib/constants";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const [blocked, reviews, user] = await Promise.all([
    getListingBlockedRanges(id),
    getReviewsForUser(listing.owner.id),
    getCurrentUser(),
  ]);
  const avg = averageRating(reviews);

  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-[1fr_380px]">
      {/* Left: gallery + details */}
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{categoryLabel(listing.category)}</Badge>
            <Badge variant={listing.segment === "pro" ? "default" : "outline"}>
              {listing.segment === "pro" ? "Pro / Creative" : "Everyday"}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">{listing.title}</h1>
          {listing.city && (
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {listing.city}
            </p>
          )}
        </div>

        <ImageGallery images={listing.images ?? []} title={listing.title} />

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">About this item</h2>
          <p className="whitespace-pre-line text-muted-foreground">
            {listing.description || "No description provided."}
          </p>
        </section>

        {/* Owner */}
        <section className="flex items-center gap-3 rounded-xl border p-4">
          <Avatar>
            {listing.owner.avatar_url ? (
              <AvatarImage src={listing.owner.avatar_url} alt={listing.owner.full_name ?? ""} />
            ) : null}
            <AvatarFallback>
              {(listing.owner.full_name ?? "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="flex items-center gap-1 font-medium">
              {listing.owner.full_name ?? "Owner"}
              {listing.owner.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
            </p>
            <p className="text-sm text-muted-foreground">
              {avg ? (
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {avg.toFixed(1)} · {reviews.length} review(s)
                </span>
              ) : (
                "No reviews yet"
              )}
            </p>
          </div>
        </section>

        {/* Availability (blocked windows) */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Availability</h2>
          {blocked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No blocked dates — likely available. Send a request to confirm.
            </p>
          ) : (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {blocked.map((b, i) => (
                <li key={i} className="rounded-md bg-muted px-3 py-1.5">
                  Unavailable: {formatDateRange(b.start_date, b.end_date)}
                </li>
              ))}
            </ul>
          )}
          {/* TODO: render an interactive availability calendar (react-day-picker)
              with blocked ranges disabled. */}
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Reviews</h2>
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium">{r.reviewer.full_name ?? "User"}</span>
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
              </div>
            ))}
          </section>
        )}
      </div>

      {/* Right: sticky booking widget */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <BookingWidget
          listingId={listing.id}
          pricePerDay={listing.price_per_day}
          depositAmount={listing.deposit_amount}
          feeBps={serverEnv.platformFeeBps}
          isOwner={user?.id === listing.owner.id}
          isLoggedIn={Boolean(user)}
        />
        {listing.deposit_amount > 0 && (
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            A refundable deposit of {formatCents(listing.deposit_amount)} is held on your card
            (not charged) and released after a successful return.
          </p>
        )}
      </aside>
    </div>
  );
}
