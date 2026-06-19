"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCents } from "@/lib/utils";
import type { ListingWithRelations } from "@/types";
import type { ListingCategory } from "@/types/database";

export function ListingCard({ listing }: { listing: ListingWithRelations }) {
  const tc = useTranslations("categories");
  const tl = useTranslations("listing");
  const cover = listing.images?.[0]?.url;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden bg-white no-underline"
      style={{
        border: "1px solid hsl(214 32% 91%)",
        borderRadius: "1rem",
        boxShadow: "0 1px 3px 0 hsl(222 47% 11% / 0.07), 0 1px 2px -1px hsl(222 47% 11% / 0.06)",
        transition: "box-shadow 200ms cubic-bezier(0.22,1,0.36,1), transform 200ms cubic-bezier(0.22,1,0.36,1)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow =
          "0 12px 28px -6px hsl(222 47% 11% / 0.12), 0 6px 12px -6px hsl(222 47% 11% / 0.08)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow =
          "0 1px 3px 0 hsl(222 47% 11% / 0.07), 0 1px 2px -1px hsl(222 47% 11% / 0.06)";
        (e.currentTarget as HTMLAnchorElement).style.transform = "none";
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "4/3", background: "hsl(210 40% 96%)" }}>
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {tl("noPhoto")}
          </div>
        )}
        {listing.segment === "pro" && (
          <span
            className="absolute left-3 top-3 inline-flex items-center text-white"
            style={{
              fontSize: "var(--text-xs, 0.75rem)",
              fontWeight: 600,
              lineHeight: 1,
              padding: "0.3rem 0.6rem",
              borderRadius: 9999,
              background: "hsl(222 47% 11%)",
            }}
          >
            Pro
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1" style={{ padding: "1rem", fontFamily: "var(--font-plus-jakarta-sans, sans-serif)" }}>
        <div className="flex items-center justify-between gap-2">
          <span
            className="text-muted-foreground"
            style={{ fontSize: "var(--text-xs, 0.75rem)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}
          >
            {tc(listing.category as ListingCategory)}
          </span>
        </div>
        <h3
          className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-foreground"
          style={{ fontSize: "var(--text-base, 1rem)" }}
        >
          {listing.title}
        </h3>
        {listing.city && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {listing.city}
          </span>
        )}
        <div className="mt-2" style={{ fontSize: "var(--text-base, 1rem)", fontWeight: 700, color: "hsl(var(--foreground))" }}>
          {formatCents(listing.price_per_day)}
          <span style={{ fontWeight: 400, color: "hsl(var(--muted-foreground))" }}> {tl("perDay")}</span>
        </div>
      </div>
    </Link>
  );
}
