import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { BrowseFilters } from "@/components/browse-filters";
import { ListingCard } from "@/components/listing-card";
import { getListings, type BrowseFilters as Filters } from "@/lib/data/listings";
import type { ListingCategory, ListingSegment } from "@/types";

export const metadata = { title: "Explorer" };

type SearchParams = Promise<Record<string, string | undefined>>;

function toFilters(sp: Record<string, string | undefined>): Filters {
  return {
    category: sp.category as ListingCategory | undefined,
    segment: sp.segment as ListingSegment | undefined,
    city: sp.city,
    startDate: sp.startDate,
    endDate: sp.endDate,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
  };
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const [sp, t] = await Promise.all([searchParams, getTranslations("browse")]);
  const listings = await getListings(toFilters(sp));

  return (
    <div className="container space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{t("itemsAvailable", { count: listings.length })}</p>
      </div>

      <Suspense fallback={<div className="h-32 rounded-xl border" />}>
        <BrowseFilters />
      </Suspense>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          {t("noResults")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
