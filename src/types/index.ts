// Domain-level composite types used across the UI.
import type {
  Booking,
  Listing,
  ListingImage,
  Profile,
  Review,
} from "./database";

export * from "./database";

/** A listing joined with its images and owner — what listing cards/pages consume. */
export type ListingWithRelations = Listing & {
  images: ListingImage[];
  owner: Pick<Profile, "id" | "full_name" | "avatar_url" | "is_verified">;
};

/** A booking joined with its listing (and that listing's first image + owner). */
export type BookingWithRelations = Booking & {
  listing: Listing & {
    images: ListingImage[];
    owner: Pick<Profile, "id" | "full_name" | "avatar_url">;
  };
  renter: Pick<Profile, "id" | "full_name" | "avatar_url">;
};

export type ReviewWithReviewer = Review & {
  reviewer: Pick<Profile, "id" | "full_name" | "avatar_url">;
};
