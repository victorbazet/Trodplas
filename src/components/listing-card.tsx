import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCents } from "@/lib/utils";
import { categoryLabel } from "@/lib/constants";
import type { ListingWithRelations } from "@/types";

export function ListingCard({ listing }: { listing: ListingWithRelations }) {
  const cover = listing.images?.[0]?.url;
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-muted">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No photo
          </div>
        )}
        {listing.segment === "pro" && (
          <Badge className="absolute left-2 top-2" variant="default">
            Pro
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{categoryLabel(listing.category)}</span>
        </div>
        <h3 className="line-clamp-1 font-medium">{listing.title}</h3>
        {listing.city && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {listing.city}
          </p>
        )}
        <p className="mt-auto pt-2 font-semibold">
          {formatCents(listing.price_per_day)}
          <span className="font-normal text-muted-foreground"> / day</span>
        </p>
      </div>
    </Link>
  );
}
